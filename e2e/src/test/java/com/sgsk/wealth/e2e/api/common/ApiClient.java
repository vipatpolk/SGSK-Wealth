package com.sgsk.wealth.e2e.api.common;

import com.sgsk.wealth.e2e.core.config.E2eProperties;
import com.sgsk.wealth.e2e.core.context.TestContext;
import io.cucumber.spring.ScenarioScope;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

import java.util.Map;

import static io.restassured.RestAssured.given;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class ApiClient {
    private final TestContext context;
    private final E2eProperties properties;

    @Autowired
    public ApiClient(TestContext context, E2eProperties properties) {
        this.context = context;
        this.properties = properties;
    }

    private String apiKey() {
        return properties.backend().apiKey();
    }

    private String ownerBearerToken() {
        String prop = System.getProperty("e2e.auth.bearer");
        if (prop != null && !prop.isBlank()) {
            return prop.trim();
        }
        String env = System.getenv("E2E_AUTH_BEARER");
        return (env != null && !env.isBlank()) ? env.trim() : "mock-owner-jwt";
    }

    public Response getAuthorized(String endpoint) {
        Response response = given()
                .header("X-API-Key", apiKey())
                .header("Authorization", "Bearer " + ownerBearerToken())
                .get(endpoint);
        context.setLastApiResponse(response);
        return response;
    }

    public Response getAuthorized(String endpoint, Map<String, String> queryParams) {
        Response response = given()
                .header("X-API-Key", apiKey())
                .header("Authorization", "Bearer " + ownerBearerToken())
                .queryParams(queryParams)
                .get(endpoint);
        context.setLastApiResponse(response);
        return response;
    }

    public Response getAuthorizedWithQuery(String endpoint, String queryString) {
        String target = (queryString == null || queryString.isBlank()) ? endpoint : endpoint + "?" + queryString;
        return getAuthorized(target);
    }

    public Response postAuthorizedJson(String endpoint, String jsonBody) {
        Response response = given()
                .header("X-API-Key", apiKey())
                .header("Authorization", "Bearer " + ownerBearerToken())
                .contentType(ContentType.JSON)
                .body(jsonBody)
                .post(endpoint);
        context.setLastApiResponse(response);
        return response;
    }

    public Response getWithCustomHeader(String endpoint, String headerName, String headerValue) {
        Response response = given()
                .header(headerName, headerValue)
                .get(endpoint);
        context.setLastApiResponse(response);
        return response;
    }

    public Response sendApiKeyOnly(String method, String endpoint) {
        Response response = "POST".equalsIgnoreCase(method)
                ? given().header("X-API-Key", apiKey()).contentType(ContentType.JSON).body("{}").when().post(endpoint)
                : given().header("X-API-Key", apiKey()).when().get(endpoint);
        context.setLastApiResponse(response);
        return response;
    }

    public Response sendWithApiKeyAndBearer(String method, String endpoint, String bearerToken) {
        Response response = "POST".equalsIgnoreCase(method)
                ? given()
                        .header("X-API-Key", apiKey())
                        .header("Authorization", "Bearer " + bearerToken)
                        .contentType(ContentType.JSON)
                        .body("{}")
                        .when()
                        .post(endpoint)
                : given()
                        .header("X-API-Key", apiKey())
                        .header("Authorization", "Bearer " + bearerToken)
                        .when()
                        .get(endpoint);
        context.setLastApiResponse(response);
        return response;
    }

    public Response sendUnauthorized(String method, String endpoint) {
        Response response = "POST".equalsIgnoreCase(method)
                ? given().contentType(ContentType.JSON).body("{}").when().post(endpoint)
                : given().when().get(endpoint);
        context.setLastApiResponse(response);
        return response;
    }
}
