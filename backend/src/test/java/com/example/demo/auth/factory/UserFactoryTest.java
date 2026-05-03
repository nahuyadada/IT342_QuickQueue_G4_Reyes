package com.example.demo.auth.factory;

import com.example.demo.auth.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for UserFactory (Factory Pattern).
 * Verifies correct creation of local and Google-authenticated users.
 */
class UserFactoryTest {

    private UserFactory userFactory;

    @BeforeEach
    void setUp() {
        userFactory = new UserFactory();
    }

    @Test
    void createLocalUser_shouldSetAllFieldsCorrectly() {
        User user = userFactory.createLocalUser("John Doe", "john@test.com", "encodedPass", User.Role.USER);

        assertEquals("John Doe", user.getName());
        assertEquals("john@test.com", user.getEmail());
        assertEquals("encodedPass", user.getPassword());
        assertEquals(User.Role.USER, user.getRole());
        assertEquals(User.AuthProvider.LOCAL, user.getAuthProvider());
    }

    @Test
    void createLocalUser_withAdminRole_shouldSetAdminRole() {
        User user = userFactory.createLocalUser("Admin", "admin@test.com", "encodedPass", User.Role.ADMIN);

        assertEquals(User.Role.ADMIN, user.getRole());
        assertEquals(User.AuthProvider.LOCAL, user.getAuthProvider());
    }

    @Test
    void createGoogleUser_shouldSetGoogleProviderAndUserRole() {
        User user = userFactory.createGoogleUser("Google User", "google@gmail.com", "randomEncodedPass");

        assertEquals("Google User", user.getName());
        assertEquals("google@gmail.com", user.getEmail());
        assertEquals("randomEncodedPass", user.getPassword());
        assertEquals(User.Role.USER, user.getRole());
        assertEquals(User.AuthProvider.GOOGLE, user.getAuthProvider());
    }

    @Test
    void createLocalUser_shouldNotReturnNull() {
        User user = userFactory.createLocalUser("Test", "test@test.com", "pass", User.Role.USER);
        assertNotNull(user);
    }

    @Test
    void createGoogleUser_shouldNotReturnNull() {
        User user = userFactory.createGoogleUser("Test", "test@test.com", "pass");
        assertNotNull(user);
    }
}
