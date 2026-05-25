package com.example.demo.queue.controller;

import com.example.demo.queue.facade.QueueFacade;
import com.example.demo.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for queue ticket operations.
 * Uses the QueueFacade (Facade Pattern) for all business logic
 * and ApiResponse (Builder Pattern) for standardized responses.
 *
 * Endpoints match the SDD §5.2:
 *   POST  /api/queues/join              — Join a queue
 *   GET   /api/queues/my-tickets        — List tickets for a user
 *   GET   /api/queues/status/{id}       — Get queue status
 *   PATCH /api/queues/tickets/{id}      — Update ticket (cancel)
 *   POST  /api/queues/advance/{officeId}— Staff: advance queue
 *   POST  /api/queues/complete/{id}     — Staff: complete ticket
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

    @GetMapping("/queues/my-tickets")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyTickets(
            @RequestParam Long userId) {
        try {
            List<Map<String, Object>> tickets = queueFacade.getUserTickets(userId);
            return ResponseEntity.ok(ApiResponse.success(tickets));
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
}
