package com.example.demo.office.controller;

import com.example.demo.auth.service.AuthService;
import com.example.demo.queue.facade.QueueFacade;
import com.example.demo.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Dedicated controller for admin-only office operations.
 * Kept separate from OfficeController to avoid any routing-conflict risk
 * and to make the file unambiguously new for Maven incremental builds.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminOfficeController {

    private final QueueFacade queueFacade;
    private final AuthService authService;

    @GetMapping("/all-offices")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listOffices(
            @RequestHeader("Authorization") String authHeader) {
        try {
            ensureAdmin(authHeader);
            return ResponseEntity.ok(ApiResponse.success(queueFacade.getAllApprovedOfficesForAdmin()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("AUTH-003", e.getMessage()));
        }
    }

    @PatchMapping("/remove-office/{officeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> removeOffice(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long officeId) {
        try {
            ensureAdmin(authHeader);
            queueFacade.deleteOffice(officeId);
            Map<String, Object> resp = new java.util.HashMap<>();
            resp.put("deleted", true);
            resp.put("officeId", officeId);
            return ResponseEntity.ok(ApiResponse.success(resp));
        } catch (RuntimeException e) {
            HttpStatus status = e.getMessage() != null && e.getMessage().contains("not found")
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.FORBIDDEN;
            return ResponseEntity.status(status)
                    .body(ApiResponse.error(status == HttpStatus.NOT_FOUND ? "BUSINESS-002" : "AUTH-003", e.getMessage()));
        }
    }

    private void ensureAdmin(String authHeader) {
        Map<String, Object> profile = authService.getCurrentUserProfile(authHeader);
        Object role = profile.get("role");
        if (role == null || !"ADMIN".equalsIgnoreCase(String.valueOf(role))) {
            throw new RuntimeException("Admin access required");
        }
    }
}
