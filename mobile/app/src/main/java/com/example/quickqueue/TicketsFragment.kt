package com.example.quickqueue

import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.quickqueue.network.QueueRepository
import com.example.quickqueue.network.TicketDto
import com.example.quickqueue.network.UserSession
import com.google.android.material.card.MaterialCardView
import kotlinx.coroutines.launch

class TicketsFragment : Fragment() {

    private lateinit var ticketList: LinearLayout
    private lateinit var emptyState: LinearLayout
    private lateinit var activeCountBanner: LinearLayout
    private lateinit var textActiveCount: TextView

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_tickets, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        ticketList = view.findViewById(R.id.ticketList)
        emptyState = view.findViewById(R.id.emptyState)
        activeCountBanner = view.findViewById(R.id.activeCountBanner)
        textActiveCount = view.findViewById(R.id.textActiveCount)
        loadTickets()
    }

    private fun loadTickets() {
        showLoading()
        viewLifecycleOwner.lifecycleScope.launch {
            val userId = UserSession.resolveUserId(requireContext())
            if (!isAdded) return@launch
            if (userId == null) {
                showEmpty("Session expired. Please log in again.")
                return@launch
            }

            QueueRepository.getMyTickets(userId)
                .onSuccess { tickets ->
                    // Only WAITING / SERVING tickets are "active" queues.
                    val active = tickets.filter {
                        it.status.equals("WAITING", true) || it.status.equals("SERVING", true)
                    }
                    renderTickets(active)
                }
                .onFailure { error ->
                    showEmpty(error.message ?: "Unable to load your tickets.")
                }
        }
    }

    private fun renderTickets(tickets: List<TicketDto>) {
        ticketList.removeAllViews()
        if (tickets.isEmpty()) {
            showEmpty(null)
            return
        }
        emptyState.visibility = View.GONE
        activeCountBanner.visibility = View.VISIBLE
        textActiveCount.text = "You have ${tickets.size} active queue${if (tickets.size != 1) "s" else ""}"
        tickets.forEach { t -> ticketList.addView(createTicketCard(t)) }
    }

    private fun showLoading() {
        ticketList.removeAllViews()
        emptyState.visibility = View.GONE
        activeCountBanner.visibility = View.GONE
        val dp = { v: Int -> (v * resources.displayMetrics.density).toInt() }
        ticketList.addView(TextView(requireContext()).apply {
            text = "Loading your tickets…"
            setTextColor(Color.parseColor("#6B7280"))
            textSize = 14f
            gravity = Gravity.CENTER
            setPadding(0, dp(32), 0, dp(32))
        })
    }

    /** Shows the empty state. A non-null message replaces the default sub-text. */
    private fun showEmpty(message: String?) {
        ticketList.removeAllViews()
        activeCountBanner.visibility = View.GONE
        emptyState.visibility = View.VISIBLE
        if (message != null) {
            (emptyState.getChildAt(emptyState.childCount - 1) as? TextView)?.text = message
        }
    }

    private fun createTicketCard(ticket: TicketDto): View {
        val ctx = requireContext()
        val dp = { v: Int -> (v * resources.displayMetrics.density).toInt() }
        val isWaiting = ticket.status.equals("WAITING", true)
        val position = (ticket.peopleAhead ?: 0) + 1

        val card = MaterialCardView(ctx).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = dp(12) }
            radius = dp(14).toFloat()
            cardElevation = dp(3).toFloat()
            setCardBackgroundColor(Color.WHITE)
            setContentPadding(dp(16), dp(14), dp(16), dp(14))
        }

        val content = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
        }

        // Header row: office name + cancel button (waiting tickets only)
        val headerRow = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val nameText = TextView(ctx).apply {
            text = ticket.officeName ?: "Service office"
            setTextColor(Color.parseColor("#111827"))
            textSize = 16f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        headerRow.addView(nameText)

        if (isWaiting) {
            val closeBtn = ImageView(ctx).apply {
                setImageResource(R.drawable.ic_close_24)
                setColorFilter(Color.parseColor("#9CA3AF"))
                layoutParams = LinearLayout.LayoutParams(dp(28), dp(28))
                setPadding(dp(4), dp(4), dp(4), dp(4))
                setOnClickListener { confirmCancel(ticket) }
            }
            headerRow.addView(closeBtn)
        }

        // Info grid: 2 columns
        val grid = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, dp(10), 0, 0)
        }

        val col1 = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        col1.addView(makeLabel(ctx, "Ticket #"))
        col1.addView(makeValue(ctx, ticket.ticketNumber))
        col1.addView(makeSpacer(ctx, dp(8)))
        col1.addView(makeLabel(ctx, "Est. Wait"))
        col1.addView(makeValue(ctx, "~${ticket.estimatedWaitMinutes ?: 0} min"))

        val col2 = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        col2.addView(makeLabel(ctx, "Position"))
        col2.addView(makeValue(ctx, if (isWaiting) "#$position" else "Now serving"))
        col2.addView(makeSpacer(ctx, dp(8)))
        col2.addView(makeLabel(ctx, "Status"))

        val statusBadge = TextView(ctx).apply {
            text = ticket.status.uppercase()
            textSize = 12f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            if (isWaiting) {
                setTextColor(Color.parseColor("#92400E"))
                setBackgroundResource(R.drawable.bg_badge_yellow)
            } else {
                setTextColor(Color.parseColor("#166534"))
                setBackgroundResource(R.drawable.bg_badge_green)
            }
            setPadding(dp(8), dp(3), dp(8), dp(3))
        }
        col2.addView(statusBadge)

        grid.addView(col1)
        grid.addView(col2)

        content.addView(headerRow)
        content.addView(grid)
        card.addView(content)
        return card
    }

    private fun confirmCancel(ticket: TicketDto) {
        AlertDialog.Builder(requireContext())
            .setTitle("Leave queue")
            .setMessage("Cancel ticket ${ticket.ticketNumber} at ${ticket.officeName ?: "this office"}?")
            .setPositiveButton("Leave queue") { _, _ -> cancelTicket(ticket) }
            .setNegativeButton("Stay", null)
            .show()
    }

    private fun cancelTicket(ticket: TicketDto) {
        viewLifecycleOwner.lifecycleScope.launch {
            QueueRepository.cancelTicket(ticket.ticketId)
                .onSuccess {
                    Toast.makeText(requireContext(), "Left queue: ${ticket.officeName}", Toast.LENGTH_SHORT).show()
                    loadTickets()
                }
                .onFailure { error ->
                    Toast.makeText(
                        requireContext(),
                        error.message ?: "Could not cancel the ticket.",
                        Toast.LENGTH_LONG
                    ).show()
                }
        }
    }

    private fun makeLabel(ctx: android.content.Context, text: String): TextView {
        return TextView(ctx).apply {
            this.text = text
            setTextColor(Color.parseColor("#9CA3AF"))
            textSize = 11f
        }
    }

    private fun makeValue(ctx: android.content.Context, text: String): TextView {
        return TextView(ctx).apply {
            this.text = text
            setTextColor(Color.parseColor("#111827"))
            textSize = 15f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        }
    }

    private fun makeSpacer(ctx: android.content.Context, height: Int): View {
        return View(ctx).apply {
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, height)
        }
    }
}
