package com.example.demo.facade;

import com.example.demo.dto.OfficeRegistrationRequest;
import com.example.demo.factory.QueueTicketFactory;
import com.example.demo.model.QueueTicket;
import com.example.demo.model.ServiceOffice;
import com.example.demo.observer.QueueEvent;
import com.example.demo.observer.QueueEventPublisher;
import com.example.demo.repository.ServiceOfficeRepository;
import com.example.demo.service.QueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Facade Pattern (Structural)
 *
 * Provides a simplified, unified interface for all queue operations.
 * Internally coordinates between multiple subsystems:
 *   - QueueTicketFactory (ticket creation)
 *   - QueueService (persistence & queries)
 *   - ServiceOfficeRepository (office validation)
 *   - QueueEventPublisher (notifications via Observer pattern)
 *
 * Controllers call the Facade instead of interacting with each subsystem directly.
 * This hides the complexity of multi-step queue operations behind simple method calls.
 */
@Component
@RequiredArgsConstructor
public class QueueFacade {

    private final QueueTicketFactory ticketFactory;
    private final QueueService queueService;
    private final ServiceOfficeRepository officeRepository;
    private final QueueEventPublisher eventPublisher;

    /**
     * Join a queue: validate office → create ticket → save → notify → return status.
     */
    public Map<String, Object> joinQueue(Long userId, Long officeId) {
        // 1. Validate office exists and is active
        ServiceOffice office = officeRepository.findById(officeId)
                .orElseThrow(() -> new RuntimeException("Service office not found"));

        if (!office.isActive()) {
            throw new RuntimeException("This service office is currently closed");
        }

        // 2. Check if user already has an active ticket
        queueService.getActiveTicketForUser(userId).ifPresent(existing -> {
            throw new RuntimeException("You already have an active queue ticket: " + existing.getTicketNumber());
        });

        // 3. Create ticket via Factory
        QueueTicket ticket = ticketFactory.createTicket(userId, officeId);

        // 4. Save ticket
        ticket = queueService.saveTicket(ticket);

        // 5. Publish event via Observer
        eventPublisher.publish(new QueueEvent(
                QueueEvent.EventType.TICKET_CREATED,
                ticket.getId(),
                userId,
                officeId,
                "Ticket " + ticket.getTicketNumber() + " created for " + office.getName()
        ));

        // 6. Build response
        return buildTicketResponse(ticket, office);
    }

    /**
     * Get queue status for a specific ticket.
     */
    public Map<String, Object> getQueueStatus(Long ticketId) {
        QueueTicket ticket = queueService.findTicketById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ServiceOffice office = officeRepository.findById(ticket.getOfficeId())
                .orElseThrow(() -> new RuntimeException("Office not found"));

        int peopleAhead = 0;
        if (ticket.getStatus() == QueueTicket.TicketStatus.WAITING) {
            List<QueueTicket> waitingQueue = queueService.getWaitingTickets(ticket.getOfficeId());
            for (QueueTicket t : waitingQueue) {
                if (t.getPosition() < ticket.getPosition()) {
                    peopleAhead++;
                }
            }
        }

        Map<String, Object> status = buildTicketResponse(ticket, office);
        status.put("peopleAhead", peopleAhead);
        status.put("estimatedWaitMinutes", peopleAhead * 5); // ~5 min per person
        return status;
    }

    /**
     * Cancel a queue ticket.
     */
    public Map<String, Object> cancelTicket(Long ticketId) {
        QueueTicket ticket = queueService.findTicketById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (ticket.getStatus() != QueueTicket.TicketStatus.WAITING) {
            throw new RuntimeException("Only WAITING tickets can be cancelled");
        }

        ticket = queueService.updateTicketStatus(ticket, QueueTicket.TicketStatus.CANCELLED);

        eventPublisher.publish(new QueueEvent(
                QueueEvent.EventType.TICKET_CANCELLED,
                ticket.getId(),
                ticket.getUserId(),
                ticket.getOfficeId(),
                "Ticket " + ticket.getTicketNumber() + " has been cancelled"
        ));

        Map<String, Object> response = new HashMap<>();
        response.put("ticketId", ticket.getId());
        response.put("ticketNumber", ticket.getTicketNumber());
        response.put("status", ticket.getStatus().name());
        return response;
    }

    /**
     * Advance the queue: mark the current ticket as SERVING, notify the next person.
     * Staff-only operation.
     */
    public Map<String, Object> advanceQueue(Long officeId) {
        ServiceOffice office = officeRepository.findById(officeId)
                .orElseThrow(() -> new RuntimeException("Service office not found"));

        QueueTicket nextTicket = queueService.getNextWaitingTicket(officeId)
                .orElseThrow(() -> new RuntimeException("No waiting tickets in this queue"));

        nextTicket = queueService.updateTicketStatus(nextTicket, QueueTicket.TicketStatus.SERVING);

        eventPublisher.publish(new QueueEvent(
                QueueEvent.EventType.NOW_SERVING,
                nextTicket.getId(),
                nextTicket.getUserId(),
                officeId,
                "Now serving ticket " + nextTicket.getTicketNumber() + " at " + office.getName()
        ));

        // Notify the person after the current one that their turn is approaching
        queueService.getNextWaitingTicket(officeId).ifPresent(upcoming -> {
            eventPublisher.publish(new QueueEvent(
                    QueueEvent.EventType.TURN_APPROACHING,
                    upcoming.getId(),
                    upcoming.getUserId(),
                    officeId,
                    "Your turn is approaching at " + office.getName() + "!"
            ));
        });

        Map<String, Object> response = buildTicketResponse(nextTicket, office);
        response.put("waitingCount", queueService.getWaitingCount(officeId));
        return response;
    }

    /**
     * List all active service offices.
     */
    public List<ServiceOffice> getActiveOffices() {
        return officeRepository.findByIsActiveTrueAndApprovalStatus(ServiceOffice.ApprovalStatus.APPROVED);
    }

    /**
     * Register a new business/service office for queue operations.
     */
    public Map<String, Object> registerOffice(Long ownerUserId, OfficeRegistrationRequest request) {
        String name = request.getName() == null ? "" : request.getName().trim();
        String address = request.getAddress() == null ? "" : request.getAddress().trim();
        String type = request.getType() == null ? "" : request.getType().trim().toUpperCase();

        if (name.isBlank()) {
            throw new RuntimeException("Business/office name is required");
        }
        if (address.isBlank()) {
            throw new RuntimeException("Business address is required");
        }
        if (type.isBlank()) {
            throw new RuntimeException("Business type is required");
        }

        if (officeRepository.existsByNameIgnoreCaseAndAddressIgnoreCase(name, address)) {
            throw new RuntimeException("This business office is already registered");
        }

        ServiceOffice office = ServiceOffice.builder()
                .name(name)
                .address(address)
                .type(type)
                .ownerUserId(ownerUserId)
            .isActive(false)
            .approvalStatus(ServiceOffice.ApprovalStatus.PENDING)
                .build();

        ServiceOffice savedOffice = officeRepository.save(office);

        Map<String, Object> response = new HashMap<>();
        response.put("officeId", savedOffice.getId());
        response.put("name", savedOffice.getName());
        response.put("address", savedOffice.getAddress());
        response.put("type", savedOffice.getType());
        response.put("ownerUserId", savedOffice.getOwnerUserId());
        response.put("approvalStatus", savedOffice.getApprovalStatus().name());
        response.put("isActive", savedOffice.isActive());
        response.put("createdAt", savedOffice.getCreatedAt().toString());
        return response;
    }

    public List<Map<String, Object>> getPendingOfficeRegistrations() {
        return officeRepository.findByApprovalStatusOrderByCreatedAtAsc(ServiceOffice.ApprovalStatus.PENDING)
                .stream()
                .map(this::buildOfficeResponse)
                .toList();
    }

    public Map<String, Object> approveOfficeRegistration(Long officeId) {
        ServiceOffice office = officeRepository.findById(officeId)
                .orElseThrow(() -> new RuntimeException("Office registration not found"));

        if (office.getApprovalStatus() != ServiceOffice.ApprovalStatus.PENDING) {
            throw new RuntimeException("Only pending registrations can be approved");
        }

        office.setApprovalStatus(ServiceOffice.ApprovalStatus.APPROVED);
        office.setActive(true);
        ServiceOffice savedOffice = officeRepository.save(office);
        return buildOfficeResponse(savedOffice);
    }

    public Map<String, Object> rejectOfficeRegistration(Long officeId) {
        ServiceOffice office = officeRepository.findById(officeId)
                .orElseThrow(() -> new RuntimeException("Office registration not found"));

        if (office.getApprovalStatus() != ServiceOffice.ApprovalStatus.PENDING) {
            throw new RuntimeException("Only pending registrations can be rejected");
        }

        office.setApprovalStatus(ServiceOffice.ApprovalStatus.REJECTED);
        office.setActive(false);
        ServiceOffice savedOffice = officeRepository.save(office);
        return buildOfficeResponse(savedOffice);
    }

    // ── Private Helpers ──────────────────────────────────────────────

    private Map<String, Object> buildOfficeResponse(ServiceOffice office) {
        Map<String, Object> response = new HashMap<>();
        response.put("officeId", office.getId());
        response.put("name", office.getName());
        response.put("address", office.getAddress());
        response.put("type", office.getType());
        response.put("ownerUserId", office.getOwnerUserId());
        response.put("approvalStatus", office.getApprovalStatus().name());
        response.put("isActive", office.isActive());
        response.put("createdAt", office.getCreatedAt().toString());
        return response;
    }

    private Map<String, Object> buildTicketResponse(QueueTicket ticket, ServiceOffice office) {
        Map<String, Object> response = new HashMap<>();
        response.put("ticketId", ticket.getId());
        response.put("ticketNumber", ticket.getTicketNumber());
        response.put("status", ticket.getStatus().name());
        response.put("position", ticket.getPosition());
        response.put("officeName", office.getName());
        response.put("officeType", office.getType());
        response.put("createdAt", ticket.getCreatedAt().toString());
        return response;
    }
}
