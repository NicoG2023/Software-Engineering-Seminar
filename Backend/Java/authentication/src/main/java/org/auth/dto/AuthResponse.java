package org.auth.dto;

/**
 * Response payload returned after a successful authentication (login).
 */
public class AuthResponse {

    /**
     * JSON Web Token (JWT) that can be used to access protected resources.
     */
    public String accessToken;

    /**
     * Token type, typically {@code "Bearer"}.
     */
    public String tokenType = "Bearer";

    /**
     * Public user information associated with the authenticated principal.
     */
    public UserResponse user;

    /**
     * Creates an {@link AuthResponse} with the given token and user information.
     *
     * @param token the JWT token string; must not be {@code null}
     * @param user  the authenticated user information; must not be {@code null}
     * @return a new {@link AuthResponse} instance
     */
    public static AuthResponse of(String token, UserResponse user) {
        AuthResponse response = new AuthResponse();
        response.accessToken = token;
        response.user = user;
        return response;
    }
}
