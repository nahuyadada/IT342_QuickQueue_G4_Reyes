package com.example.demo.integration.adapter;

/**
 * Standardized OAuth user information, decoupled from any provider's format.
 */
public record OAuthUserInfo(
        String email,
        String name,
        boolean emailVerified
) {
}
