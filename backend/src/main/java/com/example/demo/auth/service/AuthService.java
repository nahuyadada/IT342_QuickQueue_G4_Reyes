package com.example.demo.auth.service;

import com.example.demo.auth.dto.AuthResponse;
import com.example.demo.auth.dto.GoogleAuthRequest;
import com.example.demo.auth.dto.LoginRequest;
import com.example.demo.auth.dto.RegisterRequest;
import com.example.demo.auth.factory.UserFactory;
import com.example.demo.auth.model.User;
import com.example.demo.auth.repository.UserRepository;
import com.example.demo.auth.strategy.AdminLoginStrategy;
import com.example.demo.auth.strategy.UserLoginStrategy;
import com.example.demo.integration.adapter.GoogleOAuthAdapter;
import com.example.demo.integration.adapter.OAuthUserInfo;
import com.example.demo.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

/**
 * AuthService — Refactored to use design patterns:
 *
 *  - Factory Pattern: UserFactory for user creation (replaces duplicated User.builder() chains)
 *  - Adapter Pattern: GoogleOAuthAdapter for Google token validation (extracts Google-specific logic)
 *  - Strategy Pattern: UserLoginStrategy / AdminLoginStrategy for login dispatch
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // Factory Pattern — centralized user creation
    private final UserFactory userFactory;

    // Adapter Pattern — Google OAuth abstracted behind OAuthProvider interface
    private final GoogleOAuthAdapter googleOAuthAdapter;

    // Strategy Pattern — login strategies
    private final UserLoginStrategy userLoginStrategy;
    private final AdminLoginStrategy adminLoginStrategy;

    @Value("${google.oauth.client-id}")
    private String googleClientId;

    /**
     * Register a new user.
     * BEFORE: Inline User.builder() chain with hardcoded LOCAL provider and USER role.
     * AFTER: Delegates to UserFactory.createLocalUser().
     */
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Factory Pattern — replaces inline User.builder() chain
        User user = userFactory.createLocalUser(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                User.Role.USER
        );

        userRepository.save(user);
        return buildAuthResponse(user, "Registration successful");
    }

    /**
     * Register a new admin.
     * BEFORE: Duplicated User.builder() chain (same as register but with ADMIN role).
     * AFTER: Same UserFactory, just a different role parameter.
     */
    public AuthResponse registerAdmin(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Factory Pattern — same factory, different role
        User user = userFactory.createLocalUser(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                User.Role.ADMIN
        );

        userRepository.save(user);
        return buildAuthResponse(user, "Admin registration successful");
    }

    /**
     * Standard user login.
     * BEFORE: Inline authentication + user lookup + response building.
     * AFTER: Delegates to UserLoginStrategy.
     */
    public AuthResponse login(LoginRequest request) {
        // Strategy Pattern — delegates to UserLoginStrategy
        return userLoginStrategy.authenticate(request);
    }

    /**
     * Admin login with role verification.
     * BEFORE: Duplicated login logic + inline role check.
     * AFTER: Delegates to AdminLoginStrategy (which encapsulates the role check).
     */
    public AuthResponse adminLogin(LoginRequest request) {
        // Strategy Pattern — delegates to AdminLoginStrategy
        return adminLoginStrategy.authenticate(request);
    }

    /**
     * Google Sign-In via ID token.
     * BEFORE: Google-specific REST call, token validation, and response parsing
     *         were all embedded inline in this method.
     * AFTER: GoogleOAuthAdapter handles all Google-specific logic and returns
     *        a provider-agnostic OAuthUserInfo record.
     */
    public AuthResponse googleLogin(GoogleAuthRequest request) {
        if (request == null || request.getCredential() == null || request.getCredential().isBlank()) {
            throw new RuntimeException("Google credential is required");
        }

        // Adapter Pattern — Google-specific logic extracted to GoogleOAuthAdapter
        OAuthUserInfo userInfo = googleOAuthAdapter.authenticate(request.getCredential());

        User user = upsertGoogleUser(userInfo.email(), userInfo.name());
        return buildAuthResponse(user, "Google sign-in successful");
    }

    /**
     * OAuth2 flow callback (server-side redirect).
     */
    public AuthResponse authenticateWithGoogleOAuth2User(OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        Boolean emailVerified = oAuth2User.getAttribute("email_verified");

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Google account email is missing");
        }

        if (Boolean.FALSE.equals(emailVerified)) {
            throw new IllegalArgumentException("Google account email is not verified");
        }

        User user = upsertGoogleUser(email, name);
        return buildAuthResponse(user, "Google sign-in successful");
    }

    public String getGoogleClientId() {
        return googleClientId;
    }

    public Map<String, Object> getCurrentUserProfile(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Authorization header is missing or invalid");
        }

        String token = authHeader.substring(7);
        String email = jwtService.extractUsername(token);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole().name()
        );
    }

    public Map<String, Object> updateCurrentUserName(String authHeader, String newName) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Authorization header is missing or invalid");
        }

        String name = newName == null ? "" : newName.trim();
        if (name.isBlank()) {
            throw new RuntimeException("Name is required");
        }

        String token = authHeader.substring(7);
        String email = jwtService.extractUsername(token);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(name);
        User savedUser = userRepository.save(user);

        return Map.of(
                "id", savedUser.getId(),
                "name", savedUser.getName(),
                "email", savedUser.getEmail(),
                "role", savedUser.getRole().name()
        );
    }

    public void changePassword(String authHeader, String oldPassword, String newPassword) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Authorization header is missing or invalid");
        }

        String token = authHeader.substring(7);
        String email = jwtService.extractUsername(token);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getAuthProvider() == User.AuthProvider.GOOGLE) {
            throw new RuntimeException("Google accounts cannot change password here");
        }

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // ── Private Helpers ──────────────────────────────────────────────

    private User upsertGoogleUser(String email, String name) {
        return userRepository.findByEmail(email)
                .map(existingUser -> {
                    if (existingUser.getAuthProvider() != User.AuthProvider.GOOGLE) {
                        existingUser.setAuthProvider(User.AuthProvider.GOOGLE);
                        userRepository.save(existingUser);
                    }
                    return updateUserNameIfNeeded(existingUser, name);
                })
                .orElseGet(() -> {
                    // Factory Pattern — for Google users too
                    User newUser = userFactory.createGoogleUser(
                            (name != null && !name.isBlank()) ? name : email.split("@")[0],
                            email,
                            passwordEncoder.encode("GOOGLE_AUTH_" + UUID.randomUUID())
                    );
                    return userRepository.save(newUser);
                });
    }

    private User updateUserNameIfNeeded(User user, String googleName) {
        if (googleName != null && !googleName.isBlank() && !googleName.equals(user.getName())) {
            user.setName(googleName);
            return userRepository.save(user);
        }
        return user;
    }

    private AuthResponse buildAuthResponse(User user, String message) {
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .build();

        String token = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .id(user.getId())
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .message(message)
                .build();
    }
}
