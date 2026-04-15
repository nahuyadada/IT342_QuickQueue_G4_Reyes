package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.facade.QueueFacade;
import com.example.demo.model.ServiceOffice;
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

    @GetMapping("/offices")
    public ResponseEntity<ApiResponse<List<ServiceOffice>>> getOffices() {
        List<ServiceOffice> offices = queueFacade.getActiveOffices();
        return ResponseEntity.ok(ApiResponse.success(offices));
    }
}
