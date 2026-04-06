package com.example.demo.strategy;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

/**
 * Strategy Pattern (Behavioral) — Concrete Strategy: Admin Login
 *
 * Admin authentication: same credential verification as UserLoginStrategy,
 * but adds an additional role check to ensure only ADMIN users can log in.
 * This avoids polluting a single login method with role-checking conditionals.
 */
@Component
@RequiredArgsConstructor
public class AdminLoginStrategy implements AuthenticationStrategy {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Override
    public AuthResponse authenticate(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Additional role verification — the key difference from UserLoginStrategy
        if (user.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Access denied. Admin credentials required.");
        }

        return buildAuthResponse(user, "Admin login successful");
    }

    private AuthResponse buildAuthResponse(User user, String message) {
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .build();

        String token = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .message(message)
                .build();
    }
}
