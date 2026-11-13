package com.sgsk.wealth.e2e.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;

@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan(basePackages = "com.sgsk.wealth.e2e")
@EnableConfigurationProperties(E2eProperties.class)
public class E2eTestApplication {

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}
