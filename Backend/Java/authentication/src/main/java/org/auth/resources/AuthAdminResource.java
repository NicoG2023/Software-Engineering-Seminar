package org.auth.resources;

import org.auth.service.KcAdminService;

import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.json.Json;
import jakarta.json.JsonObjectBuilder;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

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

        // atributos (map<String,Object>) expuestos por Quarkus/OIDC
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

    /* ============== GET /auth/users ============== */
    @GET
    @Path("/users")
    @RolesAllowed({"admin","auth.admin"})
    public Response listUsers(@QueryParam("q") String q,
                              @QueryParam("first") Integer first,
                              @QueryParam("max") Integer max) {
        var users = kc.listUsers(q, first, max);
        return Response.ok(users).build();
    }

    /* ============== POST /auth/users/{id}/roles/realm ============== */
    public static class RolesReq { public List<String> roles; }

    @POST
    @Path("/users/{id}/roles/realm")
    @RolesAllowed({"admin","auth.admin"})
    public Response addRealmRoles(@PathParam("id") String userId, RolesReq req) {
        if (req.roles == null || req.roles.isEmpty()) throw new BadRequestException("roles required");
        kc.addRealmRoles(userId, req.roles);
        return Response.noContent().build();
    }

    /* ============== DELETE /auth/users/{id}/roles/realm ============== */
    @DELETE
    @Path("/users/{id}/roles/realm")
    @RolesAllowed({"admin","auth.admin"})
    public Response removeRealmRoles(@PathParam("id") String userId, RolesReq req) {
        if (req.roles == null || req.roles.isEmpty()) throw new BadRequestException("roles required");
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
}
