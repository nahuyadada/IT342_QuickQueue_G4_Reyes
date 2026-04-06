package com.example.demo.repository;

import com.example.demo.model.QueueTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QueueTicketRepository extends JpaRepository<QueueTicket, Long> {

    List<QueueTicket> findByOfficeIdAndStatusOrderByPositionAsc(Long officeId, QueueTicket.TicketStatus status);

    Optional<QueueTicket> findByUserIdAndStatus(Long userId, QueueTicket.TicketStatus status);

    int countByOfficeIdAndStatus(Long officeId, QueueTicket.TicketStatus status);

    Optional<QueueTicket> findFirstByOfficeIdAndStatusOrderByPositionAsc(Long officeId, QueueTicket.TicketStatus status);
}
