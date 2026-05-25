package com.example.quickqueue.queue
import com.example.quickqueue.R

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.quickqueue.queue.QueueRepository
import com.example.quickqueue.queue.TicketDto
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale

class QueueHistoryActivity : AppCompatActivity() {

    private lateinit var progressBar: ProgressBar
    private lateinit var emptyState: LinearLayout
    private lateinit var recyclerView: RecyclerView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_queue_history)

        findViewById<ImageButton>(R.id.btnBack).setOnClickListener { finish() }

        progressBar = findViewById(R.id.progressBar)
        emptyState = findViewById(R.id.emptyState)
        recyclerView = findViewById(R.id.recyclerView)
        recyclerView.layoutManager = LinearLayoutManager(this)

        loadHistory()
    }

    private fun loadHistory() {
        val prefs = getSharedPreferences("quickqueue_prefs", MODE_PRIVATE)
        val userId = prefs.getLong("user_id", -1L)
        if (userId == -1L) {
            showEmpty()
            return
        }

        lifecycleScope.launch {
            QueueRepository.getMyTickets(userId).fold(
                onSuccess = { tickets ->
                    progressBar.visibility = View.GONE
                    if (tickets.isEmpty()) {
                        showEmpty()
                    } else {
                        recyclerView.adapter = HistoryAdapter(tickets)
                        recyclerView.visibility = View.VISIBLE
                    }
                },
                onFailure = { showEmpty() }
            )
        }
    }

    private fun showEmpty() {
        progressBar.visibility = View.GONE
        emptyState.visibility = View.VISIBLE
    }

    private inner class HistoryAdapter(private val items: List<TicketDto>) :
        RecyclerView.Adapter<HistoryAdapter.VH>() {

        private val inputFmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
        private val displayFmt = SimpleDateFormat("MMM d, yyyy", Locale.getDefault())

        inner class VH(view: View) : RecyclerView.ViewHolder(view) {
            val tvOfficeName: TextView = view.findViewById(R.id.tvOfficeName)
            val tvOfficeType: TextView = view.findViewById(R.id.tvOfficeType)
            val tvStatus: TextView = view.findViewById(R.id.tvStatus)
            val tvTicketNumber: TextView = view.findViewById(R.id.tvTicketNumber)
            val tvDate: TextView = view.findViewById(R.id.tvDate)
            val tvWaitTime: TextView = view.findViewById(R.id.tvWaitTime)
            val tvFeedback: TextView = view.findViewById(R.id.tvFeedback)
            val tvFeedbackGiven: TextView = view.findViewById(R.id.tvFeedbackGiven)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH =
            VH(LayoutInflater.from(parent.context).inflate(R.layout.item_queue_history, parent, false))

        override fun getItemCount() = items.size

        override fun onBindViewHolder(holder: VH, position: Int) {
            val ticket = items[position]

            holder.tvOfficeName.text = ticket.officeName ?: "Unknown Office"
            holder.tvOfficeType.text = ticket.officeType ?: ""
            holder.tvTicketNumber.text = "#${ticket.ticketNumber}"
            holder.tvDate.text = ticket.createdAt?.let { formatDate(it) } ?: "—"
            holder.tvWaitTime.text = ticket.estimatedWaitMinutes
                ?.let { if (it >= 60) "${it / 60}h ${it % 60}m" else "${it} min" }
                ?: "—"

            val (label, bgRes, fgColor) = statusStyle(ticket.status)
            holder.tvStatus.text = label
            holder.tvStatus.setBackgroundResource(bgRes)
            holder.tvStatus.setTextColor(fgColor)

            val isCompleted = ticket.status.lowercase() in listOf("served", "completed")
            if (isCompleted) {
                holder.tvFeedback.visibility = View.VISIBLE
                holder.tvFeedbackGiven.visibility = View.GONE
                holder.tvFeedback.setOnClickListener {
                    Toast.makeText(this@QueueHistoryActivity, "Feedback feature coming soon", Toast.LENGTH_SHORT).show()
                }
            } else {
                holder.tvFeedback.visibility = View.GONE
                holder.tvFeedbackGiven.visibility = View.GONE
            }
        }

        private fun formatDate(raw: String): String {
            return try {
                val date = inputFmt.parse(raw.take(19)) ?: return raw.take(10)
                displayFmt.format(date)
            } catch (_: Exception) {
                raw.take(10)
            }
        }

        private fun statusStyle(status: String): Triple<String, Int, Int> = when (status.lowercase()) {
            "served", "completed" ->
                Triple("Served", R.drawable.bg_badge_green, Color.parseColor("#065F46"))
            "cancelled" ->
                Triple("Cancelled", R.drawable.bg_badge_red, Color.parseColor("#991B1B"))
            "serving" ->
                Triple("Serving", R.drawable.bg_badge_yellow, Color.parseColor("#92400E"))
            "waiting" ->
                Triple("Waiting", R.drawable.bg_badge_blue, Color.parseColor("#1D4ED8"))
            else ->
                Triple(
                    status.replaceFirstChar { it.uppercase() },
                    R.drawable.bg_badge_blue,
                    Color.parseColor("#374151")
                )
        }
    }
}
