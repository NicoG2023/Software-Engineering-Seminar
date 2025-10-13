package org.auth.resources;

import org.auth.service.KcAdminService;

import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import io.quarkus.logging.Log;

import java.util.*;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthAdminResource {

    @Inject KcAdminService kc;
    @Inject SecurityIdentity identity;

    /* ============== GET /auth/whoami ============== */
    @GET
    @Path("/whoami")
    @Authenticated
    public Response whoami() {
        var out = Json.createObjectBuilder()
            .add("principal", identity.getPrincipal().getName())
            .add("roles", Json.createArrayBuilder(identity.getRoles()));

        var attrsJson = Json.createObjectBuilder();
        identity.getAttributes().forEach((k, v) -> {
            if (v != null) attrsJson.add(k, String.valueOf(v));
        });
        out.add("attributes", attrsJson);

        return Response.ok(out.build()).build();
    }

    /* ============== POST /auth/users ============== */
    public static class CreateUserReq {
        public String username;
        public String email;
        public String password;
        public Boolean emailVerified = Boolean.TRUE;
        public Boolean enabled = Boolean.TRUE;
    }

    @POST
    @Path("/users")
    @RolesAllowed({"admin"})
    public Response createUser(CreateUserReq req) {
        if (req.username == null || req.email == null || req.password == null) {
            throw new BadRequestException("username, email and password are required");
        }
        String id = kc.createUser(req.username, req.email,
                req.emailVerified != null && req.emailVerified,
                req.enabled == null || req.enabled);

        kc.setPassword(id, req.password, false);

        return Response.status(Response.Status.CREATED)
                .entity(Map.of("id", id))
                .build();
    }

    /* ============== PUT /auth/users/{id}/password ============== */
    public static class PasswordReq {
        public String password;
        public Boolean temporary = Boolean.FALSE;
    }

    @PUT
    @Path("/users/{id}/password")
    @RolesAllowed({"admin","auth.admin"})
    public Response setPassword(@PathParam("id") String userId, PasswordReq req) {
        if (req.password == null) throw new BadRequestException("password is required");
        kc.setPassword(userId, req.password, req.temporary != null && req.temporary);
        return Response.noContent().build();
    }

    /* ============== GET /auth/users (list) ============== */
    @GET
    @Path("/users")
    @RolesAllowed({"admin","auth.admin"})
    public Response listUsers(@QueryParam("q") String q,
                            @QueryParam("first") Integer first,
                            @QueryParam("max") Integer max) {
        String json = kc.listUsersRaw(q, first, max);
        return Response.ok(json).type(MediaType.APPLICATION_JSON).build();
    }

    /* ============== GET /auth/users/{id} (details) ============== */
    @GET
    @Path("/users/{id}")
    @RolesAllowed({"admin","auth.admin"})
    public Response getUser(@PathParam("id") String userId) {
        JsonObject user = kc.getUser(userId);

        return Response.ok(user).build();
    }

    /* ============== PUT /auth/users/{id}/enabled ============== */
    public static class EnabledReq { public Boolean enabled; }

    @PUT
    @Path("/users/{id}/enabled")
    @RolesAllowed({"admin","auth.admin"})
    public Response setEnabled(@PathParam("id") String userId, EnabledReq req) {
        if (req.enabled == null) throw new BadRequestException("enabled is required");

        // No permitir desactivar admins
        if (kc.userHasRealmRole(userId, "admin")) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", "No se puede activar/desactivar un administrador")).build();
        }

        kc.setEnabled(userId, req.enabled);
        if (!req.enabled) kc.logoutUser(userId);
        return Response.noContent().build();
    }

    /* ============== POST /auth/users/{id}/roles/realm ============== */
    public static class RolesReq { public List<String> roles; }

    private void assertCanModifyRoles(String targetUserId, List<String> roles) {
        if (roles == null || roles.isEmpty()) throw new BadRequestException("roles required");
        // 1) No tocar usuarios que sean admin
        if (kc.userHasRealmRole(targetUserId, "admin")) {
            throw new ForbiddenException("No se pueden cambiar roles de un administrador");
        }
        // 2) No permitir manipular el rol 'admin' con estos endpoints
        boolean touchesAdminRole = roles.stream().anyMatch(r -> "admin".equalsIgnoreCase(r));
        if (touchesAdminRole) {
            throw new ForbiddenException("No se puede asignar ni remover el rol 'admin' con este endpoint");
        }
    }

    @POST
    @Path("/users/{id}/roles/realm")
    @RolesAllowed({"admin","auth.admin"})
    public Response addRealmRoles(@PathParam("id") String userId, RolesReq req) {
        assertCanModifyRoles(userId, req.roles);
        kc.addRealmRoles(userId, req.roles);
        return Response.noContent().build();
    }

    /* ============== DELETE /auth/users/{id}/roles/realm ============== */
    @DELETE
    @Path("/users/{id}/roles/realm")
    @RolesAllowed({"admin","auth.admin"})
    public Response removeRealmRoles(@PathParam("id") String userId, RolesReq req) {
        assertCanModifyRoles(userId, req.roles);
        kc.removeRealmRoles(userId, req.roles);
        return Response.noContent().build();
    }

    /* ============== POST /auth/users/{id}/logout ============== */
    @POST
    @Path("/users/{id}/logout")
    @RolesAllowed({"admin","auth.admin"})
    public Response logout(@PathParam("id") String userId) {
        kc.logoutUser(userId);
        return Response.noContent().build();
    }

    /* ============== PUT/DELETE /auth/users/{id}/groups/{group} ============== */

    @PUT
    @Path("/users/{id}/groups/{groupName}")
    @RolesAllowed({"admin","auth.admin"})
    public Response addToGroup(@PathParam("id") String userId, @PathParam("groupName") String groupName) {
        var groupOpt = kc.findGroupByName(groupName);
        if (groupOpt.isEmpty()) throw new NotFoundException("Group not found: " + groupName);

        // Regla de negocio: admin y customer son excluyentes
        if ("customers".equalsIgnoreCase(groupName) && kc.userHasRealmRole(userId, "admin")) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(Map.of("error", "Un administrador no puede pertenecer al grupo 'customers'"))
                    .build();
        }

        var group = groupOpt.get();
        if (!kc.userInGroup(userId, group.getString("id"))) {
            kc.addUserToGroup(userId, group.getString("id"));
        }
        return Response.noContent().build();
    }

    @DELETE
    @Path("/users/{id}/groups/{groupName}")
    @RolesAllowed({"admin","auth.admin"})
    public Response removeFromGroup(@PathParam("id") String userId, @PathParam("groupName") String groupName) {
        var groupOpt = kc.findGroupByName(groupName);
        if (groupOpt.isEmpty()) throw new NotFoundException("Group not found: " + groupName);
        var group = groupOpt.get();
        if (kc.userInGroup(userId, group.getString("id"))) {
            kc.removeUserFromGroup(userId, group.getString("id"));
        }
        return Response.noContent().build();
    }

    @POST
    @Path("/users/{id}/promote-admin")
    @RolesAllowed({"admin","auth.admin"})
    public Response promoteToAdmin(@PathParam("id") String userId) {
        // si ya es admin, responde conflicto “suave”
        if (kc.userHasRealmRole(userId, "admin")) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(Map.of("error", "El usuario ya es admin")).build();
        }

        // 1) asigna rol realm 'admin'
        kc.addRealmRoles(userId, List.of("admin"));

        // 2) quita rol realm 'Customer' si lo tiene (exclusión)
        if (kc.userHasRealmRole(userId, "Customer")) {
            kc.removeRealmRoles(userId, List.of("Customer"));
        }

        // 3) quita del grupo 'customers' si estuviera (por si usas grupos)
        kc.findGroupByName("customers").ifPresent(g -> {
            String gid = g.getString("id");
            if (kc.userInGroup(userId, gid)) kc.removeUserFromGroup(userId, gid);
        });

        return Response.noContent().build();
    }

}
