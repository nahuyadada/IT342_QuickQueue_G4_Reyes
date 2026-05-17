package com.example.demo.queue.controller;

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

/**
 * REST controller for queue operations.
 * Uses the QueueFacade (Facade Pattern) for all business logic
 * and ApiResponse (Builder Pattern) for standardized responses.
 *
 * Endpoints match the SDD §5.2:
 *   POST /api/queues/join — Join a queue
 *   GET  /api/queues/status/{id} — Get queue status
 *   PATCH /api/queues/tickets/{id} — Update ticket (cancel)
 *   POST /api/queues/advance/{officeId} — Staff: advance queue
 *   GET  /api/offices — List active offices
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class QueueController {

    private final QueueFacade queueFacade;
    private final AuthService authService;

    @PostMapping("/queues/join")
    public ResponseEntity<ApiResponse<Map<String, Object>>> joinQueue(
            @RequestParam Long userId,
            @RequestParam Long officeId) {
        try {
            Map<String, Object> result = queueFacade.joinQueue(userId, officeId);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUSINESS-001", e.getMessage()));
        }
    }

    @GetMapping("/queues/status/{ticketId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getQueueStatus(
            @PathVariable Long ticketId) {
        try {
            Map<String, Object> status = queueFacade.getQueueStatus(ticketId);
            return ResponseEntity.ok(ApiResponse.success(status));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("DB-001", e.getMessage()));
        }
    }

    @PatchMapping("/queues/tickets/{ticketId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancelTicket(
            @PathVariable Long ticketId) {
        try {
            Map<String, Object> result = queueFacade.cancelTicket(ticketId);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUSINESS-001", e.getMessage()));
        }
    }

    @PostMapping("/queues/advance/{officeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> advanceQueue(
            @PathVariable Long officeId) {
        try {
            Map<String, Object> result = queueFacade.advanceQueue(officeId);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUSINESS-001", e.getMessage()));
        }
    }

    @PostMapping("/queues/complete/{ticketId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> completeTicket(
            @PathVariable Long ticketId) {
        try {
            Map<String, Object> result = queueFacade.completeTicket(ticketId);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUSINESS-001", e.getMessage()));
        }
    }

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
            Number ownerUserIdValue = (Number) profile.get("id");
            Long ownerUserId = ownerUserIdValue.longValue();

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
            Number ownerUserIdValue = (Number) profile.get("id");
            Long ownerUserId = ownerUserIdValue.longValue();

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
            @PathVariable Long officeId) {
        try {
            Map<String, Object> profile = authService.getCurrentUserProfile(authHeader);
            Number ownerUserIdValue = (Number) profile.get("id");
            Long ownerUserId = ownerUserIdValue.longValue();

            Map<String, Object> office = queueFacade.toggleOfficeActive(officeId, ownerUserId);
            return ResponseEntity.ok(ApiResponse.success(office));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUSINESS-001", e.getMessage()));
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

    private void ensureAdmin(String authHeader) {
        Map<String, Object> profile = authService.getCurrentUserProfile(authHeader);
        Object role = profile.get("role");
        if (role == null || !"ADMIN".equalsIgnoreCase(String.valueOf(role))) {
            throw new RuntimeException("Admin access required");
        }
    }

    // ── Staff Management ─────────────────────────────────────────

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
}
