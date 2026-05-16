package com.example.demo.queue.repository;

import com.example.demo.queue.model.QueueTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QueueTicketRepository extends JpaRepository<QueueTicket, Long> {

    List<QueueTicket> findByOfficeIdAndStatusOrderByPositionAsc(Long officeId, QueueTicket.TicketStatus status);

    Optional<QueueTicket> findByUserIdAndStatus(Long userId, QueueTicket.TicketStatus status);

    int countByOfficeIdAndStatus(Long officeId, QueueTicket.TicketStatus status);

    /** Count ALL tickets for an office created after a given time (used for daily sequence). */
    int countByOfficeIdAndCreatedAtAfter(Long officeId, LocalDateTime after);

    Optional<QueueTicket> findFirstByOfficeIdAndStatusOrderByPositionAsc(Long officeId, QueueTicket.TicketStatus status);
}
