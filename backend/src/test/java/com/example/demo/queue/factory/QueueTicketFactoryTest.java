package com.example.demo.queue.factory;

import com.example.demo.queue.model.QueueTicket;
import com.example.demo.queue.repository.QueueTicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for QueueTicketFactory (Factory Pattern).
 * Verifies correct ticket creation, numbering, and position calculation.
 */
@ExtendWith(MockitoExtension.class)
class QueueTicketFactoryTest {

    @Mock
    private QueueTicketRepository queueTicketRepository;

    @InjectMocks
    private QueueTicketFactory ticketFactory;

    @Test
    void createTicket_shouldReturnTicketWithWaitingStatus() {
        when(queueTicketRepository.findFirstByOfficeIdAndStatusOrderByPositionDesc(1L, QueueTicket.TicketStatus.WAITING))
                .thenReturn(Optional.empty());

        QueueTicket ticket = ticketFactory.createTicket(100L, 1L);

        assertEquals(QueueTicket.TicketStatus.WAITING, ticket.getStatus());
        assertEquals(100L, ticket.getUserId());
        assertEquals(1L, ticket.getOfficeId());
    }

    @Test
    void createTicket_shouldCalculatePositionCorrectly() {
        when(queueTicketRepository.findFirstByOfficeIdAndStatusOrderByPositionDesc(1L, QueueTicket.TicketStatus.WAITING))
                .thenReturn(Optional.of(QueueTicket.builder().position(5).build()));

        QueueTicket ticket = ticketFactory.createTicket(100L, 1L);

        assertEquals(6, ticket.getPosition());
    }

    @Test
    void createTicket_shouldGenerateTicketNumber() {
        when(queueTicketRepository.findFirstByOfficeIdAndStatusOrderByPositionDesc(1L, QueueTicket.TicketStatus.WAITING))
                .thenReturn(Optional.empty());

        QueueTicket ticket = ticketFactory.createTicket(100L, 1L);

        assertNotNull(ticket.getTicketNumber());
        assertTrue(ticket.getTicketNumber().startsWith("QQ-1-"));
    }

    @Test
    void createTicket_shouldSetCreatedAt() {
        when(queueTicketRepository.findFirstByOfficeIdAndStatusOrderByPositionDesc(1L, QueueTicket.TicketStatus.WAITING))
                .thenReturn(Optional.empty());

        QueueTicket ticket = ticketFactory.createTicket(100L, 1L);

        assertNotNull(ticket.getCreatedAt());
    }

    @Test
    void createPriorityTicket_shouldSetPositionToZero() {
        QueueTicket ticket = ticketFactory.createPriorityTicket(100L, 1L);

        assertEquals(0, ticket.getPosition());
        assertTrue(ticket.getTicketNumber().startsWith("P-QQ-"));
    }

    @Test
    void createPriorityTicket_shouldHavePriorityPrefix() {
        QueueTicket ticket = ticketFactory.createPriorityTicket(100L, 1L);

        assertTrue(ticket.getTicketNumber().startsWith("P-"));
    }

    @Test
    void createTicket_withEmptyQueue_shouldSetPositionToOne() {
        when(queueTicketRepository.findFirstByOfficeIdAndStatusOrderByPositionDesc(1L, QueueTicket.TicketStatus.WAITING))
                .thenReturn(Optional.empty());

        QueueTicket ticket = ticketFactory.createTicket(100L, 1L);

        assertEquals(1, ticket.getPosition());
    }
}
