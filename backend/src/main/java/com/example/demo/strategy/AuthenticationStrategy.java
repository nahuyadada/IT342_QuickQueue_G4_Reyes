package com.example.demo.strategy;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;

/**
 * Strategy Pattern (Behavioral) — Strategy Interface
 *
 * Defines a common interface for different authentication strategies.
 * Each strategy encapsulates a specific login algorithm (user login,
 * admin login, etc.) without cluttering AuthService with if-else chains.
 *
 * Adding new auth methods (OTP, social login) means creating a new
 * strategy class — no modification of existing code (Open/Closed Principle).
 */
public interface AuthenticationStrategy {

    /**
     * Execute the authentication logic for the given login request.
     */
    AuthResponse authenticate(LoginRequest request);
}
