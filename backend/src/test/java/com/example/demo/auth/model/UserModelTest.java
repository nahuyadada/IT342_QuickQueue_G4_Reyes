package com.example.demo.auth.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for User entity model.
 * Verifies builder, roles, and auth providers.
 */
class UserModelTest {

    @Test
    void builder_shouldCreateUserWithAllFields() {
        User user = User.builder()
                .id(1L)
                .name("Test User")
                .email("test@test.com")
                .password("encoded")
                .role(User.Role.USER)
                .authProvider(User.AuthProvider.LOCAL)
                .build();

        assertEquals(1L, user.getId());
        assertEquals("Test User", user.getName());
        assertEquals("test@test.com", user.getEmail());
        assertEquals("encoded", user.getPassword());
        assertEquals(User.Role.USER, user.getRole());
        assertEquals(User.AuthProvider.LOCAL, user.getAuthProvider());
    }

    @Test
    void role_shouldHaveTwoValues() {
        User.Role[] roles = User.Role.values();
        assertEquals(2, roles.length);
    }

    @Test
    void role_USER_exists() {
        assertNotNull(User.Role.valueOf("USER"));
    }

    @Test
    void role_ADMIN_exists() {
        assertNotNull(User.Role.valueOf("ADMIN"));
    }

    @Test
    void authProvider_shouldHaveTwoValues() {
        User.AuthProvider[] providers = User.AuthProvider.values();
        assertEquals(2, providers.length);
    }

    @Test
    void authProvider_LOCAL_exists() {
        assertNotNull(User.AuthProvider.valueOf("LOCAL"));
    }

    @Test
    void authProvider_GOOGLE_exists() {
        assertNotNull(User.AuthProvider.valueOf("GOOGLE"));
    }

    @Test
    void setName_shouldUpdateName() {
        User user = User.builder().name("Original").build();
        user.setName("Updated");
        assertEquals("Updated", user.getName());
    }
}
