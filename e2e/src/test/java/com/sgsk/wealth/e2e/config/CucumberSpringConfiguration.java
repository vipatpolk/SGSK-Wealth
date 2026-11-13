package com.sgsk.wealth.e2e.config;

import io.cucumber.spring.CucumberContextConfiguration;
import org.springframework.boot.test.context.SpringBootTest;

@CucumberContextConfiguration
@SpringBootTest(classes = E2eTestApplication.class, webEnvironment = SpringBootTest.WebEnvironment.NONE)
public class CucumberSpringConfiguration {
}
