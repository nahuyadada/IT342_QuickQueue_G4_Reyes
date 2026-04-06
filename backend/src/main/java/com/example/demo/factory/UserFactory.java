package com.example.demo.factory;

import com.example.demo.model.User;
import org.springframework.stereotype.Component;

/**
 * Factory Pattern (Creational)
 *
 * Centralizes User object creation. The original AuthService had duplicated
 * User.builder() chains in register(), registerAdmin(), and upsertGoogleUser().
 * This factory extracts that creation logic into reusable methods.
 */
@Component
public class UserFactory {

    /**
     * Creates a user who registered via email/password (LOCAL auth provider).
     */
    public User createLocalUser(String name, String email, String encodedPassword, User.Role role) {
        return User.builder()
                .name(name)
                .email(email)
                .password(encodedPassword)
                .role(role)
                .authProvider(User.AuthProvider.LOCAL)
                .build();
    }

    /**
     * Creates a user who authenticated via Google OAuth (GOOGLE auth provider).
     */
    public User createGoogleUser(String name, String email, String encodedPassword) {
        return User.builder()
                .name(name)
                .email(email)
                .password(encodedPassword)
                .role(User.Role.USER)
                .authProvider(User.AuthProvider.GOOGLE)
                .build();
    }
}
