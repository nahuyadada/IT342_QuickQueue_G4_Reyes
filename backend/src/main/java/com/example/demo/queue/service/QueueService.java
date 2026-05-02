package com.example.demo.queue.service;

import com.example.demo.queue.model.QueueTicket;
import com.example.demo.queue.repository.QueueTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Core queue logic service. Handles low-level queue operations
 * (CRUD, status changes, position lookups). Used by the QueueFacade
 * but not called directly by controllers.
 */
@Service
@RequiredArgsConstructor
public class QueueService {

    private final QueueTicketRepository queueTicketRepository;

    public QueueTicket saveTicket(QueueTicket ticket) {
        return queueTicketRepository.save(ticket);
    }

    public Optional<QueueTicket> findTicketById(Long ticketId) {
        return queueTicketRepository.findById(ticketId);
    }

    public List<QueueTicket> getWaitingTickets(Long officeId) {
        return queueTicketRepository.findByOfficeIdAndStatusOrderByPositionAsc(
                officeId, QueueTicket.TicketStatus.WAITING);
    }

    public Optional<QueueTicket> getNextWaitingTicket(Long officeId) {
        return queueTicketRepository.findFirstByOfficeIdAndStatusOrderByPositionAsc(
                officeId, QueueTicket.TicketStatus.WAITING);
    }

    public int getWaitingCount(Long officeId) {
        return queueTicketRepository.countByOfficeIdAndStatus(
                officeId, QueueTicket.TicketStatus.WAITING);
    }

    public Optional<QueueTicket> getActiveTicketForUser(Long userId) {
        return queueTicketRepository.findByUserIdAndStatus(
                userId, QueueTicket.TicketStatus.WAITING);
    }

    public QueueTicket updateTicketStatus(QueueTicket ticket, QueueTicket.TicketStatus newStatus) {
        ticket.setStatus(newStatus);
        return queueTicketRepository.save(ticket);
    }
}
