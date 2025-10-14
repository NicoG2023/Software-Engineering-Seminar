package org.auth.config;

import org.eclipse.microprofile.openapi.annotations.OpenAPIDefinition;
import org.eclipse.microprofile.openapi.annotations.info.Info;
import org.eclipse.microprofile.openapi.annotations.security.SecurityScheme;
import org.eclipse.microprofile.openapi.annotations.enums.SecuritySchemeType;

@OpenAPIDefinition(
    info = @Info(
        title = "Cinema Auth Admin API",
        version = "1.0.0",
        description = "Administrative endpoints against Keycloak for the ‘cinema’ realm"
    )
)
@SecurityScheme(
    securitySchemeName = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT"
)
public class OpenApiConfig {
}
