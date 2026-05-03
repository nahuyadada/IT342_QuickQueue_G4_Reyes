package com.example.demo.shared.dto;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ApiResponse (Builder Pattern).
 * Verifies success/error response construction and field integrity.
 */
class ApiResponseTest {

    @Test
    void success_shouldSetSuccessTrue() {
        ApiResponse<String> response = ApiResponse.success("test data");

        assertTrue(response.isSuccess());
        assertEquals("test data", response.getData());
        assertNull(response.getError());
    }

    @Test
    void success_shouldSetTimestamp() {
        ApiResponse<String> response = ApiResponse.success("data");

        assertNotNull(response.getTimestamp());
    }

    @Test
    void error_shouldSetSuccessFalse() {
        ApiResponse<String> response = ApiResponse.error("AUTH-001", "Invalid credentials");

        assertFalse(response.isSuccess());
        assertNull(response.getData());
        assertNotNull(response.getError());
    }

    @Test
    void error_shouldSetCodeAndMessage() {
        ApiResponse<String> response = ApiResponse.error("VALID-001", "Validation failed");

        assertEquals("VALID-001", response.getError().getCode());
        assertEquals("Validation failed", response.getError().getMessage());
    }

    @Test
    void error_withDetails_shouldIncludeDetails() {
        Map<String, String> details = Map.of("email", "Email is required");
        ApiResponse<String> response = ApiResponse.error("VALID-001", "Validation failed", details);

        assertNotNull(response.getError().getDetails());
        assertEquals(details, response.getError().getDetails());
    }

    @Test
    void error_withoutDetails_shouldHaveNullDetails() {
        ApiResponse<String> response = ApiResponse.error("AUTH-001", "Invalid");

        assertNull(response.getError().getDetails());
    }

    @Test
    void success_withMapData_shouldReturnMapCorrectly() {
        Map<String, Object> data = Map.of("id", 1, "name", "Test");
        ApiResponse<Map<String, Object>> response = ApiResponse.success(data);

        assertTrue(response.isSuccess());
        assertEquals(1, response.getData().get("id"));
        assertEquals("Test", response.getData().get("name"));
    }

    @Test
    void success_withNullData_shouldStillBeSuccess() {
        ApiResponse<Object> response = ApiResponse.success(null);

        assertTrue(response.isSuccess());
        assertNull(response.getData());
    }
}
