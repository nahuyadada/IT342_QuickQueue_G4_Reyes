package com.example.quickqueue

import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.google.android.material.card.MaterialCardView

class HomeFragment : Fragment() {

    data class Establishment(
        val name: String,
        val branch: String,
        val type: String,
        val waitMin: Int,
        val queueCount: Int,
        val serviceDuration: String,
        val status: String // "green", "yellow", "red"
    )

    private val allEstablishments = listOf(
        Establishment("BDO", "Makati Branch", "Bank", 5, 3, "~15 min", "green"),
        Establishment("Manila Doctors Hospital", "Ermita, Manila", "Hospital", 15, 8, "~30 min", "yellow"),
        Establishment("SSS Main Office", "Quezon City", "Gov't Office", 45, 23, "~20 min", "red"),
        Establishment("BPI", "Ortigas Branch", "Bank", 3, 2, "~10 min", "green"),
        Establishment("Philippine General Hospital", "Taft Ave, Manila", "Hospital", 60, 30, "~45 min", "red"),
        Establishment("DFA Manila", "Aseana City, Parañaque", "Gov't Office", 25, 12, "~25 min", "yellow")
    )

    private var activeFilter = "All"
    private lateinit var listContainer: LinearLayout
    private lateinit var chips: List<TextView>

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_home, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        listContainer = view.findViewById(R.id.establishmentList)

        val chipAll = view.findViewById<TextView>(R.id.chipAll)
        val chipBank = view.findViewById<TextView>(R.id.chipBank)
        val chipHospital = view.findViewById<TextView>(R.id.chipHospital)
        val chipGovt = view.findViewById<TextView>(R.id.chipGovt)
        chips = listOf(chipAll, chipBank, chipHospital, chipGovt)

        val filterMap = mapOf(chipAll to "All", chipBank to "Bank", chipHospital to "Hospital", chipGovt to "Gov't Office")
        filterMap.forEach { (chip, filter) ->
            chip.setOnClickListener { selectFilter(filter) }
        }

        view.findViewById<LinearLayout>(R.id.btnMyTickets).setOnClickListener {
            (activity as? DashboardActivity)?.navigateToTickets()
        }

        renderEstablishments()
    }

    private fun selectFilter(filter: String) {
        activeFilter = filter
        chips.forEach { chip ->
            val isActive = when (filter) {
                "All" -> chip.id == R.id.chipAll
                "Bank" -> chip.id == R.id.chipBank
                "Hospital" -> chip.id == R.id.chipHospital
                "Gov't Office" -> chip.id == R.id.chipGovt
                else -> false
            }
            chip.setBackgroundResource(if (isActive) R.drawable.bg_chip_active else R.drawable.bg_chip)
            chip.setTextColor(if (isActive) Color.WHITE else Color.parseColor("#374151"))
        }
        renderEstablishments()
    }

    private fun renderEstablishments() {
        listContainer.removeAllViews()
        val filtered = if (activeFilter == "All") allEstablishments
            else allEstablishments.filter { it.type == activeFilter }

        filtered.forEach { est -> listContainer.addView(createEstablishmentCard(est)) }
    }

    private fun createEstablishmentCard(est: Establishment): View {
        val ctx = requireContext()
        val dp = { value: Int -> (value * resources.displayMetrics.density).toInt() }

        val card = MaterialCardView(ctx).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = dp(10) }
            radius = dp(14).toFloat()
            cardElevation = dp(3).toFloat()
            setCardBackgroundColor(Color.WHITE)
            setContentPadding(dp(16), dp(14), dp(16), dp(14))
        }

        val content = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        // Top row: name + status dot
        val topRow = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val dotRes = when (est.status) {
            "green" -> R.drawable.bg_dot_green
            "yellow" -> R.drawable.bg_dot_yellow
            else -> R.drawable.bg_dot_red
        }

        val dot = View(ctx).apply {
            layoutParams = LinearLayout.LayoutParams(dp(10), dp(10)).apply { marginEnd = dp(8) }
            setBackgroundResource(dotRes)
        }

        val nameText = TextView(ctx).apply {
            text = est.name
            setTextColor(Color.parseColor("#111827"))
            textSize = 16f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val typeBadgeRes = when (est.type) {
            "Bank" -> R.drawable.bg_badge_green
            "Hospital" -> R.drawable.bg_badge_red
            else -> R.drawable.bg_badge_yellow
        }
        val typeBadge = TextView(ctx).apply {
            text = est.type
            textSize = 11f
            setTextColor(when (est.type) {
                "Bank" -> Color.parseColor("#166534")
                "Hospital" -> Color.parseColor("#991B1B")
                else -> Color.parseColor("#92400E")
            })
            setBackgroundResource(typeBadgeRes)
            setPadding(dp(8), dp(3), dp(8), dp(3))
        }

        topRow.addView(dot)
        topRow.addView(nameText)
        topRow.addView(typeBadge)

        // Branch
        val branchText = TextView(ctx).apply {
            text = est.branch
            setTextColor(Color.parseColor("#6B7280"))
            textSize = 13f
            setPadding(0, dp(2), 0, 0)
        }

        // Bottom row: stats
        val bottomRow = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, dp(8), 0, 0)
        }

        val statusLabel = when (est.status) {
            "green" -> "Low wait"
            "yellow" -> "Moderate"
            else -> "Long wait"
        }

        val statsText = TextView(ctx).apply {
            text = "⏱ ${est.waitMin} min  ·  👥 ${est.queueCount} in queue  ·  🕐 ${est.serviceDuration}"
            setTextColor(Color.parseColor("#6B7280"))
            textSize = 12f
        }

        bottomRow.addView(statsText)

        content.addView(topRow)
        content.addView(branchText)
        content.addView(bottomRow)
        card.addView(content)
        return card
    }
}
