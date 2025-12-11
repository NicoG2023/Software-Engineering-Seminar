package org.auth.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.auth.model.*;
import org.auth.repository.UserRepository;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Application service responsible for handling user-related business logic.
 * <p>
 * This includes:
 * <ul>
 *     <li>User registration</li>
 *     <li>User authentication</li>
 *     <li>Role management</li>
 *     <li>User activation and deactivation</li>
 *     <li>Lookup operations</li>
 * </ul>
 */
@ApplicationScoped
@Transactional
public class UserService {

    @Inject
    UserRepository userRepository;

    @Inject
    PasswordService passwordService;

    /**
     * Registers a new user with the default role {@link UserRole#CUSTOMER}.
     *
     * @param username    the desired username; must not be {@code null} or empty
     * @param rawPassword the plaintext password; must not be {@code null} or empty
     * @param email       optional email address; may be {@code null}
     * @return the newly created {@link User}
     * @throws IllegalArgumentException if the username already exists
     */
    public User registerCustomer(String username, String rawPassword, String email) {
        return registerUser(username, rawPassword, email, UserRole.CUSTOMER);
    }

    /**
     * Registers a new user with an explicit role.
     * <p>
     * Useful for administrative operations such as creating admin accounts.
     *
     * @param username    the desired username; must not be {@code null} or empty
     * @param rawPassword the plaintext password; must not be {@code null} or empty
     * @param email       optional email address; may be {@code null}
     * @param role        the role to assign to the new user; must not be {@code null}
     * @return the newly created {@link User}
     * @throws IllegalArgumentException if the username already exists
     */
    public User registerUser(String username, String rawPassword, String email, UserRole role) {
        Objects.requireNonNull(role, "Role cannot be null.");
        validateUsername(username);
        validateEmail(email);

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists: " + username);
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists: " + email);
        }

        User user = new User();
        user.username = username.trim();
        user.passwordHash = passwordService.hashPassword(rawPassword);
        user.email = email.trim();
        user.role = role;
        user.enabled = true;

        userRepository.persist(user);
        return user;
    }

    /**
     * Returns a list of all users present in the system.
     *
     * @return a non-null list of {@link User} instances
     */
    @Transactional(Transactional.TxType.SUPPORTS)
    public List<User> listAllUsers() {
        return userRepository.listAll();
    }

    /**
     * Retrieves a user by its identifier.
     *
     * @param id the user ID; must not be {@code null}
     * @return an {@link Optional} containing the user if found, or empty if not found
     */
    @Transactional(Transactional.TxType.SUPPORTS)
    public Optional<User> findById(Long id) {
        Objects.requireNonNull(id, "User ID cannot be null.");
        return userRepository.findByIdOptional(id);
    }

    /**
     * Retrieves a user by its username.
     *
     * @param username the username to search for; must not be {@code null} or empty
     * @return an {@link Optional} containing the user if found, or empty if not found
     */
    @Transactional(Transactional.TxType.SUPPORTS)
    public Optional<User> findByUsername(String username) {
        validateUsername(username);
        return userRepository.findByUsername(username.trim());
    }

    /**
     * Changes the role of an existing user.
     *
     * @param userId  the ID of the user whose role is to be changed; must not be {@code null}
     * @param newRole the new role to assign; must not be {@code null}
     * @return the updated {@link User}
     * @throws IllegalArgumentException if the user does not exist
     */
    public User changeUserRole(Long userId, UserRole newRole) {
        Objects.requireNonNull(userId, "User ID cannot be null.");
        Objects.requireNonNull(newRole, "New role cannot be null.");

        User user = userRepository.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found: id=" + userId);
        }

        user.role = newRole;
        return user;
    }

    /**
     * Enables or disables a user account.
     *
     * @param userId the ID of the user to modify; must not be {@code null}
     * @param enabled {@code true} to enable the user, {@code false} to disable
     * @return the updated {@link User}
     * @throws IllegalArgumentException if the user does not exist
     */
    public User setUserEnabled(Long userId, boolean enabled) {
        Objects.requireNonNull(userId, "User ID cannot be null.");

        User user = userRepository.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found: id=" + userId);
        }

        user.enabled = enabled;
        return user;
    }

    /**
     * Authenticates a user by checking the provided credentials.
     * <p>
     * If authentication is successful, the corresponding {@link User} is returned.
     * Otherwise, an exception is thrown.
     *
     * @param username    the username; must not be {@code null} or empty
     * @param rawPassword the plaintext password; must not be {@code null} or empty
     * @return the authenticated {@link User}
     * @throws IllegalArgumentException if the user does not exist, is disabled,
     *                                  or the provided password is invalid
     */
    @Transactional(Transactional.TxType.SUPPORTS)
    public User authenticate(String username, String rawPassword) {
        validateUsername(username);

        Optional<User> optionalUser = userRepository.findByUsername(username.trim());
        if (optionalUser.isEmpty()) {
            throw new IllegalArgumentException("Invalid username or password.");
        }

        User user = optionalUser.get();

        if (!Boolean.TRUE.equals(user.enabled)) {
            throw new IllegalArgumentException("User account is disabled.");
        }

        boolean validPassword = passwordService.verifyPassword(rawPassword, user.passwordHash);
        if (!validPassword) {
            throw new IllegalArgumentException("Invalid username or password.");
        }

        return user;
    }

    /**
     * Validates that the provided username is neither {@code null} nor blank.
     *
     * @param username the username to validate
     * @throws IllegalArgumentException if the username is invalid
     */
    private void validateUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username cannot be null or empty.");
        }
    }

    /**
     * Validates that the provided email is neither null nor blank.
     *
     * @param email the email to validate
     * @throws IllegalArgumentException if the email is invalid
     */
    private void validateEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email cannot be null or empty.");
        }
    }

}
