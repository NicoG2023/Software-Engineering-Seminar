package org.auth.service;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.Json;
import jakarta.json.JsonArrayBuilder;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;
import jakarta.ws.rs.client.Client;
import jakarta.ws.rs.client.ClientBuilder;
import jakarta.ws.rs.client.Entity;
import jakarta.ws.rs.client.Invocation;
import jakarta.ws.rs.client.WebTarget;
import jakarta.ws.rs.core.Form;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.io.StringReader;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class KcAdminService {

    @ConfigProperty(name = "keycloak.admin.url")
    String keycloakUrl;

    @ConfigProperty(name = "keycloak.admin.realm")
    String realm;

    @ConfigProperty(name = "keycloak.admin.client-id")
    String clientId;

    @ConfigProperty(name = "keycloak.admin.client-secret")
    String clientSecret;

    /* =================== helpers =================== */

    private String tokenEndpoint() {
        return keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/token";
    }

    private String adminBase() {
        return keycloakUrl + "/admin/realms/" + realm;
    }

    private String getAdminToken() {
        WebTarget target = ClientBuilder.newClient().target(tokenEndpoint());
        Form form = new Form()
                .param("grant_type", "client_credentials")
                .param("client_id", clientId)
                .param("client_secret", clientSecret);

        try (Response res = target.request().post(Entity.form(form))) {
            if (res.getStatus() != 200) {
                throw new RuntimeException("Cannot obtain admin token. Status=" + res.getStatus());
            }
            JsonObject json = res.readEntity(JsonObject.class);
            return json.getString("access_token");
        }
    }

    private Invocation.Builder authed(String path) {
        String token = getAdminToken();
        Client client = ClientBuilder.newClient();
        return client.target(path)
                .request(MediaType.APPLICATION_JSON_TYPE)
                .header("Authorization", "Bearer " + token);
    }

    /* =================== users =================== */

    /** Create user and bring back the userId */
    public String createUser(String username, String email, boolean emailVerified, boolean enabled) {
        JsonObject user = Json.createObjectBuilder()
                .add("username", username)
                .add("email", email)
                .add("emailVerified", emailVerified)
                .add("enabled", enabled)
                .build();

        String path = adminBase() + "/users";
        try (Response res = authed(path).post(Entity.json(user))) {
            if (res.getStatus() != 201) {
                String body = res.hasEntity() ? res.readEntity(String.class) : "";
                throw new RuntimeException("Create user failed: " + res.getStatus() + " " + body);
            }
            String location = res.getHeaderString("Location"); // .../users/{id}
            return location.substring(location.lastIndexOf('/') + 1);
        }
    }

    /** Set/Reset password */
    public void setPassword(String userId, String password, boolean temporary) {
        JsonObject cred = Json.createObjectBuilder()
                .add("type", "password")
                .add("value", password)
                .add("temporary", temporary)
                .build();

        String path = adminBase() + "/users/" + userId + "/reset-password";
        try (Response res = authed(path).put(Entity.json(cred))) {
            if (res.getStatus() != 204) {
                throw new RuntimeException("Set password failed: " + res.getStatus());
            }
        }
    }

    /** Search/simple list of users */
    public String listUsersRaw(String q, Integer first, Integer max) {
        StringBuilder url = new StringBuilder(adminBase() + "/users");
        List<String> params = new ArrayList<>();
        if (q != null && !q.isBlank()) params.add("search=" + URLEncoder.encode(q, StandardCharsets.UTF_8));
        if (first != null) params.add("first=" + first);
        if (max != null) params.add("max=" + max);
        if (!params.isEmpty()) url.append("?").append(String.join("&", params));

        try (Response res = authed(url.toString()).get()) {
            if (res.getStatus() != 200) throw new RuntimeException("List users failed: " + res.getStatus());
            return res.readEntity(String.class);
        }
    }

    /** Get single user with realm roles injected */
    public JsonObject getUser(String userId) {
        String path = adminBase() + "/users/" + userId;

        JsonObject base;
        try (Response res = authed(path).get()) {
            if (res.getStatus() != 200) throw new RuntimeException("Get user failed: " + res.getStatus());
            base = res.readEntity(JsonObject.class);
        }

        List<String> roles = getUserRealmRoles(userId);

        var ab = Json.createArrayBuilder();
        for (String r : roles) ab.add(r);

        return Json.createObjectBuilder(base)
                .add("realmRoles", ab.build())
                .build();
    }

    /** Enable/Disable user (partial update is accepted by Keycloak) */
    public void setEnabled(String userId, boolean enabled) {
        JsonObject patch = Json.createObjectBuilder()
                .add("enabled", enabled)
                .build();
        String path = adminBase() + "/users/" + userId;
        try (Response res = authed(path).put(Entity.json(patch))) {
            if (res.getStatus() != 204) {
                String body = res.hasEntity() ? res.readEntity(String.class) : "";
                throw new RuntimeException("Set enabled failed: " + res.getStatus() + " " + body);
            }
        }
    }

    /* =================== realm roles =================== */

    private JsonObject getRealmRoleRep(String roleName) {
        String path = adminBase() + "/roles/" + roleName;
        try (Response res = authed(path).get()) {
            if (res.getStatus() != 200) throw new RuntimeException("Role not found: " + roleName);
            return res.readEntity(JsonObject.class);
        }
    }

    /** Return realm roles (names) assigned to a user */
    public List<String> getUserRealmRoles(String userId) {
        String base = adminBase() + "/users/" + userId + "/role-mappings/realm";

        // 1) Intentar el endpoint expandido de compuestos (Keycloak 26+: singular)
        String pathComposite = base + "/composite";
        try (Response res = authed(pathComposite).get()) {
            if (res.getStatus() == 200) {
                String body = res.readEntity(String.class);
                try (JsonReader rdr = Json.createReader(new StringReader(body))) {
                    return rdr.readArray().stream()
                            .map(v -> ((JsonObject) v).getString("name"))
                            .collect(Collectors.toList());
                }
            } else if (res.getStatus() != 404) {
                throw new RuntimeException("Get user realm roles (composite) failed: " + res.getStatus());
            }
            // si 404, seguimos al fallback
        }

        // 2) Fallback: roles asignados directamente al realm (sin expandir)
        try (Response res = authed(base).get()) {
            if (res.getStatus() != 200) {
                throw new RuntimeException("Get user realm roles failed: " + res.getStatus());
            }
            String body = res.readEntity(String.class);
            try (JsonReader rdr = Json.createReader(new StringReader(body))) {
                return rdr.readArray().stream()
                        .map(v -> ((JsonObject) v).getString("name"))
                        .collect(Collectors.toList());
            }
        }
    }

    public boolean userHasRealmRole(String userId, String roleName) {
        return getUserRealmRoles(userId).stream().anyMatch(r -> r.equalsIgnoreCase(roleName));
    }

    public void addRealmRoles(String userId, List<String> roles) {
        JsonArrayBuilder arr = Json.createArrayBuilder();
        for (String r : roles) arr.add(getRealmRoleRep(r));
        String path = adminBase() + "/users/" + userId + "/role-mappings/realm";
        try (Response res = authed(path).post(Entity.json(arr.build()))) {
            if (res.getStatus() != 204) throw new RuntimeException("Add realm roles failed: " + res.getStatus());
        }
    }

    public void removeRealmRoles(String userId, List<String> roles) {
        JsonArrayBuilder arr = Json.createArrayBuilder();
        for (String r : roles) arr.add(getRealmRoleRep(r));
        String path = adminBase() + "/users/" + userId + "/role-mappings/realm";
        try (Response res = authed(path).method("DELETE", Entity.json(arr.build()))) {
            if (res.getStatus() != 204) throw new RuntimeException("Remove realm roles failed: " + res.getStatus());
        }
    }

    /* =================== sessions =================== */

    public void logoutUser(String userId) {
        String path = adminBase() + "/users/" + userId + "/logout";
        try (Response res = authed(path).post(Entity.json("{}"))) {
            if (res.getStatus() != 204) throw new RuntimeException("Logout failed: " + res.getStatus());
        }
    }

    /* =================== groups =================== */

    public Optional<JsonObject> findGroupByName(String name) {
        String path = adminBase() + "/groups?search=" + URLEncoder.encode(name, StandardCharsets.UTF_8);
        try (Response res = authed(path).get()) {
            if (res.getStatus() != 200) throw new RuntimeException("Find group failed: " + res.getStatus());
            String body = res.readEntity(String.class);
            try (JsonReader rdr = Json.createReader(new StringReader(body))) {
                return rdr.readArray().stream()
                        .map(v -> (JsonObject) v)
                        // algunos resultados son “contiene”; matcheá por nombre exacto
                        .filter(o -> name.equalsIgnoreCase(o.getString("name", "")))
                        .findFirst();
            }
        }
    }

    public boolean userInGroup(String userId, String groupId) {
        String path = adminBase() + "/users/" + userId + "/groups";
        try (Response res = authed(path).get()) {
            if (res.getStatus() != 200) throw new RuntimeException("List user groups failed: " + res.getStatus());
            String body = res.readEntity(String.class);
            try (JsonReader rdr = Json.createReader(new StringReader(body))) {
                return rdr.readArray().stream()
                        .map(v -> (JsonObject) v)
                        .anyMatch(g -> groupId.equals(g.getString("id", "")));
            }
        }
    }

    /** Quita usuario de un grupo (id del grupo) */
    public void removeUserFromGroup(String userId, String groupId) {
        String path = adminBase() + "/users/" + userId + "/groups/" + groupId;
        try (Response res = authed(path).delete()) {
            if (res.getStatus() != 204) throw new RuntimeException("Remove from group failed: " + res.getStatus());
        }
    }


}


