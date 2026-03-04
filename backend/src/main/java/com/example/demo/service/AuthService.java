package com.example.demo.service;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .build();

        userRepository.save(user);

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
                .message("Registration successful")
                .build();
    }

    public AuthResponse registerAdmin(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.ADMIN)
                .build();

        userRepository.save(user);

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
                .message("Admin registration successful")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

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
                .message("Login successful")
                .build();
    }

    public AuthResponse adminLogin(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Access denied. Admin credentials required.");
        }

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
                .message("Admin login successful")
                .build();
    }
}
