package com.example.demo.queue.factory;

import com.example.demo.queue.model.QueueTicket;
import com.example.demo.queue.repository.QueueTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Factory Pattern (Creational)
 *
 * Centralizes the creation of QueueTicket objects. Instead of scattering
 * ticket-building logic across services, this factory ensures consistent
 * ticket number generation, default status assignment, and position calculation.
 */
@Component
@RequiredArgsConstructor
public class QueueTicketFactory {

    private final QueueTicketRepository queueTicketRepository;

    /**
     * Creates a standard queue ticket with an auto-generated ticket number
     * and calculated position based on how many people are already waiting.
     */
    public QueueTicket createTicket(Long userId, Long officeId) {
        // Go after the last waiting ticket; counting waiting tickets would reuse a
        // position whenever someone ahead cancelled.
        int position = queueTicketRepository.findFirstByOfficeIdAndStatusOrderByPositionDesc(
                        officeId, QueueTicket.TicketStatus.WAITING)
                .map(last -> last.getPosition() + 1)
                .orElse(1);

        // Use total tickets created TODAY (all statuses) for unique sequence number
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        int totalToday = queueTicketRepository.countByOfficeIdAndCreatedAtAfter(officeId, startOfDay);
        String ticketNumber = generateTicketNumber(officeId, totalToday + 1);

        return QueueTicket.builder()
                .ticketNumber(ticketNumber)
                .userId(userId)
                .officeId(officeId)
                .status(QueueTicket.TicketStatus.WAITING)
                .position(position)
                .createdAt(LocalDateTime.now())
                .build();
    }

    /**
     * Creates a priority ticket positioned at the front of the queue.
     * Useful for priority customers or accessibility accommodations.
     */
    public QueueTicket createPriorityTicket(Long userId, Long officeId) {
        String ticketNumber = generateTicketNumber(officeId, 0);

        return QueueTicket.builder()
                .ticketNumber("P-" + ticketNumber)
                .userId(userId)
                .officeId(officeId)
                .status(QueueTicket.TicketStatus.WAITING)
                .position(0) // Priority: front of queue
                .createdAt(LocalDateTime.now())
                .build();
    }

    /**
     * Generates a unique ticket number like "QQ-3-20260406-005"
     * Format: QQ-{officeId}-{date}-{sequence}
     */
    private String generateTicketNumber(Long officeId, int sequence) {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return String.format("QQ-%d-%s-%03d", officeId, datePart, sequence);
    }
}
