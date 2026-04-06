package com.example.demo.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2AuthenticationFailureHandler implements AuthenticationFailureHandler {

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
            throws IOException, ServletException {
        String message = exception.getMessage() == null ? "oauth2_login_failed" : exception.getMessage();

        if (message.toLowerCase().contains("access_denied")) {
            response.sendRedirect(frontendUrl + "/");
            return;
        }

        response.sendRedirect(frontendUrl + "/auth/callback?error="
                + URLEncoder.encode(message, StandardCharsets.UTF_8));
    }
}