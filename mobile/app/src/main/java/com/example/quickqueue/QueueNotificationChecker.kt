package com.example.quickqueue

import android.content.Context
import com.example.quickqueue.network.ApiClient
import com.example.quickqueue.network.NotificationStore
import com.example.quickqueue.network.QueueRepository
import com.example.quickqueue.network.StoredNotification
import com.example.quickqueue.network.TicketSnapshot
import com.example.quickqueue.network.UserSession

/**
 * Polls the user's active tickets and fires local notifications when ticket
 * status changes (approaching, now-serving, completed).
 *
 * Called by QueuePollingWorker (background) and DashboardActivity (foreground).
 */
object QueueNotificationChecker {

    suspend fun check(ctx: Context) {
        val prefs = ctx.getSharedPreferences("quickqueue_prefs", Context.MODE_PRIVATE)
        ApiClient.token = prefs.getString("token", null) ?: return

        val userId = UserSession.resolveUserId(ctx) ?: return
        val tickets = QueueRepository.getMyTickets(userId).getOrNull() ?: return

        val previousSnapshots = NotificationStore.getSnapshots(ctx)

        val now = System.currentTimeMillis()
        var nextId = now // unique notification store id per check cycle

        for (ticket in tickets) {
            val currStatus = ticket.status.uppercase()
            val currAhead = ticket.peopleAhead ?: 0
            val prev = previousSnapshots[ticket.ticketId]
            val prevStatus = prev?.status
            val prevAhead = prev?.peopleAhead ?: Int.MAX_VALUE
            val officeName = ticket.officeName ?: "your queue"
            val ticketNum = ticket.ticketNumber

            when {
                // WAITING → SERVING: you're next
                prevStatus == "WAITING" && currStatus == "SERVING" -> {
                    val title = "You're next!"
                    val body = "Ticket $ticketNum at $officeName — please proceed to your counter now."
                    NotificationHelper.post(ctx, (ticket.ticketId % Int.MAX_VALUE).toInt(), title, body)
                    NotificationStore.save(ctx, StoredNotification(
                        id = nextId++, type = "green", icon = "▶",
                        title = title, subtitle = body,
                        timeMillis = now, isRead = false
                    ))
                }

                // Still WAITING but people ahead dropped to ≤3 (and wasn't already ≤3)
                prevStatus == "WAITING" && currStatus == "WAITING"
                        && prevAhead > 3 && currAhead in 1..3 -> {
                    val people = if (currAhead == 1) "1 person" else "$currAhead people"
                    val title = "Almost your turn!"
                    val body = "Only $people ahead of you at $officeName."
                    NotificationHelper.post(ctx, (ticket.ticketId % Int.MAX_VALUE + 10_000).toInt(), title, body)
                    NotificationStore.save(ctx, StoredNotification(
                        id = nextId++, type = "yellow", icon = "⏳",
                        title = title, subtitle = body,
                        timeMillis = now, isRead = false
                    ))
                }

                // SERVING/WAITING → COMPLETED
                (prevStatus == "SERVING" || prevStatus == "WAITING")
                        && currStatus == "COMPLETED" -> {
                    val title = "Service completed!"
                    val body = "Your visit to $officeName is complete. Thank you for using QuickQueue!"
                    NotificationHelper.post(ctx, (ticket.ticketId % Int.MAX_VALUE + 20_000).toInt(), title, body)
                    NotificationStore.save(ctx, StoredNotification(
                        id = nextId++, type = "green", icon = "✅",
                        title = title, subtitle = body,
                        timeMillis = now, isRead = false
                    ))
                }
            }
        }

        // Persist current snapshot so next poll can diff against it
        val updatedSnapshots = tickets.associate { t ->
            t.ticketId to TicketSnapshot(t.status.uppercase(), t.peopleAhead ?: 0)
        }
        // Merge: keep old snapshots so we can detect completed tickets that may
        // disappear from the response on subsequent polls
        val merged = previousSnapshots.toMutableMap().also { it.putAll(updatedSnapshots) }
        NotificationStore.saveSnapshots(ctx, merged)
    }
}
