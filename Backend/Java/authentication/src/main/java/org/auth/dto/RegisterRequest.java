package org.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload used to register a new user.
 */
public class RegisterRequest {

    /**
     * Desired username for the new user.
     */
    @NotBlank(message = "Username is required.")
    @Size(min = 3, max = 100, message = "Username must be between 3 and 100 characters.")
    public String username;

    /**
     * Plaintext password for the new user.
     */
    @NotBlank(message = "Password is required.")
    @Size(min = 6, max = 255, message = "Password must be at least 6 characters.")
    public String password;

    /**
     * Email address for the new user. This field is required.
     */
    @NotBlank(message = "Email is required.")
    @Email(message = "Email must be a valid email address.")
    @Size(max = 255, message = "Email must be at most 255 characters.")
    public String email;
}
