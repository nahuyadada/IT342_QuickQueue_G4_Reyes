package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Builder Pattern (Creational)
 *
 * Standardized API response matching the SDD §5.1 response structure:
 * { success, data, error: { code, message, details }, timestamp }
 *
 * The original code returned inconsistent Map.of("message", ...) or raw objects.
 * This builder enforces a consistent contract across ALL endpoints, using the
 * SDD-defined error codes (AUTH-001, VALID-001, etc.).
 *
 * Uses a fluent static factory approach: ApiResponse.success(data),
 * ApiResponse.error("AUTH-001", "Invalid credentials").
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private ErrorDetail error;
    private String timestamp;

    // ── Static Factory Methods (Builder Pattern) ──────────────────

    /**
     * Build a successful response wrapping data.
     */
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setData(data);
        response.setTimestamp(Instant.now().toString());
        return response;
    }

    /**
     * Build an error response with SDD error code and message.
     */
    public static <T> ApiResponse<T> error(String code, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setError(new ErrorDetail(code, message, null));
        response.setTimestamp(Instant.now().toString());
        return response;
    }

    /**
     * Build an error response with SDD error code, message, and details.
     */
    public static <T> ApiResponse<T> error(String code, String message, Object details) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setError(new ErrorDetail(code, message, details));
        response.setTimestamp(Instant.now().toString());
        return response;
    }

    // ── Nested Error Detail ────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorDetail {
        private String code;
        private String message;
        private Object details;
    }
}
