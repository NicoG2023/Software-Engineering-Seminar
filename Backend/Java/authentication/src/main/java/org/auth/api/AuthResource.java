package org.auth.api;

import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;

import org.auth.dto.*;
import org.auth.model.User;
import org.auth.service.UserService;
import org.auth.service.JwtService;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST resource exposing authentication and user management endpoints.
 * <p>
 * This includes:
 * <ul>
 *     <li>User registration</li>
 *     <li>User login (JWT issuance)</li>
 *     <li>Retrieval of the current authenticated user</li>
 *     <li>Administrative operations (list users, change roles, enable/disable users)</li>
 * </ul>
 */
@Path("/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    UserService userService;

    @Inject
    JwtService jwtService;

    @Inject
    SecurityIdentity securityIdentity;

    /**
     * Registers a new user with the default customer role.
     * <p>
     * Validation is performed using Bean Validation annotations on {@link RegisterRequest}.
     *
     * @param request the registration request; must be valid and not {@code null}
     * @return an HTTP 201 Created response with the created user
     */
    @POST
    @Path("/register")
    @PermitAll
    @Transactional
    public Response register(@Valid RegisterRequest request) {
        User user = userService.registerCustomer(request.username, request.password, request.email);
        UserResponse userResponse = UserResponse.fromEntity(user);

        return Response
                .created(URI.create("/auth/users/" + user.id))
                .entity(userResponse)
                .build();
    }

    /**
     * Authenticates a user using username and password and returns a JWT on success.
     * <p>
     * Validation is performed using Bean Validation annotations on {@link LoginRequest}.
     *
     * @param request the login request; must be valid and not {@code null}
     * @return an HTTP 200 OK response with an {@link AuthResponse} containing the JWT
     */
    @POST
    @Path("/login")
    @PermitAll
    @Transactional(Transactional.TxType.SUPPORTS)
    public Response login(@Valid LoginRequest request) {
        User user = userService.authenticate(request.username, request.password);
        String token = jwtService.generateToken(user);
        UserResponse userResponse = UserResponse.fromEntity(user);

        return Response.ok(AuthResponse.of(token, userResponse)).build();
    }

    /**
     * Returns information about the currently authenticated user.
     *
     * @return an HTTP 200 OK response with a {@link UserResponse}
     * @throws NotFoundException if the current user cannot be resolved in the database
     */
    @GET
    @Path("/me")
    @Authenticated
    @Transactional(Transactional.TxType.SUPPORTS)
    public Response me() {
        String username = securityIdentity.getPrincipal().getName();

        return userService.findByUsername(username)
                .map(UserResponse::fromEntity)
                .map(Response::ok)
                .map(Response.ResponseBuilder::build)
                .orElseThrow(() -> new NotFoundException("Current user not found."));
    }

    /**
     * Returns a list of all users in the system.
     * <p>
     * This operation is restricted to users with the {@code ADMIN} role.
     *
     * @return an HTTP 200 OK response containing a list of {@link UserResponse}
     */
    @GET
    @Path("/users")
    @RolesAllowed("ADMIN")
    @Transactional(Transactional.TxType.SUPPORTS)
    public Response listUsers() {
        List<UserResponse> users = userService.listAllUsers()
                .stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());

        return Response.ok(users).build();
    }

    /**
     * Changes the role of a user identified by its ID.
     * <p>
     * This operation is restricted to users with the {@code ADMIN} role.
     * Bean Validation is applied to {@link ChangeRoleRequest}.
     *
     * @param id      the ID of the user whose role should be changed
     * @param request the request containing the new role; must be valid and not {@code null}
     * @return an HTTP 200 OK response with the updated user
     */
    @PUT
    @Path("/users/{id}/role")
    @RolesAllowed("ADMIN")
    public Response changeUserRole(@PathParam("id") Long id, @Valid ChangeRoleRequest request) {
        User updatedUser = userService.changeUserRole(id, request.role);
        return Response.ok(UserResponse.fromEntity(updatedUser)).build();
    }

    /**
     * Enables or disables a user account.
     * <p>
     * This operation is restricted to users with the {@code ADMIN} role.
     * Bean Validation is applied to {@link ChangeEnabledRequest}.
     *
     * @param id      the ID of the user to modify
     * @param request the request containing the desired enabled flag; must be valid and not {@code null}
     * @return an HTTP 200 OK response with the updated user
     */
    @PATCH
    @Path("/users/{id}/enabled")
    @RolesAllowed("ADMIN")
    public Response changeUserEnabled(@PathParam("id") Long id, @Valid ChangeEnabledRequest request) {
        User updatedUser = userService.setUserEnabled(id, request.enabled);
        return Response.ok(UserResponse.fromEntity(updatedUser)).build();
    }
}
