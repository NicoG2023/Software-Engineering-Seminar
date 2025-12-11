package org.auth.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request payload used to enable or disable a user account.
 */
public class ChangeEnabledRequest {

    /**
     * Desired enabled state. {@code true} to enable, {@code false} to disable.
     */
    @NotNull(message = "Enabled flag is required.")
    public Boolean enabled;
}
