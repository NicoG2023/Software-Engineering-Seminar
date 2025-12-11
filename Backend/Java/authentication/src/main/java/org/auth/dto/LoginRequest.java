package org.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload used to authenticate a user.
 */
public class LoginRequest {

    /**
     * Username of the user attempting to authenticate.
     */
    @NotBlank(message = "Username is required.")
    @Size(min = 3, max = 100, message = "Username must be between 3 and 100 characters.")
    public String username;

    /**
     * Plaintext password of the user.
     */
    @NotBlank(message = "Password is required.")
    @Size(min = 6, max = 255, message = "Password must be at least 6 characters.")
    public String password;
}
