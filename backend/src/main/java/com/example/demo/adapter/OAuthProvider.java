package com.example.demo.adapter;

/**
 * Adapter Pattern (Structural) — OAuth Target Interface
 *
 * Internal interface for OAuth authentication providers.
 * Decouples the application from any specific OAuth provider's API.
 */
public interface OAuthProvider {

    /**
     * Authenticate using an OAuth credential and return standardized user info.
     */
    OAuthUserInfo authenticate(String credential);
}
