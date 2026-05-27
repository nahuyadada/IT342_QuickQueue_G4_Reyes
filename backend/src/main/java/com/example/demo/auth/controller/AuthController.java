package com.example.demo.auth.controller;

import com.example.demo.auth.dto.AuthResponse;
import com.example.demo.auth.dto.ChangePasswordRequest;
import com.example.demo.auth.dto.GoogleAuthRequest;
import com.example.demo.auth.dto.LoginRequest;
import com.example.demo.auth.dto.RegisterRequest;
import com.example.demo.auth.dto.UpdateProfileRequest;
import com.example.demo.auth.service.AuthService;
import com.example.demo.shared.dto.ApiResponse;
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
        try {
            return ResponseEntity.ok(ApiResponse.success(authService.getCurrentUserProfile(authHeader)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("AUTH-001", e.getMessage()));
        }
    }

    @PatchMapping("/password")
    public ResponseEntity<ApiResponse<?>> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ChangePasswordRequest request) {
        try {
            if (request.getOldPassword() == null || request.getOldPassword().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-001", "Current password is required"));
            }
            if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-001", "New password must be at least 6 characters"));
            }

            authService.changePassword(authHeader, request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Password changed successfully")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("AUTH-002", e.getMessage()));
        }
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<?>> updateCurrentUser(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateProfileRequest request) {
        try {
            if (request.getName() == null || request.getName().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-001", "Validation failed", Map.of("name", "Name is required")));
            }

            return ResponseEntity.ok(ApiResponse.success(authService.updateCurrentUserName(authHeader, request.getName())));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUSINESS-001", e.getMessage()));
        }
    }
}
