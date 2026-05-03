package com.example.demo.queue.service;

import com.example.demo.queue.model.QueueTicket;
import com.example.demo.queue.repository.QueueTicketRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for QueueService.
 * Verifies core queue operations (CRUD, status changes, position lookups).
 */
@ExtendWith(MockitoExtension.class)
class QueueServiceTest {

    @Mock
    private QueueTicketRepository queueTicketRepository;

    @InjectMocks
    private QueueService queueService;

    private QueueTicket buildTicket(Long id, Long userId, Long officeId, QueueTicket.TicketStatus status, int position) {
        return QueueTicket.builder()
                .id(id)
                .ticketNumber("QQ-" + officeId + "-20260503-" + String.format("%03d", position))
                .userId(userId)
                .officeId(officeId)
                .status(status)
                .position(position)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void saveTicket_shouldReturnSavedTicket() {
        QueueTicket ticket = buildTicket(null, 100L, 1L, QueueTicket.TicketStatus.WAITING, 1);
        QueueTicket saved = buildTicket(1L, 100L, 1L, QueueTicket.TicketStatus.WAITING, 1);

        when(queueTicketRepository.save(ticket)).thenReturn(saved);

        QueueTicket result = queueService.saveTicket(ticket);

        assertEquals(1L, result.getId());
        verify(queueTicketRepository).save(ticket);
    }

    @Test
    void findTicketById_shouldReturnTicketIfExists() {
        QueueTicket ticket = buildTicket(1L, 100L, 1L, QueueTicket.TicketStatus.WAITING, 1);
        when(queueTicketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        Optional<QueueTicket> result = queueService.findTicketById(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    void findTicketById_shouldReturnEmptyIfNotExists() {
        when(queueTicketRepository.findById(999L)).thenReturn(Optional.empty());

        Optional<QueueTicket> result = queueService.findTicketById(999L);

        assertFalse(result.isPresent());
    }

    @Test
    void getWaitingTickets_shouldReturnOrderedList() {
        QueueTicket t1 = buildTicket(1L, 100L, 1L, QueueTicket.TicketStatus.WAITING, 1);
        QueueTicket t2 = buildTicket(2L, 101L, 1L, QueueTicket.TicketStatus.WAITING, 2);

        when(queueTicketRepository.findByOfficeIdAndStatusOrderByPositionAsc(1L, QueueTicket.TicketStatus.WAITING))
                .thenReturn(List.of(t1, t2));

        List<QueueTicket> result = queueService.getWaitingTickets(1L);

        assertEquals(2, result.size());
        assertEquals(1, result.get(0).getPosition());
        assertEquals(2, result.get(1).getPosition());
    }

    @Test
    void getNextWaitingTicket_shouldReturnFirstWaitingTicket() {
        QueueTicket ticket = buildTicket(1L, 100L, 1L, QueueTicket.TicketStatus.WAITING, 1);
        when(queueTicketRepository.findFirstByOfficeIdAndStatusOrderByPositionAsc(1L, QueueTicket.TicketStatus.WAITING))
                .thenReturn(Optional.of(ticket));

        Optional<QueueTicket> result = queueService.getNextWaitingTicket(1L);

        assertTrue(result.isPresent());
        assertEquals(1, result.get().getPosition());
    }

    @Test
    void getWaitingCount_shouldReturnCount() {
        when(queueTicketRepository.countByOfficeIdAndStatus(1L, QueueTicket.TicketStatus.WAITING))
                .thenReturn(5);

        int count = queueService.getWaitingCount(1L);

        assertEquals(5, count);
    }

    @Test
    void getActiveTicketForUser_shouldReturnWaitingTicket() {
        QueueTicket ticket = buildTicket(1L, 100L, 1L, QueueTicket.TicketStatus.WAITING, 1);
        when(queueTicketRepository.findByUserIdAndStatus(100L, QueueTicket.TicketStatus.WAITING))
                .thenReturn(Optional.of(ticket));

        Optional<QueueTicket> result = queueService.getActiveTicketForUser(100L);

        assertTrue(result.isPresent());
    }

    @Test
    void updateTicketStatus_shouldChangeStatusAndSave() {
        QueueTicket ticket = buildTicket(1L, 100L, 1L, QueueTicket.TicketStatus.WAITING, 1);
        QueueTicket updated = buildTicket(1L, 100L, 1L, QueueTicket.TicketStatus.SERVING, 1);

        when(queueTicketRepository.save(any(QueueTicket.class))).thenReturn(updated);

        QueueTicket result = queueService.updateTicketStatus(ticket, QueueTicket.TicketStatus.SERVING);

        assertEquals(QueueTicket.TicketStatus.SERVING, result.getStatus());
    }
}
