package com.example.demo.queue.facade;

import com.example.demo.auth.model.User;
import com.example.demo.auth.repository.UserRepository;
import com.example.demo.office.dto.OfficeRegistrationRequest;
import com.example.demo.office.model.OfficeStaff;
import com.example.demo.office.model.ServiceOffice;
import com.example.demo.office.repository.OfficeStaffRepository;
import com.example.demo.office.repository.ServiceOfficeRepository;
import com.example.demo.queue.factory.QueueTicketFactory;
import com.example.demo.queue.model.QueueTicket;
import com.example.demo.queue.observer.QueueEvent;
import com.example.demo.queue.observer.QueueEventPublisher;
import com.example.demo.queue.service.QueueService;
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
 *   - OfficeStaffRepository (staff management)
 *   - UserRepository (user lookups for staff by email)
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
    private final OfficeStaffRepository officeStaffRepository;
    private final UserRepository userRepository;

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

        Map<String, Object> status = buildTicketResponse(ticket, office);

        if (ticket.getStatus() == QueueTicket.TicketStatus.SERVING) {
            // Currently being served — position 1, nobody ahead
            status.put("position", 1);
            status.put("peopleAhead", 0);
            status.put("estimatedWaitMinutes", 0);
        } else if (ticket.getStatus() == QueueTicket.TicketStatus.WAITING) {
            // Dynamically count how many are actually ahead
            List<QueueTicket> waitingQueue = queueService.getWaitingTickets(ticket.getOfficeId());
            int peopleAhead = 0;
            for (QueueTicket t : waitingQueue) {
                if (t.getPosition() < ticket.getPosition()) {
                    peopleAhead++;
                }
            }
            status.put("position", peopleAhead + 1);
            status.put("peopleAhead", peopleAhead);
            status.put("estimatedWaitMinutes", peopleAhead * 5);
        } else {
            // COMPLETED or CANCELLED
            status.put("peopleAhead", 0);
            status.put("estimatedWaitMinutes", 0);
        }

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
     * Complete a queue ticket: mark as COMPLETED, publish event, then auto-advance
     * to serve the next customer in line.
     * Customer-initiated when their status is SERVING.
     */
    public Map<String, Object> completeTicket(Long ticketId) {
        QueueTicket ticket = queueService.findTicketById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (ticket.getStatus() != QueueTicket.TicketStatus.SERVING) {
            throw new RuntimeException("Only SERVING tickets can be completed");
        }

        ServiceOffice office = officeRepository.findById(ticket.getOfficeId())
                .orElseThrow(() -> new RuntimeException("Office not found"));

        // 1. Mark this ticket as COMPLETED
        ticket = queueService.updateTicketStatus(ticket, QueueTicket.TicketStatus.COMPLETED);

        eventPublisher.publish(new QueueEvent(
                QueueEvent.EventType.TICKET_COMPLETED,
                ticket.getId(),
                ticket.getUserId(),
                ticket.getOfficeId(),
                "Ticket " + ticket.getTicketNumber() + " completed at " + office.getName()
        ));

        Map<String, Object> response = new HashMap<>();
        response.put("ticketId", ticket.getId());
        response.put("ticketNumber", ticket.getTicketNumber());
        response.put("status", ticket.getStatus().name());

        // 2. Auto-advance: serve the next waiting customer
        try {
            Map<String, Object> nextServing = advanceQueue(ticket.getOfficeId());
            response.put("nextTicket", nextServing);
        } catch (RuntimeException e) {
            // No more waiting tickets — that's fine
            response.put("nextTicket", null);
        }

        return response;
    }

    /**
     * Get the current waiting-queue count for every active office.
     * Returns a map of officeId → waitingCount.
     */
    public Map<Long, Integer> getQueueCounts() {
        List<ServiceOffice> activeOffices = officeRepository.findByIsActiveTrueAndApprovalStatus(ServiceOffice.ApprovalStatus.APPROVED);
        Map<Long, Integer> counts = new HashMap<>();
        for (ServiceOffice office : activeOffices) {
            counts.put(office.getId(), queueService.getWaitingCount(office.getId()));
        }
        return counts;
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
        String category = request.getCategory() == null ? "" : request.getCategory().trim();
        String phoneNumber = request.getPhoneNumber() == null ? "" : request.getPhoneNumber().trim();

        if (name.isBlank()) {
            throw new RuntimeException("Business/office name is required");
        }
        if (address.isBlank()) {
            throw new RuntimeException("Business address is required");
        }
        if (type.isBlank()) {
            throw new RuntimeException("Business type is required");
        }
        if (category.isBlank()) {
            throw new RuntimeException("Business category is required");
        }
        if (phoneNumber.isBlank()) {
            throw new RuntimeException("Phone number is required");
        }

        if (officeRepository.existsByNameIgnoreCaseAndAddressIgnoreCase(name, address)) {
            throw new RuntimeException("This business office is already registered");
        }

        ServiceOffice office = ServiceOffice.builder()
                .name(name)
                .address(address)
                .type(type)
                .category(category)
                .phoneNumber(phoneNumber)
                .website(request.getWebsite() != null ? request.getWebsite().trim() : null)
                .businessHours(request.getBusinessHours() != null ? request.getBusinessHours().trim() : null)
                .photos(request.getPhotos() != null ? request.getPhotos().trim() : null)
                .businessPermit(request.getBusinessPermit() != null ? request.getBusinessPermit().trim() : null)
                .dtiSecRegistration(request.getDtiSecRegistration() != null ? request.getDtiSecRegistration().trim() : null)
                .utilityBill(request.getUtilityBill() != null ? request.getUtilityBill().trim() : null)
                .leaseAgreement(request.getLeaseAgreement() != null ? request.getLeaseAgreement().trim() : null)
                .taxDocument(request.getTaxDocument() != null ? request.getTaxDocument().trim() : null)
                .additionalNotes(request.getAdditionalNotes() != null ? request.getAdditionalNotes().trim() : null)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .ownerUserId(ownerUserId)
                .isActive(false)
                .approvalStatus(ServiceOffice.ApprovalStatus.PENDING)
                .build();

        ServiceOffice savedOffice = officeRepository.save(office);
        return buildOfficeResponse(savedOffice);
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

    /**
     * Get all office registrations owned by a specific user.
     */
    public List<Map<String, Object>> getMyRegistrations(Long ownerUserId) {
        return officeRepository.findByOwnerUserIdOrderByCreatedAtDesc(ownerUserId)
                .stream()
                .map(this::buildOfficeResponse)
                .toList();
    }

    /**
     * Toggle office active/inactive (open/close for business).
     * Allowed for the owner OR any staff member of the office.
     */
    public Map<String, Object> toggleOfficeActive(Long officeId, Long userId) {
        ServiceOffice office = officeRepository.findById(officeId)
                .orElseThrow(() -> new RuntimeException("Office not found"));

        if (!isOwnerOrStaff(office, userId)) {
            throw new RuntimeException("You do not have permission to manage this office");
        }

        if (office.getApprovalStatus() != ServiceOffice.ApprovalStatus.APPROVED) {
            throw new RuntimeException("Only approved offices can be opened/closed");
        }

        office.setActive(!office.isActive());
        ServiceOffice saved = officeRepository.save(office);

        eventPublisher.publish(new QueueEvent(
                QueueEvent.EventType.TICKET_CREATED,
                null,
                userId,
                officeId,
                "Office " + saved.getName() + " is now " + (saved.isActive() ? "OPEN" : "CLOSED")
        ));

        return buildOfficeResponse(saved);
    }

    // ── Staff Management ─────────────────────────────────────────────

    /**
     * Add a staff member to an office by email.
     * Only the office owner can add staff.
     */
    public Map<String, Object> addStaff(Long officeId, Long ownerUserId, String staffEmail) {
        ServiceOffice office = officeRepository.findById(officeId)
                .orElseThrow(() -> new RuntimeException("Office not found"));

        if (!office.getOwnerUserId().equals(ownerUserId)) {
            throw new RuntimeException("Only the owner can add staff");
        }

        User staffUser = userRepository.findByEmail(staffEmail.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("No user found with email: " + staffEmail));

        if (staffUser.getId().equals(ownerUserId)) {
            throw new RuntimeException("You are already the owner of this office");
        }

        if (officeStaffRepository.existsByOfficeIdAndUserId(officeId, staffUser.getId())) {
            throw new RuntimeException("This user is already a staff member");
        }

        OfficeStaff staff = OfficeStaff.builder()
                .officeId(officeId)
                .userId(staffUser.getId())
                .userName(staffUser.getName())
                .userEmail(staffUser.getEmail())
                .role(OfficeStaff.StaffRole.STAFF)
                .build();

        OfficeStaff saved = officeStaffRepository.save(staff);
        return buildStaffResponse(saved);
    }

    /**
     * Remove a staff member from an office.
     * Only the office owner can remove staff.
     */
    public void removeStaff(Long officeId, Long ownerUserId, Long staffRecordId) {
        ServiceOffice office = officeRepository.findById(officeId)
                .orElseThrow(() -> new RuntimeException("Office not found"));

        if (!office.getOwnerUserId().equals(ownerUserId)) {
            throw new RuntimeException("Only the owner can remove staff");
        }

        OfficeStaff staff = officeStaffRepository.findById(staffRecordId)
                .orElseThrow(() -> new RuntimeException("Staff record not found"));

        if (!staff.getOfficeId().equals(officeId)) {
            throw new RuntimeException("Staff record does not belong to this office");
        }

        officeStaffRepository.delete(staff);
    }

    /**
     * Get all staff members for an office.
     */
    public List<Map<String, Object>> getOfficeStaff(Long officeId) {
        return officeStaffRepository.findByOfficeIdOrderByAddedAtAsc(officeId)
                .stream()
                .map(this::buildStaffResponse)
                .toList();
    }

    /**
     * Get all offices where a user is staff (not owner).
     */
    public List<Map<String, Object>> getStaffOffices(Long userId) {
        return officeStaffRepository.findByUserIdOrderByAddedAtDesc(userId)
                .stream()
                .map(staffRecord -> {
                    ServiceOffice office = officeRepository.findById(staffRecord.getOfficeId()).orElse(null);
                    if (office == null) return null;
                    Map<String, Object> resp = buildOfficeResponse(office);
                    resp.put("staffRole", staffRecord.getRole().name());
                    return resp;
                })
                .filter(r -> r != null)
                .toList();
    }

    /**
     * Check if a user is the owner or a staff member of the given office.
     */
    public boolean isOwnerOrStaff(ServiceOffice office, Long userId) {
        if (office.getOwnerUserId().equals(userId)) return true;
        return officeStaffRepository.existsByOfficeIdAndUserId(office.getId(), userId);
    }

    // ── Private Helpers ──────────────────────────────────────────────

    private Map<String, Object> buildOfficeResponse(ServiceOffice office) {
        Map<String, Object> response = new HashMap<>();
        response.put("officeId", office.getId());
        response.put("name", office.getName());
        response.put("address", office.getAddress());
        response.put("type", office.getType());
        response.put("category", office.getCategory());
        response.put("phoneNumber", office.getPhoneNumber());
        response.put("website", office.getWebsite());
        response.put("businessHours", office.getBusinessHours());
        response.put("photos", office.getPhotos());
        response.put("businessPermit", office.getBusinessPermit());
        response.put("dtiSecRegistration", office.getDtiSecRegistration());
        response.put("utilityBill", office.getUtilityBill());
        response.put("leaseAgreement", office.getLeaseAgreement());
        response.put("taxDocument", office.getTaxDocument());
        response.put("additionalNotes", office.getAdditionalNotes());
        response.put("ownerUserId", office.getOwnerUserId());
        response.put("latitude", office.getLatitude());
        response.put("longitude", office.getLongitude());
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

    private Map<String, Object> buildStaffResponse(OfficeStaff staff) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", staff.getId());
        response.put("officeId", staff.getOfficeId());
        response.put("userId", staff.getUserId());
        response.put("userName", staff.getUserName());
        response.put("userEmail", staff.getUserEmail());
        response.put("role", staff.getRole().name());
        response.put("addedAt", staff.getAddedAt().toString());
        return response;
    }
}
