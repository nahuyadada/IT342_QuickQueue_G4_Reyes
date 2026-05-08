package com.example.demo.queue.model;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for QueueTicket entity model.
 * Verifies builder, defaults, and enum values.
 */
class QueueTicketModelTest {

    @Test
    void builder_shouldCreateTicketWithAllFields() {
        QueueTicket ticket = QueueTicket.builder()
                .id(1L)
                .ticketNumber("QQ-1-20260503-001")
                .userId(100L)
                .officeId(1L)
                .status(QueueTicket.TicketStatus.WAITING)
                .position(1)
                .createdAt(LocalDateTime.now())
                .build();

        assertEquals(1L, ticket.getId());
        assertEquals("QQ-1-20260503-001", ticket.getTicketNumber());
        assertEquals(100L, ticket.getUserId());
        assertEquals(1L, ticket.getOfficeId());
        assertEquals(QueueTicket.TicketStatus.WAITING, ticket.getStatus());
        assertEquals(1, ticket.getPosition());
        assertNotNull(ticket.getCreatedAt());
    }

    @Test
    void ticketStatus_shouldHaveFourValues() {
        QueueTicket.TicketStatus[] statuses = QueueTicket.TicketStatus.values();
        assertEquals(4, statuses.length);
    }

    @Test
    void ticketStatus_WAITING_exists() {
        assertEquals("WAITING", QueueTicket.TicketStatus.WAITING.name());
    }

    @Test
    void ticketStatus_SERVING_exists() {
        assertEquals("SERVING", QueueTicket.TicketStatus.SERVING.name());
    }

    @Test
    void ticketStatus_COMPLETED_exists() {
        assertEquals("COMPLETED", QueueTicket.TicketStatus.COMPLETED.name());
    }

    @Test
    void ticketStatus_CANCELLED_exists() {
        assertEquals("CANCELLED", QueueTicket.TicketStatus.CANCELLED.name());
    }

    @Test
    void defaultStatus_shouldBeWaiting() {
        QueueTicket ticket = new QueueTicket();
        assertEquals(QueueTicket.TicketStatus.WAITING, ticket.getStatus());
    }

    @Test
    void setStatus_shouldUpdateStatus() {
        QueueTicket ticket = QueueTicket.builder()
                .status(QueueTicket.TicketStatus.WAITING)
                .build();
        ticket.setStatus(QueueTicket.TicketStatus.SERVING);

        assertEquals(QueueTicket.TicketStatus.SERVING, ticket.getStatus());
    }
}
