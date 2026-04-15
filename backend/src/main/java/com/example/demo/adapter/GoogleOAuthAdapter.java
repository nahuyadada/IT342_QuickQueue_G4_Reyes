package com.example.demo.adapter;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Adapter Pattern (Structural) — Google OAuth Concrete Adapter
 *
 * Adapts Google's OAuth2 token validation endpoint to our internal
 * OAuthProvider interface. Extracts Google-specific logic (token verification,
 * client ID validation) that was previously embedded in AuthService.
 *
 * If we add Facebook, GitHub, or other OAuth providers in the future,
 * we just create a new adapter implementing OAuthProvider — no changes
 * to AuthService needed.
 */
@Component
public class GoogleOAuthAdapter implements OAuthProvider {

    private static final String GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";

    private final RestClient restClient = RestClient.create();

    @Value("${google.oauth.client-id}")
    private String googleClientId;

    @Override
    public OAuthUserInfo authenticate(String credential) {
        if (credential == null || credential.isBlank()) {
            throw new RuntimeException("Google credential is required");
        }

        GoogleTokenInfo tokenInfo = restClient.get()
                .uri(GOOGLE_TOKEN_INFO_URL + "?id_token={idToken}", credential)
                .retrieve()
                .body(GoogleTokenInfo.class);

        if (tokenInfo == null || tokenInfo.aud() == null || !googleClientId.equals(tokenInfo.aud())) {
            throw new RuntimeException("Invalid Google sign-in request");
        }

        if (!Boolean.TRUE.equals(tokenInfo.emailVerified()) ||
                tokenInfo.email() == null || tokenInfo.email().isBlank()) {
            throw new RuntimeException("Google account email is not verified");
        }

        String displayName = (tokenInfo.name() != null && !tokenInfo.name().isBlank())
                ? tokenInfo.name()
                : tokenInfo.email().split("@")[0];

        return new OAuthUserInfo(tokenInfo.email(), displayName, true);
    }

    /**
     * Google's token info response format (the "Adaptee").
     */
    private record GoogleTokenInfo(
            String aud,
            String email,
            String name,
            @JsonProperty("email_verified") Boolean emailVerified
    ) {
    }
}
