package com.example.quickqueue

import android.graphics.Color
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.quickqueue.network.QueueRepository
import com.example.quickqueue.network.UserSession
import com.google.android.material.card.MaterialCardView
import kotlinx.coroutines.launch

class HomeFragment : Fragment() {

    /** A service office merged with its live waiting count. */
    data class Establishment(
        val id: Long,
        val name: String,
        val address: String,
        val type: String,      // raw backend type, e.g. "BANK"
        val category: String,  // friendly filter category
        val queueCount: Int
    ) {
        val waitMin: Int get() = queueCount * 5
        val status: String get() = when {
            queueCount >= 15 -> "red"
            queueCount >= 6 -> "yellow"
            else -> "green"
        }
    }

    private var allEstablishments: List<Establishment> = emptyList()
    private var activeFilter = "All"
    private var searchQuery = ""

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

        view.findViewById<EditText>(R.id.searchInput).addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                searchQuery = s?.toString()?.trim().orEmpty()
                renderEstablishments()
            }
        })

        view.findViewById<LinearLayout>(R.id.btnMyTickets).setOnClickListener {
            (activity as? DashboardActivity)?.navigateToTickets()
        }

        loadOffices()
    }

    /** Refresh whenever the tab is shown again (e.g. after joining a queue elsewhere). */
    override fun onResume() {
        super.onResume()
        if (allEstablishments.isNotEmpty()) loadOffices()
    }

    private fun loadOffices() {
        showMessage("Loading establishments…")
        viewLifecycleOwner.lifecycleScope.launch {
            val officesResult = QueueRepository.getOffices()
            val counts = QueueRepository.getQueueCounts().getOrDefault(emptyMap())

            officesResult
                .onSuccess { offices ->
                    allEstablishments = offices.map { office ->
                        Establishment(
                            id = office.id,
                            name = office.name,
                            address = office.address.orEmpty().ifBlank { office.category.orEmpty() },
                            type = office.type,
                            category = categoryOf(office.type),
                            queueCount = counts[office.id] ?: 0
                        )
                    }
                    renderEstablishments()
                }
                .onFailure { error ->
                    showMessage(error.message ?: "Unable to load establishments.")
                }
        }
    }

    /** Maps a raw backend office type onto one of the home-screen filter chips. */
    private fun categoryOf(type: String): String {
        val t = type.uppercase()
        return when {
            t.contains("BANK") -> "Bank"
            t.contains("HOSPITAL") || t.contains("CLINIC") || t.contains("DENTAL") -> "Hospital"
            t.contains("GOV") -> "Gov't Office"
            else -> "Other"
        }
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

        val filtered = allEstablishments
            .filter { activeFilter == "All" || it.category == activeFilter }
            .filter { searchQuery.isBlank() || it.name.contains(searchQuery, ignoreCase = true) }

        if (filtered.isEmpty()) {
            showMessage("No establishments match your filters.")
            return
        }

        filtered.forEach { est -> listContainer.addView(createEstablishmentCard(est)) }
    }

    private fun showMessage(message: String) {
        listContainer.removeAllViews()
        val dp = { v: Int -> (v * resources.displayMetrics.density).toInt() }
        listContainer.addView(TextView(requireContext()).apply {
            text = message
            setTextColor(Color.parseColor("#6B7280"))
            textSize = 14f
            gravity = Gravity.CENTER
            setPadding(0, dp(32), 0, dp(32))
        })
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
            isClickable = true
            isFocusable = true
            setOnClickListener { confirmJoinQueue(est) }
        }

        val content = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        // Top row: status dot + name + type badge
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

        val typeBadgeRes = when (est.category) {
            "Bank" -> R.drawable.bg_badge_green
            "Hospital" -> R.drawable.bg_badge_red
            "Gov't Office" -> R.drawable.bg_badge_yellow
            else -> R.drawable.bg_badge_blue
        }
        val typeBadge = TextView(ctx).apply {
            text = if (est.category == "Other") est.type else est.category
            textSize = 11f
            setTextColor(when (est.category) {
                "Bank" -> Color.parseColor("#166534")
                "Hospital" -> Color.parseColor("#991B1B")
                "Gov't Office" -> Color.parseColor("#92400E")
                else -> Color.parseColor("#1D4ED8")
            })
            setBackgroundResource(typeBadgeRes)
            setPadding(dp(8), dp(3), dp(8), dp(3))
        }

        topRow.addView(dot)
        topRow.addView(nameText)
        topRow.addView(typeBadge)

        // Address
        val branchText = TextView(ctx).apply {
            text = est.address.ifBlank { "Address unavailable" }
            setTextColor(Color.parseColor("#6B7280"))
            textSize = 13f
            setPadding(0, dp(2), 0, 0)
        }

        // Stats
        val statsText = TextView(ctx).apply {
            text = "⏱ ~${est.waitMin} min  ·  👥 ${est.queueCount} in queue"
            setTextColor(Color.parseColor("#6B7280"))
            textSize = 12f
            setPadding(0, dp(8), 0, 0)
        }

        // Join hint
        val joinHint = TextView(ctx).apply {
            text = "Tap to join this queue →"
            setTextColor(Color.parseColor("#4338CA"))
            textSize = 12f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            setPadding(0, dp(6), 0, 0)
        }

        content.addView(topRow)
        content.addView(branchText)
        content.addView(statsText)
        content.addView(joinHint)
        card.addView(content)
        return card
    }

    private fun confirmJoinQueue(est: Establishment) {
        AlertDialog.Builder(requireContext())
            .setTitle("Join queue")
            .setMessage("Join the queue at ${est.name}? You'll get a ticket and ~${est.waitMin} min estimated wait.")
            .setPositiveButton("Join") { _, _ -> joinQueue(est) }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun joinQueue(est: Establishment) {
        viewLifecycleOwner.lifecycleScope.launch {
            val userId = UserSession.resolveUserId(requireContext())
            if (userId == null) {
                Toast.makeText(requireContext(), "Session expired. Please log in again.", Toast.LENGTH_LONG).show()
                return@launch
            }

            QueueRepository.joinQueue(userId, est.id)
                .onSuccess { ticket ->
                    Toast.makeText(
                        requireContext(),
                        "Joined ${est.name} — ticket ${ticket.ticketNumber}",
                        Toast.LENGTH_LONG
                    ).show()
                    (activity as? DashboardActivity)?.navigateToTickets()
                }
                .onFailure { error ->
                    Toast.makeText(
                        requireContext(),
                        error.message ?: "Could not join the queue.",
                        Toast.LENGTH_LONG
                    ).show()
                }
        }
    }
}
