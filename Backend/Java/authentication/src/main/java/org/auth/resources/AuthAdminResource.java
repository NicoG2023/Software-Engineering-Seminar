package org.auth.resources;

import org.auth.service.KcAdminService;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.*;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.parameters.RequestBody;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.media.ExampleObject;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.security.SecurityScheme;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.enums.SecuritySchemeType;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Auth Admin API", description = "Administrative operations to manage users and realm roles in Keycloak.")
@SecurityScheme(
    securitySchemeName = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT"
)
@SecurityRequirement(name = "bearerAuth")
public class AuthAdminResource {

    @Inject KcAdminService kc;
    @Inject SecurityIdentity identity;

    /* SCHEMAS */

    @Schema(name = "CreateUserRequest", description = "Payload to create a new user.")
    public static class CreateUserReq {
        @Schema(required = true, example = "Jhon Doe")
        public String username;

        @Schema(required = true, example = "jdoe@example.com")
        public String email;

        @Schema(required = true, example = "S3cretPwd!")
        public String password;

        @Schema(description = "Marks the email as verified upon creation.", defaultValue = "true", example = "true")
        public Boolean emailVerified = Boolean.TRUE;

        @Schema(description = "Creates the user as enabled.", defaultValue = "true", example = "true")
        public Boolean enabled = Boolean.TRUE;
    }

    @Schema(name = "CreateUserResponse", description = "Response containing the created user's identifier.")
    public static class CreateUserRes {
        @Schema(example = "5b2a9f0a-8d7a-4b1e-9c2b-1234567890ab")
        public String id;
    }

    @Schema(name = "PasswordRequest", description = "Set or reset a user's password.")
    public static class PasswordReq {
        @Schema(required = true, example = "N3wP4ssword!")
        public String password;

        @Schema(description = "If true, the user will be forced to change the password on next login.", defaultValue = "false", example = "false")
        public Boolean temporary = Boolean.FALSE;
    }

    @Schema(name = "EnabledRequest", description = "Enable or disable a user account.")
    public static class EnabledReq {
        @Schema(required = true, example = "false")
        public Boolean enabled;
    }

    @Schema(name = "RolesRequest", description = "Realm roles to add or remove for a user.")
    public static class RolesReq {
        @Schema(required = true, example = "[\"Customer\",\"client\"]")
        public List<String> roles;
    }

    @Schema(name = "ErrorResponse", description = "Standard error payload.")
    public static class ErrorResponse {
        @Schema(example = "No se puede activar/desactivar un administrador")
        public String error;

        @Schema(example = "Detailed explanation of the error (optional)")
        public String message;
    }

    @Schema(name = "UserSummary", description = "Basic user summary as returned by Keycloak list endpoint.")
    public static class UserSummary {
        @Schema(example = "5b2a9f0a-8d7a-4b1e-9c2b-1234567890ab") public String id;
        @Schema(example = "aleja") public String username;
        @Schema(example = "aleja@example.com") public String email;
        @Schema(example = "true") public Boolean enabled;
        // Additional fields may be returned by Keycloak; this model is illustrative for documentation.
    }

    @Schema(name = "UserDetail", description = "Detailed user with realm roles injected.")
    public static class UserDetail {
        @Schema(example = "5b2a9f0a-8d7a-4b1e-9c2b-1234567890ab") public String id;
        @Schema(example = "aleja") public String username;
        @Schema(example = "aleja@example.com") public String email;
        @Schema(example = "true") public Boolean enabled;
        @Schema(description = "Realm roles assigned to the user", example = "[\"admin\",\"Customer\"]")
        public List<String> realmRoles;
    }

    /* ENDPOINTS*/

    /* ------------------------ POST /users ------------------------ */

    @POST
    @Path("/users")
    @RolesAllowed({"admin"})
    @Operation(
        summary = "Create a new user",
        description = "Creates a user in Keycloak and sets the initial password. Requires `admin` role."
    )
    @APIResponses({
        @APIResponse(
            responseCode = "201",
            description = "User successfully created",
            content = @Content(schema = @Schema(implementation = CreateUserRes.class),
                examples = @ExampleObject(name = "created", value = "{ \"id\": \"5b2a9f0a-8d7a-4b1e-9c2b-1234567890ab\" }")
            )
        ),
        @APIResponse(responseCode = "400", description = "Missing required fields",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(value = "{ \"error\": \"username, email and password are required\" }")
            )
        ),
        @APIResponse(responseCode = "401", description = "Unauthenticated"),
        @APIResponse(responseCode = "403", description = "Forbidden (missing `admin` role)"),
        @APIResponse(responseCode = "500", description = "Keycloak admin error")
    })
    public Response createUser(
        @RequestBody(
            required = true,
            description = "User creation payload",
            content = @Content(schema = @Schema(implementation = CreateUserReq.class),
                examples = @ExampleObject(name = "request", value =
                    "{\n" +
                    "  \"username\": \"aleja\",\n" +
                    "  \"email\": \"aleja@example.com\",\n" +
                    "  \"password\": \"S3cretPwd!\",\n" +
                    "  \"emailVerified\": true,\n" +
                    "  \"enabled\": true\n" +
                    "}"
                )
            )
        ) CreateUserReq req
    ) {
        if (req.username == null || req.email == null || req.password == null) {
            throw new BadRequestException("username, email and password are required");
        }
        String id = kc.createUser(
            req.username,
            req.email,
            req.emailVerified != null && req.emailVerified,
            req.enabled == null || req.enabled
        );
        kc.setPassword(id, req.password, false);
        return Response.status(Response.Status.CREATED)
                .entity(Map.of("id", id))
                .build();
    }

    /* -------------------- PUT /users/{id}/password -------------------- */

    @PUT
    @Path("/users/{id}/password")
    @RolesAllowed({"admin","auth.admin"})
    @Operation(
        summary = "Set or reset a user's password",
        description = "Sets a new password for the specified user. Optionally marks it as temporary."
    )
    @APIResponses({
        @APIResponse(responseCode = "204", description = "Password updated"),
        @APIResponse(responseCode = "400", description = "Invalid payload",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(value = "{ \"error\": \"password is required\" }")
            )
        ),
        @APIResponse(responseCode = "401", description = "Unauthenticated"),
        @APIResponse(responseCode = "403", description = "Forbidden"),
        @APIResponse(responseCode = "404", description = "User not found"),
        @APIResponse(responseCode = "500", description = "Keycloak admin error")
    })
    public Response setPassword(
        @Parameter(required = true, description = "User ID", example = "5b2a9f0a-8d7a-4b1e-9c2b-1234567890ab")
        @PathParam("id") String userId,
        @RequestBody(
            required = true,
            content = @Content(schema = @Schema(implementation = PasswordReq.class),
                examples = @ExampleObject(value = "{ \"password\": \"N3wP4ssword!\", \"temporary\": false }")
            )
        ) PasswordReq req
    ) {
        if (req.password == null) throw new BadRequestException("password is required");
        kc.setPassword(userId, req.password, req.temporary != null && req.temporary);
        return Response.noContent().build();
    }

    /* ------------------------ GET /users (list) ------------------------ */

    @GET
    @Path("/users")
    @RolesAllowed({"admin","auth.admin"})
    @Operation(
        summary = "List users",
        description = "Returns a raw JSON array from Keycloak's Admin API. Filtering and pagination are proxied."
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Array of users",
            content = @Content(mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = UserSummary[].class),
                examples = @ExampleObject(name = "users", value =
                    "[\n" +
                    "  {\n" +
                    "    \"id\": \"5b2a9f0a-8d7a-4b1e-9c2b-1234567890ab\",\n" +
                    "    \"username\": \"aleja\",\n" +
                    "    \"email\": \"aleja@example.com\",\n" +
                    "    \"enabled\": true\n" +
                    "  }\n" +
                    "]"
                )
            )
        ),
        @APIResponse(responseCode = "401", description = "Unauthenticated"),
        @APIResponse(responseCode = "403", description = "Forbidden"),
        @APIResponse(responseCode = "500", description = "Keycloak admin error")
    })
    public Response listUsers(
        @Parameter(description = "Search term (forwarded to Keycloak `search`)", example = "aleja")
        @QueryParam("q") String q,
        @Parameter(description = "Pagination offset", example = "0")
        @QueryParam("first") Integer first,
        @Parameter(description = "Page size", example = "50")
        @QueryParam("max") Integer max
    ) {
        String json = kc.listUsersRaw(q, first, max);
        return Response.ok(json).type(MediaType.APPLICATION_JSON).build();
    }

    /* -------------------- GET /users/{id} (details) -------------------- */

    @GET
    @Path("/users/{id}")
    @RolesAllowed({"admin","auth.admin"})
    @Operation(
        summary = "Get user details",
        description = "Fetches a single user from Keycloak and injects their realm roles."
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "User detail",
            content = @Content(mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = UserDetail.class),
                examples = @ExampleObject(name = "user", value =
                    "{\n" +
                    "  \"id\": \"5b2a9f0a-8d7a-4b1e-9c2b-1234567890ab\",\n" +
                    "  \"username\": \"aleja\",\n" +
                    "  \"email\": \"aleja@example.com\",\n" +
                    "  \"enabled\": true,\n" +
                    "  \"realmRoles\": [\"admin\",\"Customer\"]\n" +
                    "}"
                )
            )
        ),
        @APIResponse(responseCode = "401", description = "Unauthenticated"),
        @APIResponse(responseCode = "403", description = "Forbidden"),
        @APIResponse(responseCode = "404", description = "User not found"),
        @APIResponse(responseCode = "500", description = "Keycloak admin error")
    })
    public Response getUser(
        @Parameter(required = true, description = "User ID", example = "5b2a9f0a-8d7a-4b1e-9c2b-1234567890ab")
        @PathParam("id") String userId
    ) {
        JsonObject user = kc.getUser(userId);
        return Response.ok(user).build();
    }

    /* -------------------- PUT /users/{id}/enabled -------------------- */

    @PUT
    @Path("/users/{id}/enabled")
    @RolesAllowed({"admin","auth.admin"})
    @Operation(
        summary = "Enable or disable a user",
        description = "Sets the user's enabled status. The operation is forbidden for administrators."
    )
    @APIResponses({
        @APIResponse(responseCode = "204", description = "Status updated"),
        @APIResponse(responseCode = "400", description = "Invalid payload",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(value = "{ \"error\": \"enabled is required\" }")
            )
        ),
        @APIResponse(responseCode = "401", description = "Unauthenticated"),
        @APIResponse(responseCode = "403", description = "Forbidden (admin users cannot be enabled/disabled)",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(value = "{ \"error\": \"You cannot enable/disable an administrator.\" }")
            )
        ),
        @APIResponse(responseCode = "404", description = "User not found"),
        @APIResponse(responseCode = "500", description = "Keycloak admin error")
    })
    public Response setEnabled(
        @Parameter(required = true, description = "User ID", example = "5b2a9f0a-8d7a-4b1e-9c2b-1234567890ab")
        @PathParam("id") String userId,
        @RequestBody(
            required = true,
            content = @Content(schema = @Schema(implementation = EnabledReq.class),
                examples = @ExampleObject(value = "{ \"enabled\": false }")
            )
        ) EnabledReq req
    ) {
        if (req.enabled == null) throw new BadRequestException("enabled is required");

        if (kc.userHasRealmRole(userId, "admin")) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", "You cannot enable/disable an administrator.")).build();
        }
        kc.setEnabled(userId, req.enabled);
        if (!req.enabled) kc.logoutUser(userId);
        return Response.noContent().build();
    }

    /* -------------------- POST /users/{id}/roles/realm -------------------- */

    @POST
    @Path("/users/{id}/roles/realm")
    @RolesAllowed({"admin","auth.admin"})
    @Operation(
        summary = "Add realm roles to a user",
        description = "Assigns one or more realm roles to the specified user. The `admin` role cannot be assigned via this endpoint."
    )
    @APIResponses({
        @APIResponse(responseCode = "204", description = "Roles added"),
        @APIResponse(responseCode = "400", description = "Invalid payload",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(value = "{ \"error\": \"roles required\" }")
            )
        ),
        @APIResponse(responseCode = "401", description = "Unauthenticated"),
        @APIResponse(responseCode = "403", description = "Forbidden (target is admin or attempt to assign `admin` role)",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(value = "{ \"error\": \"The ‘admin’ role cannot be assigned or removed with this endpoint.\" }")
            )
        ),
        @APIResponse(responseCode = "404", description = "User or role not found"),
        @APIResponse(responseCode = "500", description = "Keycloak admin error")
    })
    public Response addRealmRoles(
        @Parameter(required = true, description = "User ID", example = "5b2a9f0a-8d7a-4b1e-9c2b-1234567890ab")
        @PathParam("id") String userId,
        @RequestBody(
            required = true,
            content = @Content(schema = @Schema(implementation = RolesReq.class),
                examples = @ExampleObject(value = "{ \"roles\": [\"Customer\",\"client\"] }")
            )
        ) RolesReq req
    ) {
        assertCanModifyRoles(userId, req.roles);
        kc.addRealmRoles(userId, req.roles);
        return Response.noContent().build();
    }

    /* -------------------- DELETE /users/{id}/roles/realm -------------------- */

    @DELETE
    @Path("/users/{id}/roles/realm")
    @RolesAllowed({"admin","auth.admin"})
    @Operation(
        summary = "Remove realm roles from a user",
        description = "Removes one or more realm roles from the specified user. The `admin` role cannot be removed via this endpoint."
    )
    @APIResponses({
        @APIResponse(responseCode = "204", description = "Roles removed"),
        @APIResponse(responseCode = "400", description = "Invalid payload",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(value = "{ \"error\": \"roles required\" }")
            )
        ),
        @APIResponse(responseCode = "401", description = "Unauthenticated"),
        @APIResponse(responseCode = "403", description = "Forbidden (target is admin or attempt to remove `admin` role)",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(value = "{ \"error\": \"The ‘admin’ role cannot be assigned or removed with this endpoint.\" }")
            )
        ),
        @APIResponse(responseCode = "404", description = "User or role not found"),
        @APIResponse(responseCode = "500", description = "Keycloak admin error")
    })
    public Response removeRealmRoles(
        @Parameter(required = true, description = "User ID", example = "5b2a9f0a-8d7a-4b1e-9c2b-1234567890ab")
        @PathParam("id") String userId,
        @RequestBody(
            required = true,
            content = @Content(schema = @Schema(implementation = RolesReq.class),
                examples = @ExampleObject(value = "{ \"roles\": [\"Customer\"] }")
            )
        ) RolesReq req
    ) {
        assertCanModifyRoles(userId, req.roles);
        kc.removeRealmRoles(userId, req.roles);
        return Response.noContent().build();
    }

    /* -------------------- POST /users/{id}/promote-admin -------------------- */

    @POST
    @Path("/users/{id}/promote-admin")
    @RolesAllowed({"admin","auth.admin"})
    @Operation(
        summary = "Promote user to admin",
        description = "Assigns the `admin` realm role, removes `Customer` if present, and removes the user from the `customers` group if applicable."
    )
    @APIResponses({
        @APIResponse(responseCode = "204", description = "Promotion applied"),
        @APIResponse(responseCode = "401", description = "Unauthenticated"),
        @APIResponse(responseCode = "403", description = "Forbidden"),
        @APIResponse(responseCode = "404", description = "User not found"),
        @APIResponse(responseCode = "409", description = "User is already an admin",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(value = "{ \"error\": \"El usuario ya es admin\" }")
            )
        ),
        @APIResponse(responseCode = "500", description = "Keycloak admin error")
    })
    public Response promoteToAdmin(
        @Parameter(required = true, description = "User ID", example = "5b2a9f0a-8d7a-4b1e-9c2b-1234567890ab")
        @PathParam("id") String userId
    ) {
        if (kc.userHasRealmRole(userId, "admin")) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(Map.of("error", "El usuario ya es admin")).build();
        }

        kc.addRealmRoles(userId, List.of("admin"));

        if (kc.userHasRealmRole(userId, "Customer")) {
            kc.removeRealmRoles(userId, List.of("Customer"));
        }

        kc.findGroupByName("customers").ifPresent(g -> {
            String gid = g.getString("id");
            if (kc.userInGroup(userId, gid)) kc.removeUserFromGroup(userId, gid);
        });

        return Response.noContent().build();
    }

    /* ====================== helpers (not exposed) ====================== */

    private void assertCanModifyRoles(String targetUserId, List<String> roles) {
        if (roles == null || roles.isEmpty()) throw new BadRequestException("roles required");
        if (kc.userHasRealmRole(targetUserId, "admin")) {
            throw new ForbiddenException("Administrator roles cannot be changed.");
        }
        boolean touchesAdminRole = roles.stream().anyMatch(r -> "admin".equalsIgnoreCase(r));
        if (touchesAdminRole) {
            throw new ForbiddenException("The ‘admin’ role cannot be assigned or removed with this endpoint.");
        }
    }
}
