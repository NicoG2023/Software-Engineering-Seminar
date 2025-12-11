package org.auth.dto;

import jakarta.validation.constraints.NotNull;
import org.auth.model.UserRole;

/**
 * Request payload used to change the role of a user.
 */
public class ChangeRoleRequest {

    /**
     * The new role to assign to the user.
     */
    @NotNull(message = "Role is required.")
    public UserRole role;
}
