package org.auth.api;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import org.auth.dto.*;
import org.auth.model.User;
import org.auth.model.UserRole;
import org.auth.service.JwtService;
import org.auth.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link AuthResource}.
 * <p>
 * These tests verify the behavior of the resource methods in isolation,
 * using mocks for {@link UserService}, {@link JwtService}, and {@link SecurityIdentity}.
 */
@ExtendWith(MockitoExtension.class)
class AuthResourceTest {

    @Mock
    UserService userService;

    @Mock
    JwtService jwtService;

    @Mock
    SecurityIdentity securityIdentity;

    @InjectMocks
    AuthResource authResource;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.id = 1L;
        sampleUser.username = "john.doe";
        sampleUser.email = "john.doe@example.com";
        sampleUser.role = UserRole.CUSTOMER;
        sampleUser.enabled = true;
        sampleUser.createdAt = LocalDateTime.now().minusDays(1);
        sampleUser.updatedAt = LocalDateTime.now();
    }

    /**
     * Verifies that {@link AuthResource#register(RegisterRequest)}:
     * <ul>
     *     <li>delegates user creation to {@link UserService#registerCustomer(String, String, String)}</li>
     *     <li>returns HTTP 201 (Created)</li>
     *     <li>includes a Location header pointing to the new user resource</li>
     *     <li>returns a {@link UserResponse} representing the created user</li>
     * </ul>
     */
    @Test
    void register_ShouldCreateUserAndReturnCreatedResponse() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.username = "john.doe";
        request.password = "Secret123!";
        request.email = "john.doe@example.com";

        when(userService.registerCustomer(request.username, request.password, request.email))
                .thenReturn(sampleUser);

        // Act
        Response response = authResource.register(request);

        // Assert
        assertEquals(201, response.getStatus(), "Expected HTTP 201 Created");
        assertEquals(URI.create("/auth/users/" + sampleUser.id), response.getLocation(),
                "Location header should point to the created user resource");

        assertNotNull(response.getEntity(), "Response entity should not be null");
        assertTrue(response.getEntity() instanceof UserResponse, "Entity should be of type UserResponse");

        UserResponse userResponse = (UserResponse) response.getEntity();
        assertEquals(sampleUser.id, userResponse.id);
        assertEquals(sampleUser.username, userResponse.username);
        assertEquals(sampleUser.email, userResponse.email);
        assertEquals(sampleUser.role, userResponse.role);
        assertEquals(sampleUser.enabled, userResponse.enabled);

        verify(userService).registerCustomer(request.username, request.password, request.email);
        verifyNoMoreInteractions(userService, jwtService);
    }

    /**
     * Verifies that {@link AuthResource#login(LoginRequest)}:
     * <ul>
     *     <li>delegates authentication to {@link UserService#authenticate(String, String)}</li>
     *     <li>delegates token creation to {@link JwtService#generateToken(User)}</li>
     *     <li>returns HTTP 200 (OK) with an {@link AuthResponse} containing the token and user data</li>
     * </ul>
     */
    @Test
    void login_ShouldReturnTokenAndUserInfo_WhenCredentialsAreValid() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.username = "john.doe";
        request.password = "Secret123!";

        String token = "fake-jwt-token";

        when(userService.authenticate(request.username, request.password)).thenReturn(sampleUser);
        when(jwtService.generateToken(sampleUser)).thenReturn(token);

        // Act
        Response response = authResource.login(request);

        // Assert
        assertEquals(200, response.getStatus(), "Expected HTTP 200 OK");

        assertNotNull(response.getEntity(), "Response entity should not be null");
        assertTrue(response.getEntity() instanceof AuthResponse, "Entity should be of type AuthResponse");

        AuthResponse authResponse = (AuthResponse) response.getEntity();
        assertEquals(token, authResponse.accessToken);
        assertEquals("Bearer", authResponse.tokenType);
        assertNotNull(authResponse.user, "User data should be present in AuthResponse");
        assertEquals(sampleUser.username, authResponse.user.username);
        assertEquals(sampleUser.email, authResponse.user.email);

        verify(userService).authenticate(request.username, request.password);
        verify(jwtService).generateToken(sampleUser);
        verifyNoMoreInteractions(userService, jwtService);
    }

    /**
     * Verifies that {@link AuthResource#login(LoginRequest)} propagates exceptions
     * thrown by {@link UserService#authenticate(String, String)}, allowing higher layers
     * (e.g. exception mappers) to handle authentication failures.
     */
    @Test
    void login_ShouldPropagateException_WhenAuthenticationFails() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.username = "john.doe";
        request.password = "WrongPassword";

        when(userService.authenticate(request.username, request.password))
                .thenThrow(new IllegalArgumentException("Invalid username or password."));

        // Act & Assert
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> authResource.login(request),
                "Expected IllegalArgumentException to be thrown on authentication failure");

        assertEquals("Invalid username or password.", ex.getMessage());
        verify(userService).authenticate(request.username, request.password);
        verifyNoInteractions(jwtService);
    }

    /**
     * Verifies that {@link AuthResource#me()}:
     * <ul>
     *     <li>reads the username from {@link SecurityIdentity}</li>
     *     <li>retrieves the corresponding user from {@link UserService}</li>
     *     <li>returns HTTP 200 (OK) with a {@link UserResponse}</li>
     * </ul>
     */
    @Test
    void me_ShouldReturnCurrentUserInfo_WhenUserExists() {
        // Arrange
        String principalName = "john.doe";

        when(securityIdentity.getPrincipal()).thenReturn(() -> principalName);
        when(userService.findByUsername(principalName))
                .thenReturn(Optional.of(sampleUser));

        // Act
        Response response = authResource.me();

        // Assert
        assertEquals(200, response.getStatus(), "Expected HTTP 200 OK");
        assertNotNull(response.getEntity(), "Response entity should not be null");
        assertTrue(response.getEntity() instanceof UserResponse, "Entity should be of type UserResponse");

        UserResponse userResponse = (UserResponse) response.getEntity();
        assertEquals(sampleUser.username, userResponse.username);
        assertEquals(sampleUser.email, userResponse.email);

        verify(securityIdentity).getPrincipal();
        verify(userService).findByUsername(principalName);
        verifyNoMoreInteractions(userService, jwtService);
    }

    /**
     * Verifies that {@link AuthResource#me()} throws a {@link NotFoundException}
     * when no user can be found for the current principal.
     */
    @Test
    void me_ShouldThrowNotFound_WhenUserDoesNotExist() {
        // Arrange
        String principalName = "missing.user";

        when(securityIdentity.getPrincipal()).thenReturn(() -> principalName);
        when(userService.findByUsername(principalName)).thenReturn(Optional.empty());

        // Act & Assert
        NotFoundException ex = assertThrows(NotFoundException.class,
                () -> authResource.me(),
                "Expected NotFoundException when current user cannot be resolved");

        assertEquals("Current user not found.", ex.getMessage());
        verify(securityIdentity).getPrincipal();
        verify(userService).findByUsername(principalName);
        verifyNoMoreInteractions(userService, jwtService);
    }

    /**
     * Verifies that {@link AuthResource#listUsers()}:
     * <ul>
     *     <li>delegates to {@link UserService#listAllUsers()}</li>
     *     <li>maps the returned entities to {@link UserResponse}</li>
     *     <li>returns HTTP 200 (OK) with the list of users</li>
     * </ul>
     */
    @Test
    void listUsers_ShouldReturnListOfUsers() {
        // Arrange
        User anotherUser = new User();
        anotherUser.id = 2L;
        anotherUser.username = "jane.doe";
        anotherUser.email = "jane.doe@example.com";
        anotherUser.role = UserRole.ADMIN;
        anotherUser.enabled = true;

        when(userService.listAllUsers()).thenReturn(List.of(sampleUser, anotherUser));

        // Act
        Response response = authResource.listUsers();

        // Assert
        assertEquals(200, response.getStatus(), "Expected HTTP 200 OK");
        assertNotNull(response.getEntity(), "Response entity should not be null");
        assertTrue(response.getEntity() instanceof List, "Entity should be a List");

        @SuppressWarnings("unchecked")
        List<UserResponse> users = (List<UserResponse>) response.getEntity();
        assertEquals(2, users.size(), "Expected two users in the response");

        UserResponse first = users.get(0);
        UserResponse second = users.get(1);

        assertEquals(sampleUser.username, first.username);
        assertEquals(sampleUser.email, first.email);

        assertEquals(anotherUser.username, second.username);
        assertEquals(anotherUser.email, second.email);

        verify(userService).listAllUsers();
        verifyNoMoreInteractions(userService, jwtService);
    }

    /**
     * Verifies that {@link AuthResource#changeUserRole(Long, ChangeRoleRequest)}:
     * <ul>
     *     <li>delegates role change to {@link UserService#changeUserRole(Long, UserRole)}</li>
     *     <li>returns HTTP 200 (OK) with the updated {@link UserResponse}</li>
     * </ul>
     */
    @Test
    void changeUserRole_ShouldUpdateRoleAndReturnUpdatedUser() {
        // Arrange
        Long userId = 1L;
        ChangeRoleRequest request = new ChangeRoleRequest();
        request.role = UserRole.ADMIN;

        User updatedUser = new User();
        updatedUser.id = userId;
        updatedUser.username = sampleUser.username;
        updatedUser.email = sampleUser.email;
        updatedUser.role = UserRole.ADMIN;
        updatedUser.enabled = true;

        when(userService.changeUserRole(userId, request.role)).thenReturn(updatedUser);

        // Act
        Response response = authResource.changeUserRole(userId, request);

        // Assert
        assertEquals(200, response.getStatus(), "Expected HTTP 200 OK");
        assertNotNull(response.getEntity(), "Response entity should not be null");
        assertTrue(response.getEntity() instanceof UserResponse, "Entity should be of type UserResponse");

        UserResponse userResponse = (UserResponse) response.getEntity();
        assertEquals(UserRole.ADMIN, userResponse.role, "Role should be updated to ADMIN");

        verify(userService).changeUserRole(userId, request.role);
        verifyNoMoreInteractions(userService, jwtService);
    }

    /**
     * Verifies that {@link AuthResource#changeUserEnabled(Long, ChangeEnabledRequest)}:
     * <ul>
     *     <li>delegates the enable/disable operation to {@link UserService#setUserEnabled(Long, boolean)}</li>
     *     <li>returns HTTP 200 (OK) with the updated {@link UserResponse}</li>
     * </ul>
     */
    @Test
    void changeUserEnabled_ShouldUpdateEnabledFlagAndReturnUpdatedUser() {
        // Arrange
        Long userId = 1L;
        ChangeEnabledRequest request = new ChangeEnabledRequest();
        request.enabled = false;

        User updatedUser = new User();
        updatedUser.id = userId;
        updatedUser.username = sampleUser.username;
        updatedUser.email = sampleUser.email;
        updatedUser.role = sampleUser.role;
        updatedUser.enabled = false;

        when(userService.setUserEnabled(userId, request.enabled)).thenReturn(updatedUser);

        // Act
        Response response = authResource.changeUserEnabled(userId, request);

        // Assert
        assertEquals(200, response.getStatus(), "Expected HTTP 200 OK");
        assertNotNull(response.getEntity(), "Response entity should not be null");
        assertTrue(response.getEntity() instanceof UserResponse, "Entity should be of type UserResponse");

        UserResponse userResponse = (UserResponse) response.getEntity();
        assertFalse(userResponse.enabled, "User should be disabled");

        verify(userService).setUserEnabled(userId, request.enabled);
        verifyNoMoreInteractions(userService, jwtService);
    }
}
