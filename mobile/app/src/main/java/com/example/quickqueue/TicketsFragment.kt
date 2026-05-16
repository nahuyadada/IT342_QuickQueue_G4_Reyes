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
import androidx.fragment.app.Fragment
import com.google.android.material.card.MaterialCardView

class TicketsFragment : Fragment() {

    data class MockTicket(
        val id: Int,
        val establishment: String,
        val ticketNumber: String,
        val position: Int,
        val waitMin: Int,
        val status: String // "WAITING", "SERVING"
    )

    private val tickets = mutableListOf(
        MockTicket(1, "BDO Makati Branch", "B-047", 3, 8, "WAITING"),
        MockTicket(2, "SSS Main Office", "G-128", 12, 35, "WAITING")
    )

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
        renderTickets()
    }

    private fun renderTickets() {
        ticketList.removeAllViews()
        if (tickets.isEmpty()) {
            emptyState.visibility = View.VISIBLE
            activeCountBanner.visibility = View.GONE
        } else {
            emptyState.visibility = View.GONE
            activeCountBanner.visibility = View.VISIBLE
            textActiveCount.text = "You have ${tickets.size} active queue${if (tickets.size != 1) "s" else ""}"
            tickets.forEach { t -> ticketList.addView(createTicketCard(t)) }
        }
    }

    private fun createTicketCard(ticket: MockTicket): View {
        val ctx = requireContext()
        val dp = { v: Int -> (v * resources.displayMetrics.density).toInt() }

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

        // Header row: name + X button
        val headerRow = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val nameText = TextView(ctx).apply {
            text = ticket.establishment
            setTextColor(Color.parseColor("#111827"))
            textSize = 16f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val closeBtn = ImageView(ctx).apply {
            setImageResource(R.drawable.ic_close_24)
            setColorFilter(Color.parseColor("#9CA3AF"))
            layoutParams = LinearLayout.LayoutParams(dp(28), dp(28))
            setPadding(dp(4), dp(4), dp(4), dp(4))
            setOnClickListener {
                tickets.removeAll { it.id == ticket.id }
                renderTickets()
                Toast.makeText(ctx, "Left queue: ${ticket.establishment}", Toast.LENGTH_SHORT).show()
            }
        }

        headerRow.addView(nameText)
        headerRow.addView(closeBtn)

        // Info grid: 2x2
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
        col1.addView(makeValue(ctx, "~${ticket.waitMin} min"))

        val col2 = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        col2.addView(makeLabel(ctx, "Position"))
        col2.addView(makeValue(ctx, "#${ticket.position}"))
        col2.addView(makeSpacer(ctx, dp(8)))
        col2.addView(makeLabel(ctx, "Status"))

        // Status badge
        val statusBadge = TextView(ctx).apply {
            text = ticket.status
            textSize = 12f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            when (ticket.status) {
                "WAITING" -> {
                    setTextColor(Color.parseColor("#92400E"))
                    setBackgroundResource(R.drawable.bg_badge_yellow)
                }
                "SERVING" -> {
                    setTextColor(Color.parseColor("#166534"))
                    setBackgroundResource(R.drawable.bg_badge_green)
                }
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
