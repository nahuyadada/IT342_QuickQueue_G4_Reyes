package com.example.demo.office.controller;

import com.example.demo.auth.service.AuthService;
import com.example.demo.office.dto.OfficeRegistrationRequest;
import com.example.demo.office.model.ServiceOffice;
import com.example.demo.queue.facade.QueueFacade;
import com.example.demo.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OfficeController {

    private final QueueFacade queueFacade;
    private final AuthService authService;

    @GetMapping("/offices")
    public ResponseEntity<ApiResponse<List<ServiceOffice>>> getOffices() {
        List<ServiceOffice> offices = queueFacade.getActiveOffices();
        return ResponseEntity.ok(ApiResponse.success(offices));
    }

    @GetMapping("/offices/queue-counts")
    public ResponseEntity<ApiResponse<Map<Long, Integer>>> getQueueCounts() {
        Map<Long, Integer> counts = queueFacade.getQueueCounts();
        return ResponseEntity.ok(ApiResponse.success(counts));
    }

    @PostMapping("/offices/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> registerOffice(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody OfficeRegistrationRequest request) {
        try {
            Map<String, Object> profile = authService.getCurrentUserProfile(authHeader);
            Long ownerUserId = ((Number) profile.get("id")).longValue();
            Map<String, Object> office = queueFacade.registerOffice(ownerUserId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(office));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUSINESS-001", e.getMessage()));
        }
    }

    @GetMapping("/offices/my-registrations")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyRegistrations(
            @RequestHeader("Authorization") String authHeader) {
        try {
            Map<String, Object> profile = authService.getCurrentUserProfile(authHeader);
            Long ownerUserId = ((Number) profile.get("id")).longValue();
            List<Map<String, Object>> registrations = queueFacade.getMyRegistrations(ownerUserId);
            return ResponseEntity.ok(ApiResponse.success(registrations));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUSINESS-001", e.getMessage()));
        }
    }

    @PatchMapping("/offices/{officeId}/toggle")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleOffice(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long officeId,
            @RequestParam(required = false) String action,
            @RequestBody(required = false) Map<String, Object> body) {
        try {
            Map<String, Object> profile = authService.getCurrentUserProfile(authHeader);
            Long userId = ((Number) profile.get("id")).longValue();
            Object role = profile.get("role");
            boolean isAdmin = role != null && "ADMIN".equalsIgnoreCase(String.valueOf(role));

            String resolvedAction = resolveAction(action, body);
            if (resolvedAction != null && "delete".equalsIgnoreCase(resolvedAction)) {
                if (!isAdmin) {
                    throw new RuntimeException("Admin access required");
                }
                queueFacade.deleteOffice(officeId);
                Map<String, Object> resp = new java.util.HashMap<>();
                resp.put("deleted", true);
                resp.put("officeId", officeId);
                return ResponseEntity.ok(ApiResponse.success(resp));
            }

            Map<String, Object> office = queueFacade.toggleOfficeActive(officeId, userId);
            return ResponseEntity.ok(ApiResponse.success(office));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUSINESS-001", e.getMessage()));
        }
    }

    /** Admin delete via POST — unique path that registers reliably alongside /auth/admin/login. */
    @PostMapping("/admin/delete-office")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteOfficePost(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> body) {
        try {
            ensureAdmin(authHeader);
            Object rawId = body != null ? body.get("officeId") : null;
            if (rawId == null) {
                throw new RuntimeException("officeId is required");
            }
            Long officeId = ((Number) rawId).longValue();
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

    @GetMapping("/admin/offices")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAdminOffices(
            @RequestHeader("Authorization") String authHeader) {
        try {
            ensureAdmin(authHeader);
            List<Map<String, Object>> offices = queueFacade.getAllApprovedOfficesForAdmin();
            return ResponseEntity.ok(ApiResponse.success(offices));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("AUTH-003", e.getMessage()));
        }
    }

    @GetMapping("/admin/offices/registrations/pending")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPendingOfficeRegistrations(
            @RequestHeader("Authorization") String authHeader) {
        try {
            ensureAdmin(authHeader);
            List<Map<String, Object>> pending = queueFacade.getPendingOfficeRegistrations();
            return ResponseEntity.ok(ApiResponse.success(pending));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("AUTH-003", e.getMessage()));
        }
    }

    @PatchMapping("/admin/offices/registrations/{officeId}/approve")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approveOfficeRegistration(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long officeId) {
        try {
            ensureAdmin(authHeader);
            Map<String, Object> office = queueFacade.approveOfficeRegistration(officeId);
            return ResponseEntity.ok(ApiResponse.success(office));
        } catch (RuntimeException e) {
            HttpStatus status = e.getMessage().contains("pending") || e.getMessage().contains("not found")
                    ? HttpStatus.BAD_REQUEST
                    : HttpStatus.FORBIDDEN;
            return ResponseEntity.status(status)
                    .body(ApiResponse.error(status == HttpStatus.FORBIDDEN ? "AUTH-003" : "BUSINESS-001", e.getMessage()));
        }
    }

    /** Admin delete — PATCH matches other admin routes (approve/reject) that register reliably. */
    @PatchMapping("/admin/offices/{officeId}/delete")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteOfficeAdmin(
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

    @PatchMapping("/admin/offices/registrations/{officeId}/reject")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rejectOfficeRegistration(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long officeId) {
        try {
            ensureAdmin(authHeader);
            Map<String, Object> office = queueFacade.rejectOfficeRegistration(officeId);
            return ResponseEntity.ok(ApiResponse.success(office));
        } catch (RuntimeException e) {
            HttpStatus status = e.getMessage().contains("pending") || e.getMessage().contains("not found")
                    ? HttpStatus.BAD_REQUEST
                    : HttpStatus.FORBIDDEN;
            return ResponseEntity.status(status)
                    .body(ApiResponse.error(status == HttpStatus.FORBIDDEN ? "AUTH-003" : "BUSINESS-001", e.getMessage()));
        }
    }

    @PostMapping("/offices/{officeId}/staff")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addStaff(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long officeId,
            @RequestBody Map<String, String> body) {
        try {
            Map<String, Object> profile = authService.getCurrentUserProfile(authHeader);
            Long ownerId = ((Number) profile.get("id")).longValue();
            String email = body.get("email");

            if (email == null || email.isBlank()) {
                throw new RuntimeException("Staff email is required");
            }

            Map<String, Object> staff = queueFacade.addStaff(officeId, ownerId, email);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(staff));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUSINESS-001", e.getMessage()));
        }
    }

    @DeleteMapping("/offices/{officeId}/staff/{staffId}")
    public ResponseEntity<ApiResponse<String>> removeStaff(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long officeId,
            @PathVariable Long staffId) {
        try {
            Map<String, Object> profile = authService.getCurrentUserProfile(authHeader);
            Long ownerId = ((Number) profile.get("id")).longValue();

            queueFacade.removeStaff(officeId, ownerId, staffId);
            return ResponseEntity.ok(ApiResponse.success("Staff member removed"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUSINESS-001", e.getMessage()));
        }
    }

    @GetMapping("/offices/{officeId}/staff")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getOfficeStaff(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long officeId) {
        try {
            List<Map<String, Object>> staff = queueFacade.getOfficeStaff(officeId);
            return ResponseEntity.ok(ApiResponse.success(staff));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUSINESS-001", e.getMessage()));
        }
    }

    @GetMapping("/offices/staff-offices")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStaffOffices(
            @RequestHeader("Authorization") String authHeader) {
        try {
            Map<String, Object> profile = authService.getCurrentUserProfile(authHeader);
            Long userId = ((Number) profile.get("id")).longValue();

            List<Map<String, Object>> offices = queueFacade.getStaffOffices(userId);
            return ResponseEntity.ok(ApiResponse.success(offices));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUSINESS-001", e.getMessage()));
        }
    }

    private void ensureAdmin(String authHeader) {
        Map<String, Object> profile = authService.getCurrentUserProfile(authHeader);
        Object role = profile.get("role");
        if (role == null || !"ADMIN".equalsIgnoreCase(String.valueOf(role))) {
            throw new RuntimeException("Admin access required");
        }
    }

    private static String resolveAction(String action, Map<String, Object> body) {
        if (action != null && !action.isBlank()) {
            return action.trim();
        }
        if (body != null && body.get("action") != null) {
            return String.valueOf(body.get("action")).trim();
        }
        return null;
    }
}
