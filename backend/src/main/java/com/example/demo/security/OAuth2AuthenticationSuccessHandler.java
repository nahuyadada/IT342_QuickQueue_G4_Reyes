package com.example.demo.security;

import com.example.demo.dto.AuthResponse;
import com.example.demo.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Lazy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;

    public OAuth2AuthenticationSuccessHandler(@Lazy AuthService authService) {
        this.authService = authService;
    }

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {
        Object principal = authentication.getPrincipal();

        if (!(principal instanceof OAuth2User oAuth2User)) {
            response.sendRedirect(frontendUrl + "/auth/callback?error=oauth2_principal_invalid");
            return;
        }

        try {
            AuthResponse authResponse = authService.authenticateWithGoogleOAuth2User(oAuth2User);
            String encodedToken = URLEncoder.encode(authResponse.getAccessToken(), StandardCharsets.UTF_8);
            String encodedName = URLEncoder.encode(authResponse.getName(), StandardCharsets.UTF_8);
            String encodedEmail = URLEncoder.encode(authResponse.getEmail(), StandardCharsets.UTF_8);
            String encodedRole = URLEncoder.encode(authResponse.getRole(), StandardCharsets.UTF_8);

            response.sendRedirect(frontendUrl + "/auth/callback?token=" + encodedToken
                    + "&name=" + encodedName
                    + "&email=" + encodedEmail
                    + "&role=" + encodedRole);
        } catch (IllegalArgumentException ex) {
            String encodedMessage = URLEncoder.encode(ex.getMessage(), StandardCharsets.UTF_8);
            response.sendRedirect(frontendUrl + "/auth/callback?error=" + encodedMessage);
        }
    }
}