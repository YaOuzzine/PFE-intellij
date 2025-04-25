package com.example.gateway_admin.Controller;

import com.example.gateway_admin.Entities.AllowedIps;
import com.example.gateway_admin.Entities.GatewayRoute;
import com.example.gateway_admin.Repositories.AllowedIpRepository;
import com.example.gateway_admin.Repositories.GatewayRouteRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/ip-addresses")
public class IpAddressController {

    private final AllowedIpRepository allowedIpRepository;
    private final GatewayRouteRepository gatewayRouteRepository;

    public IpAddressController(AllowedIpRepository allowedIpRepository, GatewayRouteRepository gatewayRouteRepository) {
        this.allowedIpRepository = allowedIpRepository;
        this.gatewayRouteRepository = gatewayRouteRepository;
    }

    // GET: All IP addresses
    @GetMapping
    public List<AllowedIps> getAllIpAddresses() {
        return allowedIpRepository.findAll();
    }

    // GET: Specific IP address by id
    @GetMapping("/{id}")
    public AllowedIps getIpAddressById(@PathVariable Long id) {
        return allowedIpRepository.findById(id).orElse(null);
    }

    // POST: Create a new IP address and assign it to a GatewayRoute
    @PostMapping
    @Transactional
    public AllowedIps createIpAddress(@RequestBody AllowedIps ipAddress) {
        // Log the incoming payload for debugging
        System.out.println("Add Request Received: ip = " + ipAddress.getIp() +
                ", gatewayRoute.id = " + (ipAddress.getGatewayRoute() != null ? ipAddress.getGatewayRoute().getId() : "null"));

        // Validate that a gateway route id is provided
        if (ipAddress.getGatewayRoute() == null || ipAddress.getGatewayRoute().getId() == null) {
            throw new RuntimeException("Gateway route id is missing in the request payload.");
        }

        // Look up the gateway route by its id
        GatewayRoute route = gatewayRouteRepository.findById(ipAddress.getGatewayRoute().getId())
                .orElseThrow(() -> new RuntimeException("Gateway route not found with id "
                        + ipAddress.getGatewayRoute().getId()));

        // Associate the new IP address with the fetched GatewayRoute
        ipAddress.setGatewayRoute(route);

        // Add the IP address to the GatewayRoute's collection if not already present
        if (!route.getAllowedIps().contains(ipAddress)) {
            route.getAllowedIps().add(ipAddress);
        }

        // Save the new AllowedIps record and log the result
        AllowedIps savedIp = allowedIpRepository.save(ipAddress);
        System.out.println("IP Address successfully added with id: " + savedIp.getId());
        return savedIp;
    }


    // PUT: Update an existing IP address (and optionally change its GatewayRoute)
    @PutMapping("/{id}")
    @Transactional
    public AllowedIps updateIpAddress(@PathVariable Long id, @RequestBody AllowedIps updatedIp) {
        AllowedIps existingIp = allowedIpRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Allowed IP not found with id " + id));

        existingIp.setIp(updatedIp.getIp());

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
        return allowedIpRepository.save(existingIp);
    }

    // DELETE: Remove an IP address from both the database and its associated GatewayRoute
    @DeleteMapping("/{ipId}/gateway/{gatewayId}")
    @Transactional
    public void deleteIpAddress(@PathVariable Long ipId, @PathVariable Long gatewayId) {
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
    }
}



  /*  @DeleteMapping("/{id}")
    public void deleteIpAddress(@PathVariable Long id,id) {

        GatewayRoute route = gatewayRouteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gateway route not found with id " +id));
        List<AllowedIps> ipsList= route.getAllowedIps();
     ipsList.remove(id)
        gatewayRouteRepository.save(route);
       // allowedIpRepository.deleteById(id);
    }*/
