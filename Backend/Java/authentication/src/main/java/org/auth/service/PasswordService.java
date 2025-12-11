package org.auth.service;

import jakarta.enterprise.context.ApplicationScoped;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

/**
 * Service responsible for hashing and verifying user passwords.
 * <p>
 * This implementation uses SHA-256 with Base64 encoding.  
 * For production environments, it is recommended to use stronger password hashing algorithms
 * such as bcrypt, scrypt, or Argon2.
 */
@ApplicationScoped
public class PasswordService {

    private static final String HASH_ALGORITHM = "SHA-256";

    /**
     * Computes a SHA-256 hash of the given raw password and returns it encoded in Base64.
     *
     * @param rawPassword the plaintext password; must not be {@code null} or empty
     * @return a Base64-encoded SHA-256 hash of the password
     * @throws IllegalArgumentException if {@code rawPassword} is {@code null} or empty
     */
    public String hashPassword(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("Password cannot be null or empty.");
        }

        try {
            MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
            byte[] hashBytes = digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashBytes);

        } catch (NoSuchAlgorithmException e) {
            // This should never occur with SHA-256 available in all standard JDKs.
            throw new IllegalStateException("Hash algorithm unavailable: " + HASH_ALGORITHM, e);
        }
    }

    /**
     * Verifies whether a raw password matches the stored hashed password.
     *
     * @param rawPassword the plaintext password to verify; must not be {@code null} or empty
     * @param storedHash  the previously computed hash stored in the database; must not be {@code null} or empty
     * @return {@code true} if the password is valid, {@code false} otherwise
     * @throws IllegalArgumentException if any parameter is {@code null} or empty
     */
    public boolean verifyPassword(String rawPassword, String storedHash) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("Password cannot be null or empty.");
        }
        if (storedHash == null || storedHash.isBlank()) {
            throw new IllegalArgumentException("Stored hash cannot be null or empty.");
        }

        String computedHash = hashPassword(rawPassword);
        return storedHash.equals(computedHash);
    }
}
