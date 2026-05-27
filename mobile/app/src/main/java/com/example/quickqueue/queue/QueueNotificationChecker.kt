package com.example.quickqueue.queue
import com.example.quickqueue.notifications.NotificationHelper

import android.content.Context
import com.example.quickqueue.core.ApiClient
import com.example.quickqueue.notifications.NotificationStore
import com.example.quickqueue.queue.QueueRepository
import com.example.quickqueue.notifications.StoredNotification
import com.example.quickqueue.notifications.TicketSnapshot
import com.example.quickqueue.core.UserSession

/**
 * Polls the user's active tickets and fires local notifications when ticket
 * status changes (approaching, now-serving, completed).
 *
 * Called by QueuePollingWorker (background) and DashboardActivity (foreground).
 *
 * Notification levels per ticket (fire once on transition INTO each level):
 *   - "Almost your turn"  : WAITING, peopleAhead drops into 1..2  (or first-seen there)
 *   - "You're next!"      : peopleAhead == 0 while still WAITING
 *   - "Now serving"       : status transitions to SERVING (from any prior state)
 *   - "Service complete"  : status transitions to COMPLETED
 */
object QueueNotificationChecker {

    private const val NEAR_THRESHOLD = 2

    suspend fun check(ctx: Context) {
        val prefs = ctx.getSharedPreferences("quickqueue_prefs", Context.MODE_PRIVATE)
        ApiClient.token = prefs.getString("token", null) ?: return

        val userId = UserSession.resolveUserId(ctx) ?: return
        val tickets = QueueRepository.getMyTickets(userId).getOrNull() ?: return

        val previousSnapshots = NotificationStore.getSnapshots(ctx)

        val now = System.currentTimeMillis()
        var nextId = now

        for (ticket in tickets) {
            val currStatus = ticket.status.uppercase()
            val currAhead = ticket.peopleAhead ?: 0
            val prev = previousSnapshots[ticket.ticketId]
            // Use MAX_VALUE when no prior snapshot so threshold checks fire on first sight
            val prevStatus = prev?.status
            val prevAhead = prev?.peopleAhead ?: Int.MAX_VALUE
            val officeName = ticket.officeName ?: "your queue"
            val ticketNum = ticket.ticketNumber

            when {
                // ── Entering SERVING ──────────────────────────────────────────────
                // Fires on transition from ANY previous state (including first-seen).
                currStatus == "SERVING" && prevStatus != "SERVING" -> {
                    val title = "You're being served now!"
                    val body = "Ticket $ticketNum at $officeName — please proceed to the counter."
                    NotificationHelper.post(ctx, notifId(ticket.ticketId, 0), title, body)
                    NotificationStore.save(ctx, StoredNotification(
                        id = nextId++, type = "green", icon = "▶",
                        title = title, subtitle = body, timeMillis = now, isRead = false
                    ))
                }

                // ── 0 people ahead, still WAITING (literally next up) ─────────────
                currStatus == "WAITING" && currAhead == 0 && prevAhead > 0 -> {
                    val title = "You're next in line!"
                    val body = "No one ahead of you at $officeName (Ticket $ticketNum). Get ready!"
                    NotificationHelper.post(ctx, notifId(ticket.ticketId, 1), title, body)
                    NotificationStore.save(ctx, StoredNotification(
                        id = nextId++, type = "green", icon = "🔔",
                        title = title, subtitle = body, timeMillis = now, isRead = false
                    ))
                }

                // ── Dropped into approaching range (1..NEAR_THRESHOLD) ────────────
                // Also fires on first-seen if already within range (prevAhead = MAX_VALUE > threshold).
                currStatus == "WAITING" && currAhead in 1..NEAR_THRESHOLD && prevAhead > NEAR_THRESHOLD -> {
                    val people = if (currAhead == 1) "1 person" else "$currAhead people"
                    val title = "Almost your turn!"
                    val body = "Only $people ahead of you at $officeName (Ticket $ticketNum)."
                    NotificationHelper.post(ctx, notifId(ticket.ticketId, 2), title, body)
                    NotificationStore.save(ctx, StoredNotification(
                        id = nextId++, type = "yellow", icon = "⏳",
                        title = title, subtitle = body, timeMillis = now, isRead = false
                    ))
                }

                // ── Service completed ─────────────────────────────────────────────
                currStatus == "COMPLETED"
                        && (prevStatus == "SERVING" || prevStatus == "WAITING") -> {
                    val title = "Service completed!"
                    val body = "Your visit to $officeName is complete. Thank you for using QuickQueue!"
                    NotificationHelper.post(ctx, notifId(ticket.ticketId, 3), title, body)
                    NotificationStore.save(ctx, StoredNotification(
                        id = nextId++, type = "green", icon = "✅",
                        title = title, subtitle = body, timeMillis = now, isRead = false
                    ))
                }
            }
        }

        // Persist current snapshot so next poll can diff against it
        val updatedSnapshots = tickets.associate { t ->
            t.ticketId to TicketSnapshot(t.status.uppercase(), t.peopleAhead ?: 0)
        }
        // Merge: keep old snapshots so completed tickets (may vanish from API) are still tracked
        val merged = previousSnapshots.toMutableMap().also { it.putAll(updatedSnapshots) }
        NotificationStore.saveSnapshots(ctx, merged)
    }

    /** Stable notification id per ticket + event type so they don't overwrite each other. */
    private fun notifId(ticketId: Long, eventType: Int): Int =
        ((ticketId % 100_000) * 10 + eventType).toInt()
}
