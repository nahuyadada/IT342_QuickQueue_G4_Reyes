package com.example.demo.service;

import com.example.demo.dto.GoogleAuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RegisterRequest;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

        private static final String GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
        private final RestClient restClient = RestClient.create();

        @Value("${google.oauth.client-id}")
        private String googleClientId;

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

        return buildAuthResponse(user, "Registration successful");
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

        return buildAuthResponse(user, "Admin registration successful");
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return buildAuthResponse(user, "Login successful");
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

                return buildAuthResponse(user, "Admin login successful");
        }

        public AuthResponse googleLogin(GoogleAuthRequest request) {
                if (request == null || request.getCredential() == null || request.getCredential().isBlank()) {
                        throw new RuntimeException("Google credential is required");
                }

                GoogleTokenInfo tokenInfo = restClient.get()
                        .uri(GOOGLE_TOKEN_INFO_URL + "?id_token={idToken}", request.getCredential())
                                .retrieve()
                                .body(GoogleTokenInfo.class);

                if (tokenInfo == null || tokenInfo.aud() == null || !googleClientId.equals(tokenInfo.aud())) {
                        throw new RuntimeException("Invalid Google sign-in request");
                }

                if (!Boolean.TRUE.equals(tokenInfo.emailVerified()) || tokenInfo.email() == null || tokenInfo.email().isBlank()) {
                        throw new RuntimeException("Google account email is not verified");
                }

                        User user = upsertGoogleUser(tokenInfo.email(), tokenInfo.name());

                return buildAuthResponse(user, "Google sign-in successful");
        }

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

        private User updateUserNameIfNeeded(User user, String googleName) {
                if (googleName != null && !googleName.isBlank() && !googleName.equals(user.getName())) {
                        user.setName(googleName);
                        return userRepository.save(user);
                }

                return user;
        }

        private String resolveDisplayName(GoogleTokenInfo tokenInfo) {
                if (tokenInfo.name() != null && !tokenInfo.name().isBlank()) {
                        return tokenInfo.name();
                }

                return tokenInfo.email().split("@")[0];
        }

        private User upsertGoogleUser(String email, String name) {
                return userRepository.findByEmail(email)
                                .map(existingUser -> updateUserNameIfNeeded(existingUser, name))
                                .orElseGet(() -> userRepository.save(User.builder()
                                                .name((name != null && !name.isBlank()) ? name : email.split("@")[0])
                                                .email(email)
                                                .password(passwordEncoder.encode("GOOGLE_AUTH_" + UUID.randomUUID()))
                                                .role(User.Role.USER)
                                                .build()));
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

        private record GoogleTokenInfo(
                        String aud,
                        String email,
                        String name,
                        @JsonProperty("email_verified") Boolean emailVerified
        ) {
        }
}
