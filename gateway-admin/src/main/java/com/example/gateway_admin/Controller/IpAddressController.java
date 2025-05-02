package com.example.gateway_admin.Controller;

import com.example.gateway_admin.Entities.AllowedIps;
import com.example.gateway_admin.Entities.GatewayRoute;
import com.example.gateway_admin.Repositories.AllowedIpRepository;
import com.example.gateway_admin.Repositories.GatewayRouteRepository;
import com.example.gateway_admin.Services.DataSyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/ip-addresses")
public class IpAddressController {

    private final AllowedIpRepository allowedIpRepository;
    private final GatewayRouteRepository gatewayRouteRepository;

    @Autowired
    private DataSyncService dataSyncService;

    @PersistenceContext
    private EntityManager entityManager;

    public IpAddressController(AllowedIpRepository allowedIpRepository, GatewayRouteRepository gatewayRouteRepository) {
        this.allowedIpRepository = allowedIpRepository;
        this.gatewayRouteRepository = gatewayRouteRepository;
    }

    // GET: All IP addresses with improved detail
    @GetMapping
    public List<Map<String, Object>> getAllIpAddresses() {
        List<AllowedIps> ips = allowedIpRepository.findAll();

        return ips.stream().map(ip -> {
            Map<String, Object> result = new HashMap<>();
            result.put("id", ip.getId());
            result.put("ip", ip.getIp());
            result.put("gatewayRouteId", ip.getGatewayRouteId());

            // Add route details if available
            if (ip.getGatewayRoute() != null) {
                result.put("predicate", ip.getGatewayRoute().getPredicates());
                result.put("routeUri", ip.getGatewayRoute().getUri());
            }

            return result;
        }).collect(Collectors.toList());
    }

    // GET: Specific IP address by id
    @GetMapping("/{id}")
    public ResponseEntity<?> getIpAddressById(@PathVariable Long id) {
        return allowedIpRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST: Create a new IP address and assign it to a GatewayRoute
    @PostMapping
    @Transactional
    public ResponseEntity<?> createIpAddress(@RequestBody AllowedIps ipAddress) {
        try {
            // Log the incoming payload for debugging
            System.out.println("Add Request Received: ip = " + ipAddress.getIp() +
                    ", gatewayRoute.id = " + (ipAddress.getGatewayRoute() != null ? ipAddress.getGatewayRoute().getId() : "null"));

            // Validate that a gateway route id is provided
            if (ipAddress.getGatewayRoute() == null || ipAddress.getGatewayRoute().getId() == null) {
                return ResponseEntity.badRequest().body("Gateway route id is missing in the request payload.");
            }

            // Check if IP is valid
            if (!isValidIpAddress(ipAddress.getIp())) {
                return ResponseEntity.badRequest().body("Invalid IP address format. Please use IPv4 format (e.g., 192.168.1.1)");
            }

            // Look up the gateway route by its id
            GatewayRoute route = gatewayRouteRepository.findById(ipAddress.getGatewayRoute().getId())
                    .orElseThrow(() -> new RuntimeException("Gateway route not found with id "
                            + ipAddress.getGatewayRoute().getId()));

            // Check if this IP already exists for this route
            boolean ipExists = route.getAllowedIps().stream()
                    .anyMatch(ip -> ip.getIp().equals(ipAddress.getIp()));

            if (ipExists) {
                return ResponseEntity.badRequest().body("This IP is already assigned to this route");
            }

            // Associate the new IP address with the fetched GatewayRoute
            ipAddress.setGatewayRoute(route);

            // Add the IP address to the GatewayRoute's collection
            route.getAllowedIps().add(ipAddress);

            // Save the new AllowedIps record and log the result
            AllowedIps savedIp = allowedIpRepository.save(ipAddress);
            System.out.println("IP Address successfully added with id: " + savedIp.getId());

            // Trigger manual sync for immediate effect
            dataSyncService.syncRoutesToGatewaySchema();

            return ResponseEntity.ok(savedIp);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to add IP address: " + e.getMessage());
        }
    }

    // PUT: Update an existing IP address (and optionally change its GatewayRoute)
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateIpAddress(@PathVariable Long id, @RequestBody AllowedIps updatedIp) {
        try {
            AllowedIps existingIp = allowedIpRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Allowed IP not found with id " + id));

            // Update IP address
            existingIp.setIp(updatedIp.getIp());

            // Update gateway route if needed
            if (updatedIp.getGatewayRoute() != null && updatedIp.getGatewayRoute().getId() != null) {
                GatewayRoute newRoute = gatewayRouteRepository.findById(updatedIp.getGatewayRoute().getId())
                        .orElseThrow(() -> new RuntimeException("Gateway route not found with id " + updatedIp.getGatewayRoute().getId()));
                GatewayRoute oldRoute = existingIp.getGatewayRoute();

                if (!oldRoute.getId().equals(newRoute.getId())) {
                    oldRoute.getAllowedIps().remove(existingIp);
                    gatewayRouteRepository.save(oldRoute);
                    newRoute.getAllowedIps().add(existingIp);
                    existingIp.setGatewayRoute(newRoute);
                    gatewayRouteRepository.save(newRoute);
                }
            }

            AllowedIps savedIp = allowedIpRepository.save(existingIp);

            // Trigger manual sync
            dataSyncService.syncRoutesToGatewaySchema();

            return ResponseEntity.ok(savedIp);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update IP address: " + e.getMessage());
        }
    }

    // DELETE: Remove an IP address from both the database and its associated GatewayRoute
    @DeleteMapping("/{ipId}/gateway/{gatewayId}")
    @Transactional
    public ResponseEntity<?> deleteIpAddress(@PathVariable Long ipId, @PathVariable Long gatewayId) {
        try {
            AllowedIps ipToDelete = allowedIpRepository.findById(ipId)
                    .orElseThrow(() -> new RuntimeException("Allowed IP not found with id " + ipId));
            if (!ipToDelete.getGatewayRoute().getId().equals(gatewayId)) {
                throw new RuntimeException("IP address with id " + ipId +
                        " does not belong to gateway route with id " + gatewayId);
            }
            GatewayRoute route = ipToDelete.getGatewayRoute();
            route.getAllowedIps().remove(ipToDelete);
            gatewayRouteRepository.save(route);
            allowedIpRepository.delete(ipToDelete);

            // Trigger manual sync
            dataSyncService.syncRoutesToGatewaySchema();

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete IP address: " + e.getMessage());
        }
    }

    // Debugging endpoint
    @GetMapping("/debug")
    public Map<String, Object> debugIpAddresses() {
        Map<String, Object> debug = new HashMap<>();

        // Get all routes
        List<GatewayRoute> routes = gatewayRouteRepository.findAll();
        debug.put("routeCount", routes.size());

        // Count IPs
        List<AllowedIps> ips = allowedIpRepository.findAll();
        debug.put("ipCount", ips.size());

        // Get IP-route associations
        Map<Long, List<String>> ipsByRoute = new HashMap<>();
        for (GatewayRoute route : routes) {
            ipsByRoute.put(route.getId(),
                    route.getAllowedIps().stream()
                            .map(AllowedIps::getIp)
                            .collect(Collectors.toList()));
        }
        debug.put("ipsByRoute", ipsByRoute);

        return debug;
    }

    // Fix database sequences
    @PostMapping("/reset-sequences")
    public ResponseEntity<String> resetSequences() {
        try {
            // Execute native SQL to reset sequences
            entityManager.createNativeQuery(
                    "SELECT setval('admin.allowed_ips_id_seq', (SELECT MAX(id) FROM admin.allowed_ips));"
            ).executeUpdate();

            return ResponseEntity.ok("Sequences reset successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to reset sequences: " + e.getMessage());
        }
    }

    // Trigger manual sync
    @PostMapping("/trigger-sync")
    public ResponseEntity<String> triggerSync() {
        try {
            dataSyncService.syncRoutesToGatewaySchema();
            return ResponseEntity.ok("Manual synchronization triggered successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to trigger synchronization: " + e.getMessage());
        }
    }

    private boolean isValidIpAddress(String ip) {
        if (ip == null || ip.isEmpty()) {
            return false;
        }

        // Simple regex for IPv4 validation
        String ipv4Pattern = "^(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})$";
        if (!ip.matches(ipv4Pattern)) {
            return false;
        }

        // Check each octet
        String[] octets = ip.split("\\.");
        for (String octet : octets) {
            int value = Integer.parseInt(octet);
            if (value < 0 || value > 255) {
                return false;
            }
        }

        return true;
    }
}