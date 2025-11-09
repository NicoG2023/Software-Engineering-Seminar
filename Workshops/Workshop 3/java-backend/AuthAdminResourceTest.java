package org.auth.resources;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.core.Response;
import org.auth.resources.AuthAdminResource.CreateUserReq;
import org.auth.service.KcAdminService;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests puros de AuthAdminResource.
 * Se mockea KcAdminService y se invocan los métodos directamente (sin levantar Quarkus).
 */
public class AuthAdminResourceTest {

    @Test
    void createUser_ok_returns201AndId() {
        // Arrange
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);

        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        CreateUserReq req = new CreateUserReq();
        req.username = "nico";
        req.email = "nico@example.com";
        req.password = "S3cretPwd!";
        req.emailVerified = true;
        req.enabled = true;

        String expectedId = "5b2a9f0a-8d7a-4b1e-9c2b-1234567890ab";

        when(kc.createUser("nico", "nico@example.com", true, true))
                .thenReturn(expectedId);

        // Act
        Response response = resource.createUser(req);

        // Assert
        assertEquals(Response.Status.CREATED.getStatusCode(), response.getStatus());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getEntity();
        assertNotNull(body);
        assertEquals(expectedId, body.get("id"));

        verify(kc).createUser("nico", "nico@example.com", true, true);
        verify(kc).setPassword(expectedId, "S3cretPwd!", false);
    }

    @Test
    void createUser_missingFields_throwsBadRequest() {
        // Arrange
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);

        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        CreateUserReq req = new CreateUserReq();
        req.username = "aleja";
        // Falta email y password

        // Act + Assert
        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> resource.createUser(req)
        );

        assertTrue(ex.getMessage().contains("username, email and password are required"));

        verifyNoInteractions(kc);
    }
}
