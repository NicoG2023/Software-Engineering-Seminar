package org.auth.service;

import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import org.auth.model.User;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Instant;
import java.util.Set;

/**
 * Service responsible for generating JSON Web Tokens (JWT) for authenticated users.
 * <p>
 * This service relies on the SmallRye JWT API and the configuration provided via
 * {@code application.properties}, in particular:
 * <ul>
 *     <li>{@code mp.jwt.verify.issuer}</li>
 *     <li>{@code smallrye.jwt.sign.key-location}</li>
 *     <li>{@code jwt.lifespan.seconds} (optional)</li>
 * </ul>
 *
 * The private key used to sign tokens must be configured using
 * {@code smallrye.jwt.sign.key-location} and should typically point to a PEM file
 * available on the classpath or filesystem.
 */
@ApplicationScoped
public class JwtService {

    @ConfigProperty(name = "mp.jwt.verify.issuer")
    String issuer;

    @ConfigProperty(name = "jwt.lifespan.seconds", defaultValue = "3600")
    long tokenLifespanSeconds;

    /**
     * Generates a signed JWT for the given authenticated user.
     * <p>
     * The token includes the following standard claims:
     * <ul>
     *     <li>{@code iss} - issuer, taken from {@code mp.jwt.verify.issuer}</li>
     *     <li>{@code sub} - subject, set to the username</li>
     *     <li>{@code upn} - user principal name, set to the username</li>
     *     <li>{@code iat} - issued-at timestamp</li>
     *     <li>{@code exp} - expiration timestamp</li>
     *     <li>{@code groups} - set of roles, containing the user's role name</li>
     * </ul>
     * In addition, some custom claims are added:
     * <ul>
     *     <li>{@code userId} - the numeric user identifier</li>
     *     <li>{@code email} - the user's email address</li>
     * </ul>
     *
     * @param user the authenticated user; must not be {@code null}
     * @return a signed JWT as a {@link String}
     * @throws IllegalArgumentException if {@code user} is {@code null}
     */
    public String generateToken(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User must not be null when generating a JWT.");
        }

        Instant now = Instant.now();
        Instant expiration = now.plusSeconds(tokenLifespanSeconds);

        return Jwt.issuer(issuer)
                .subject(user.username)
                .upn(user.username)
                .groups(Set.of(user.role.name()))
                .issuedAt(now)
                .expiresAt(expiration)
                .claim("userId", user.id)
                .claim("email", user.email)
                .sign();
    }
}
