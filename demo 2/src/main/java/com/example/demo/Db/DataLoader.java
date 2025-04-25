/*
package com.example.demo.Db;

import com.example.demo.Entity.AllowedIp;
import com.example.demo.Entity.GatewayRoute;
import com.example.demo.Entity.RateLimit;
import com.example.demo.Repository.AllowedIpRepository;
import com.example.demo.Repository.GatewayRouteRepository;
import com.example.demo.Repository.RateLimitRepository;
import jakarta.transaction.Transactional;
import org.springframework.boot.CommandLineRunner;
import org.springframework.cloud.gateway.event.RefreshRoutesEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class DataLoader {

    private static final Logger logger = LoggerFactory.getLogger(DataLoader.class);

    @Bean
    public CommandLineRunner loadData(
            GatewayRouteRepository routeRepo,
            AllowedIpRepository ipRepo,
            RateLimitRepository rateLimitRepo,
            ApplicationEventPublisher publisher
    ) {
        return args -> loadDatabase(routeRepo, ipRepo, rateLimitRepo, publisher);
    }

    @Transactional
    public void loadDatabase(
            GatewayRouteRepository routeRepo,
            AllowedIpRepository ipRepo,
            RateLimitRepository rateLimitRepo,
            ApplicationEventPublisher publisher
    ) {
        logger.info("Starting data load...");

        // ------------------ Route #1 ------------------
        GatewayRoute route1 = new GatewayRoute();
        route1.setRouteId("final-server1-secure-route");
        route1.setUri("http://localhost:8050");
        route1.setPredicates("/server-final/**");
        route1.setWithIpFilter(true);
        route1.setWithToken(true);
        route1.setWithRateLimit(true); // Enable rate limiting

        // Save route1 and flush so that an ID is generated
        route1 = routeRepo.save(route1);
        routeRepo.flush();
        logger.info("Route1 saved with id: {}", route1.getId());

        // Allowed IP for Route #1
        AllowedIp ip1 = new AllowedIp();
        ip1.setIp("192.168.10.187");
        ip1.setGatewayRoute(route1);
        ipRepo.save(ip1);
        ipRepo.flush();
        logger.info("AllowedIp for Route1 saved.");

        // Create and save RateLimit for Route #1
        RateLimit rl1 = new RateLimit();
        rl1.setMaxRequests(3);
        rl1.setTimeWindowMs(60000);
        rl1.setRouteId(route1.getId());
        rl1 = rateLimitRepo.save(rl1);
        rateLimitRepo.flush();
        logger.info("RateLimit for Route1 saved with id: {}", rl1.getId());

        // Associate the RateLimit with Route #1 and update route1
        route1.setRateLimit(rl1);
        routeRepo.save(route1);
        routeRepo.flush();
        logger.info("Route1 updated with RateLimit.");

        // ------------------ Route #2 ------------------
        GatewayRoute route2 = new GatewayRoute();
        route2.setRouteId("final-server2-secure-route");
        route2.setUri("http://localhost:8060");
        route2.setPredicates("/server-final2/**");
        route2.setWithIpFilter(true);
        route2.setWithToken(false);
        route2.setWithRateLimit(true); // Enable rate limiting
        route2 = routeRepo.save(route2);
        routeRepo.flush();
        logger.info("Route2 saved with id: {}", route2.getId());

        // Allowed IP for Route #2
        AllowedIp ip2 = new AllowedIp();
        ip2.setIp("127.0.0.1");
        ip2.setGatewayRoute(route2);
        ipRepo.save(ip2);
        ipRepo.flush();
        logger.info("AllowedIp for Route2 saved.");

        // Create and save RateLimit for Route #2
        RateLimit rl2 = new RateLimit();
        rl2.setMaxRequests(10);
        rl2.setTimeWindowMs(60000);
        rl2.setRouteId(route2.getId());
        rl2 = rateLimitRepo.save(rl2);
        rateLimitRepo.flush();
        logger.info("RateLimit for Route2 saved with id: {}", rl2.getId());

        // Associate the RateLimit with Route #2 and update route2
        route2.setRateLimit(rl2);
        routeRepo.save(route2);
        routeRepo.flush();
        logger.info("Route2 updated with RateLimit.");

        logger.info("Data loaded successfully!");
        // Publish an event so that dynamic routes are reloaded in the gateway
        publisher.publishEvent(new RefreshRoutesEvent(this));
    }
}
*/
