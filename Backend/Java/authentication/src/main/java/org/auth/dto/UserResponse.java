package org.auth.dto;

import org.auth.model.User;
import org.auth.model.UserRole;

import java.time.LocalDateTime;

/**
 * Response DTO representing public information about a user.
 */
public class UserResponse {

    /**
     * Unique identifier of the user.
     */
    public Long id;

    /**
     * Username of the user.
     */
    public String username;

    /**
     * Email address of the user.
     */
    public String email;

    /**
     * Role assigned to the user.
     */
    public UserRole role;

    /**
     * Indicates whether the user account is enabled.
     */
    public Boolean enabled;

    /**
     * Timestamp when the user was created.
     */
    public LocalDateTime createdAt;

    /**
     * Timestamp when the user was last updated.
     */
    public LocalDateTime updatedAt;

    /**
     * Creates a {@link UserResponse} from a {@link User} entity.
     *
     * @param user the user entity; must not be {@code null}
     * @return a new {@link UserResponse} populated with user data
     */
    public static UserResponse fromEntity(User user) {
        UserResponse dto = new UserResponse();
        dto.id = user.id;
        dto.username = user.username;
        dto.email = user.email;
        dto.role = user.role;
        dto.enabled = user.enabled;
        dto.createdAt = user.createdAt;
        dto.updatedAt = user.updatedAt;
        return dto;
    }
}
