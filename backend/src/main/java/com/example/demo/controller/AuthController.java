package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.GoogleAuthRequest;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AuthController — Refactored to use:
 *  - ApiResponse (Builder Pattern) for standardized SDD §5.1 response format
 *  - SDD error codes (AUTH-001, VALID-001, etc.)
 *
 * BEFORE: Returns inconsistent Map.of("message", ...) or raw AuthResponse objects.
 * AFTER:  All responses use ApiResponse.success(data) / ApiResponse.error(code, message).
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<?>> register(@RequestBody RegisterRequest request) {
        try {
            // Validation
            if (request.getName() == null || request.getName().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-001", "Validation failed", Map.of("name", "Name is required")));
            }
            if (request.getEmail() == null || request.getEmail().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-001", "Validation failed", Map.of("email", "Email is required")));
            }
            if (request.getPassword() == null || request.getPassword().length() < 6) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-001", "Validation failed", Map.of("password", "Password must be at least 6 characters")));
            }

            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("DB-002", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> login(@RequestBody LoginRequest request) {
        try {
            if (request.getEmail() == null || request.getEmail().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-001", "Validation failed", Map.of("email", "Email is required")));
            }
            if (request.getPassword() == null || request.getPassword().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-001", "Validation failed", Map.of("password", "Password is required")));
            }

            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("AUTH-001", "Invalid email or password"));
        }
    }

    @PostMapping("/admin/login")
    public ResponseEntity<ApiResponse<?>> adminLogin(@RequestBody LoginRequest request) {
        try {
            if (request.getEmail() == null || request.getEmail().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-001", "Validation failed", Map.of("email", "Email is required")));
            }
            if (request.getPassword() == null || request.getPassword().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-001", "Validation failed", Map.of("password", "Password is required")));
            }

            AuthResponse response = authService.adminLogin(request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("AUTH-003", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("AUTH-001", "Invalid admin credentials"));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<?>> googleLogin(@RequestBody GoogleAuthRequest request) {
        try {
            AuthResponse response = authService.googleLogin(request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("AUTH-001",
                            e.getMessage() == null ? "Google sign-in failed" : e.getMessage()));
        }
    }

    @GetMapping("/google/client-id")
    public ResponseEntity<ApiResponse<?>> googleClientId() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("clientId", authService.getGoogleClientId())));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<?>> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Authenticated")));
    }
}
