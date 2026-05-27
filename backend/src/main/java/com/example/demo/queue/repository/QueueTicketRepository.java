package com.example.demo.queue.repository;

import com.example.demo.queue.model.QueueTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QueueTicketRepository extends JpaRepository<QueueTicket, Long> {

    List<QueueTicket> findByOfficeIdAndStatusOrderByPositionAsc(Long officeId, QueueTicket.TicketStatus status);

    Optional<QueueTicket> findByUserIdAndStatus(Long userId, QueueTicket.TicketStatus status);

    /** All tickets ever created by a user, newest first (used by the mobile "My Tickets" screen). */
    List<QueueTicket> findByUserIdOrderByCreatedAtDesc(Long userId);

    int countByOfficeIdAndStatus(Long officeId, QueueTicket.TicketStatus status);

    /** Count ALL tickets for an office created after a given time (used for daily sequence). */
    int countByOfficeIdAndCreatedAtAfter(Long officeId, LocalDateTime after);

    /** Count tickets with a given status created after a given time (used for Served Today). */
    int countByOfficeIdAndStatusInAndCreatedAtAfter(Long officeId, List<QueueTicket.TicketStatus> statuses, LocalDateTime after);

    /** Fetch completed tickets created after a given time (used for avg wait calc). */
    List<QueueTicket> findByOfficeIdAndStatusAndCreatedAtAfter(Long officeId, QueueTicket.TicketStatus status, LocalDateTime after);

    Optional<QueueTicket> findFirstByOfficeIdAndStatusOrderByPositionAsc(Long officeId, QueueTicket.TicketStatus status);

    @Modifying
    @Transactional
    void deleteByOfficeId(Long officeId);
}
