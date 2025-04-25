
package com.example.gateway_admin.Config;

import com.example.gateway_admin.Entities.AllowedIps;
import com.example.gateway_admin.Entities.GatewayRoute;
import com.example.gateway_admin.Entities.RateLimit;
import com.example.gateway_admin.Repositories.AllowedIpRepository;
import com.example.gateway_admin.Repositories.GatewayRouteRepository;
import com.example.gateway_admin.Repositories.RateLimitRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
//@Profile("admin")
public class LoadData {

    @Bean
    public CommandLineRunner dataLoader(
            GatewayRouteRepository routeRepo,
            AllowedIpRepository ipRepo,
            RateLimitRepository rateLimitRepo
    ) {
        return args -> {
            // --- Route #1: IP filtering disabled, token validation and rate limiting disabled
            String predicate1 = "/server-final/**";
            GatewayRoute route1 = routeRepo.findByPredicates(predicate1);
            if (route1 == null) {
                route1 = new GatewayRoute();
            }
            route1.setRouteId("final-server1-secure-route");
            route1.setUri("http://localhost:8050");
            route1.setPredicates(predicate1);
            route1.setWithIpFilter(false);
            route1.setWithToken(false);
            route1.setWithRateLimit(false);
            route1 = routeRepo.save(route1);

            // Update Allowed IP for Route #1:
            AllowedIps ip1;
            if (route1.getAllowedIps() == null || route1.getAllowedIps().isEmpty()) {
                ip1 = new AllowedIps();
            } else {
                ip1 = route1.getAllowedIps().get(0);
            }
            ip1.setIp("192.168.10.101");
            ip1.setGatewayRoute(route1);
            ipRepo.save(ip1);

            // Update RateLimit for Route #1:
            RateLimit rl1 = route1.getRateLimit();
            if (rl1 == null) {
                rl1 = new RateLimit();
            }
            rl1.setRouteId(route1.getId());
            rl1.setMaxRequests(100);
            rl1.setTimeWindowMs(60000);
            rateLimitRepo.save(rl1);
            route1.setRateLimit(rl1);
            routeRepo.save(route1);

            System.out.println("Route #1 data loaded successfully!");

            // --- Route #2: IP filtering enabled, rate limiting enabled; token validation disabled
            String predicate2 = "/server-final2/**";
            GatewayRoute route2 = routeRepo.findByPredicates(predicate2);
            if (route2 == null) {
                route2 = new GatewayRoute();
            }
            route2.setRouteId("final-server2-secure-route");
            route2.setUri("http://localhost:8060");
            route2.setPredicates(predicate2);
            route2.setWithIpFilter(true);
            route2.setWithToken(false);
            route2.setWithRateLimit(true);
            route2 = routeRepo.save(route2);

            // Update Allowed IP for Route #2:
            AllowedIps ip2;
            if (route2.getAllowedIps() == null || route2.getAllowedIps().isEmpty()) {
                ip2 = new AllowedIps();
            } else {
                ip2 = route2.getAllowedIps().get(0);
            }
            ip2.setIp("127.0.0.1");
            ip2.setGatewayRoute(route2);
            ipRepo.save(ip2);

            // Update RateLimit for Route #2:
            RateLimit rl2 = route2.getRateLimit();
            if (rl2 == null) {
                rl2 = new RateLimit();
            }
            rl2.setRouteId(route2.getId());
            rl2.setMaxRequests(10);
            rl2.setTimeWindowMs(60000);
            rateLimitRepo.save(rl2);
            route2.setRateLimit(rl2);
            routeRepo.save(route2);

            System.out.println("Route #2 data loaded successfully!");
        };
    }
}


