package org.auth.resources;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.auth.resources.AuthAdminResource.CreateUserReq;
import org.auth.service.KcAdminService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Pure unit tests for AuthAdminResource.
 * KcAdminService and SecurityIdentity are mocked, the resource is
 * instantiated directly (no Quarkus runtime involved).
 */
public class AuthAdminResourceTest {

    /* ==================== POST /users ==================== */

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
        verifyNoMoreInteractions(kc);
    }

    @Test
    void createUser_missingFields_throwsBadRequest() {
        // Arrange
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        CreateUserReq req = new CreateUserReq();
        req.username = "aleja";
        // Missing email and password

        // Act + Assert
        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> resource.createUser(req)
        );

        assertTrue(ex.getMessage().contains("username, email and password are required"));
        verifyNoInteractions(kc);
    }

    /* ==================== PUT /users/{id}/password ==================== */

    @Test
    void setPassword_ok_withTemporaryFlagTrue() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "user-123";
        AuthAdminResource.PasswordReq req = new AuthAdminResource.PasswordReq();
        req.password = "N3wP4ss!";
        req.temporary = true;

        Response res = resource.setPassword(userId, req);

        assertEquals(Response.Status.NO_CONTENT.getStatusCode(), res.getStatus());
        verify(kc).setPassword(userId, "N3wP4ss!", true);
        verifyNoMoreInteractions(kc);
    }

    @Test
    void setPassword_ok_withTemporaryNull_defaultsToFalse() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "user-123";
        AuthAdminResource.PasswordReq req = new AuthAdminResource.PasswordReq();
        req.password = "N3wP4ss!";
        req.temporary = null; // should be treated as false

        Response res = resource.setPassword(userId, req);

        assertEquals(Response.Status.NO_CONTENT.getStatusCode(), res.getStatus());
        verify(kc).setPassword(userId, "N3wP4ss!", false);
        verifyNoMoreInteractions(kc);
    }

    @Test
    void setPassword_missingPassword_throwsBadRequest() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "user-123";
        AuthAdminResource.PasswordReq req = new AuthAdminResource.PasswordReq();
        // password is null

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> resource.setPassword(userId, req)
        );

        assertTrue(ex.getMessage().contains("password is required"));
        verifyNoInteractions(kc);
    }

    /* ==================== GET /users ==================== */

    @Test
    void listUsers_ok_delegatesToServiceAndReturnsJsonString() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String expectedJson = "[{\"id\":\"u1\",\"username\":\"nico\"}]";

        when(kc.listUsersRaw("nico", 0, 10)).thenReturn(expectedJson);

        Response res = resource.listUsers("nico", 0, 10);

        assertEquals(Response.Status.OK.getStatusCode(), res.getStatus());
        assertEquals(MediaType.APPLICATION_JSON_TYPE, res.getMediaType());
        assertEquals(expectedJson, res.getEntity());

        verify(kc).listUsersRaw("nico", 0, 10);
        verifyNoMoreInteractions(kc);
    }

    /* ==================== GET /users/{id} ==================== */

    @Test
    void getUser_ok_returnsUserJsonFromService() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "user-123";
        JsonObject userJson = Json.createObjectBuilder()
                .add("id", userId)
                .add("username", "nico")
                .build();

        when(kc.getUser(userId)).thenReturn(userJson);

        Response res = resource.getUser(userId);

        assertEquals(Response.Status.OK.getStatusCode(), res.getStatus());
        assertSame(userJson, res.getEntity());

        verify(kc).getUser(userId);
        verifyNoMoreInteractions(kc);
    }

    /* ==================== PUT /users/{id}/enabled ==================== */

    @Test
    void setEnabled_enableNonAdmin_doesNotLogout() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "user-123";
        AuthAdminResource.EnabledReq req = new AuthAdminResource.EnabledReq();
        req.enabled = true;

        when(kc.userHasRealmRole(userId, "admin")).thenReturn(false);

        Response res = resource.setEnabled(userId, req);

        assertEquals(Response.Status.NO_CONTENT.getStatusCode(), res.getStatus());
        verify(kc).userHasRealmRole(userId, "admin");
        verify(kc).setEnabled(userId, true);
        verify(kc, never()).logoutUser(anyString());
        verifyNoMoreInteractions(kc);
    }

    @Test
    void setEnabled_disableNonAdmin_logsOutUser() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "user-123";
        AuthAdminResource.EnabledReq req = new AuthAdminResource.EnabledReq();
        req.enabled = false;

        when(kc.userHasRealmRole(userId, "admin")).thenReturn(false);

        Response res = resource.setEnabled(userId, req);

        assertEquals(Response.Status.NO_CONTENT.getStatusCode(), res.getStatus());
        verify(kc).userHasRealmRole(userId, "admin");
        verify(kc).setEnabled(userId, false);
        verify(kc).logoutUser(userId);
        verifyNoMoreInteractions(kc);
    }

    @Test
    void setEnabled_enabledNull_throwsBadRequest() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "user-123";
        AuthAdminResource.EnabledReq req = new AuthAdminResource.EnabledReq();
        req.enabled = null;

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> resource.setEnabled(userId, req)
        );

        assertTrue(ex.getMessage().contains("enabled is required"));
        verifyNoInteractions(kc);
    }

    @Test
    void setEnabled_adminUser_returnsForbiddenAndDoesNotChangeStatus() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "admin-123";
        AuthAdminResource.EnabledReq req = new AuthAdminResource.EnabledReq();
        req.enabled = false;

        when(kc.userHasRealmRole(userId, "admin")).thenReturn(true);

        Response res = resource.setEnabled(userId, req);

        assertEquals(Response.Status.FORBIDDEN.getStatusCode(), res.getStatus());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) res.getEntity();
        assertEquals("You cannot enable/disable an administrator.", body.get("error"));

        verify(kc).userHasRealmRole(userId, "admin");
        verify(kc, never()).setEnabled(anyString(), anyBoolean());
        verify(kc, never()).logoutUser(anyString());
        verifyNoMoreInteractions(kc);
    }

    /* ==================== POST /users/{id}/roles/realm ==================== */

    @Test
    void addRealmRoles_ok_callsService() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "user-123";
        AuthAdminResource.RolesReq req = new AuthAdminResource.RolesReq();
        req.roles = List.of("Customer", "client");

        when(kc.userHasRealmRole(userId, "admin")).thenReturn(false);

        Response res = resource.addRealmRoles(userId, req);

        assertEquals(Response.Status.NO_CONTENT.getStatusCode(), res.getStatus());
        verify(kc).userHasRealmRole(userId, "admin");
        verify(kc).addRealmRoles(userId, req.roles);
        verifyNoMoreInteractions(kc);
    }

    @Test
    void addRealmRoles_rolesNull_throwsBadRequestAndDoesNotCallService() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "user-123";
        AuthAdminResource.RolesReq req = new AuthAdminResource.RolesReq();
        req.roles = null;

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> resource.addRealmRoles(userId, req)
        );

        assertTrue(ex.getMessage().contains("roles required"));
        verifyNoInteractions(kc);
    }

    @Test
    void addRealmRoles_targetIsAdmin_throwsForbidden() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "admin-123";
        AuthAdminResource.RolesReq req = new AuthAdminResource.RolesReq();
        req.roles = List.of("Customer");

        when(kc.userHasRealmRole(userId, "admin")).thenReturn(true);

        ForbiddenException ex = assertThrows(
                ForbiddenException.class,
                () -> resource.addRealmRoles(userId, req)
        );

        assertTrue(ex.getMessage().contains("Administrator roles cannot be changed."));
        verify(kc).userHasRealmRole(userId, "admin");
        verify(kc, never()).addRealmRoles(anyString(), anyList());
        verifyNoMoreInteractions(kc);
    }

    @Test
    void addRealmRoles_includesAdminRole_throwsForbidden() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "user-123";
        AuthAdminResource.RolesReq req = new AuthAdminResource.RolesReq();
        req.roles = List.of("admin", "Customer");

        when(kc.userHasRealmRole(userId, "admin")).thenReturn(false);

        ForbiddenException ex = assertThrows(
                ForbiddenException.class,
                () -> resource.addRealmRoles(userId, req)
        );

        assertTrue(ex.getMessage().contains("admin"));
        verify(kc).userHasRealmRole(userId, "admin");
        verify(kc, never()).addRealmRoles(anyString(), anyList());
        verifyNoMoreInteractions(kc);
    }

    /* ==================== DELETE /users/{id}/roles/realm ==================== */

    @Test
    void removeRealmRoles_ok_callsService() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "user-123";
        AuthAdminResource.RolesReq req = new AuthAdminResource.RolesReq();
        req.roles = List.of("Customer");

        when(kc.userHasRealmRole(userId, "admin")).thenReturn(false);

        Response res = resource.removeRealmRoles(userId, req);

        assertEquals(Response.Status.NO_CONTENT.getStatusCode(), res.getStatus());
        verify(kc).userHasRealmRole(userId, "admin");
        verify(kc).removeRealmRoles(userId, req.roles);
        verifyNoMoreInteractions(kc);
    }

    @Test
    void removeRealmRoles_rolesEmpty_throwsBadRequest() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "user-123";
        AuthAdminResource.RolesReq req = new AuthAdminResource.RolesReq();
        req.roles = List.of(); // empty

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> resource.removeRealmRoles(userId, req)
        );

        assertTrue(ex.getMessage().contains("roles required"));
        verifyNoInteractions(kc);
    }

    @Test
    void removeRealmRoles_targetIsAdmin_throwsForbidden() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "admin-123";
        AuthAdminResource.RolesReq req = new AuthAdminResource.RolesReq();
        req.roles = List.of("Customer");

        when(kc.userHasRealmRole(userId, "admin")).thenReturn(true);

        ForbiddenException ex = assertThrows(
                ForbiddenException.class,
                () -> resource.removeRealmRoles(userId, req)
        );

        assertTrue(ex.getMessage().contains("Administrator roles cannot be changed."));
        verify(kc).userHasRealmRole(userId, "admin");
        verify(kc, never()).removeRealmRoles(anyString(), anyList());
        verifyNoMoreInteractions(kc);
    }

    @Test
    void removeRealmRoles_includesAdminRole_throwsForbidden() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "user-123";
        AuthAdminResource.RolesReq req = new AuthAdminResource.RolesReq();
        req.roles = List.of("Customer", "admin");

        when(kc.userHasRealmRole(userId, "admin")).thenReturn(false);

        ForbiddenException ex = assertThrows(
                ForbiddenException.class,
                () -> resource.removeRealmRoles(userId, req)
        );

        assertTrue(ex.getMessage().contains("admin"));
        verify(kc).userHasRealmRole(userId, "admin");
        verify(kc, never()).removeRealmRoles(anyString(), anyList());
        verifyNoMoreInteractions(kc);
    }

    /* ==================== POST /users/{id}/promote-admin ==================== */

    @Test
    void promoteToAdmin_alreadyAdmin_returns409AndDoesNotChangeRoles() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "admin-123";

        when(kc.userHasRealmRole(userId, "admin")).thenReturn(true);

        Response res = resource.promoteToAdmin(userId);

        assertEquals(Response.Status.CONFLICT.getStatusCode(), res.getStatus());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) res.getEntity();
        assertEquals("El usuario ya es admin", body.get("error"));

        verify(kc).userHasRealmRole(userId, "admin");
        verify(kc, never()).addRealmRoles(anyString(), anyList());
        verify(kc, never()).removeRealmRoles(anyString(), anyList());
        verify(kc, never()).findGroupByName(anyString());
        verifyNoMoreInteractions(kc);
    }

    @Test
    void promoteToAdmin_success_addsAdmin_removesCustomer_andRemovesFromCustomersGroup() {
        KcAdminService kc = mock(KcAdminService.class);
        SecurityIdentity identity = mock(SecurityIdentity.class);
        AuthAdminResource resource = new AuthAdminResource(kc, identity);

        String userId = "user-123";
        String groupId = "group-999";

        // not admin initially
        when(kc.userHasRealmRole(userId, "admin")).thenReturn(false);
        // user has "Customer" realm role
        when(kc.userHasRealmRole(userId, "Customer")).thenReturn(true);

        // group "customers" exists
        JsonObject groupJson = Json.createObjectBuilder()
                .add("id", groupId)
                .add("name", "customers")
                .build();
        when(kc.findGroupByName("customers")).thenReturn(Optional.of(groupJson));
        when(kc.userInGroup(userId, groupId)).thenReturn(true);

        Response res = resource.promoteToAdmin(userId);

        assertEquals(Response.Status.NO_CONTENT.getStatusCode(), res.getStatus());

        // verify admin role added
        verify(kc).addRealmRoles(userId, List.of("admin"));
        // verify Customer role removed
        verify(kc).removeRealmRoles(userId, List.of("Customer"));
        // verify removed from customers group
        verify(kc).removeUserFromGroup(userId, groupId);

        verify(kc).userHasRealmRole(userId, "admin");
        verify(kc).userHasRealmRole(userId, "Customer");
        verify(kc).findGroupByName("customers");
        verify(kc).userInGroup(userId, groupId);
        verifyNoMoreInteractions(kc);
    }
}
