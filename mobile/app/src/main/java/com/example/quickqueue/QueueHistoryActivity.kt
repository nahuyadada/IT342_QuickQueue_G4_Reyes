package com.example.quickqueue

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.quickqueue.network.QueueRepository
import com.example.quickqueue.network.TicketDto
import kotlinx.coroutines.launch

class QueueHistoryActivity : AppCompatActivity() {

    private lateinit var progressBar: ProgressBar
    private lateinit var emptyState: LinearLayout
    private lateinit var recyclerView: RecyclerView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_queue_history)

        val toolbar = findViewById<Toolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = ""

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
                onFailure = {
                    showEmpty()
                }
            )
        }
    }

    private fun showEmpty() {
        progressBar.visibility = View.GONE
        emptyState.visibility = View.VISIBLE
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    private class HistoryAdapter(private val items: List<TicketDto>) :
        RecyclerView.Adapter<HistoryAdapter.VH>() {

        inner class VH(view: View) : RecyclerView.ViewHolder(view) {
            val officeName: TextView = view.findViewById(R.id.tvOfficeName)
            val officeType: TextView = view.findViewById(R.id.tvOfficeType)
            val status: TextView = view.findViewById(R.id.tvStatus)
            val ticketNumber: TextView = view.findViewById(R.id.tvTicketNumber)
            val date: TextView = view.findViewById(R.id.tvDate)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH =
            VH(LayoutInflater.from(parent.context).inflate(R.layout.item_queue_history, parent, false))

        override fun getItemCount() = items.size

        override fun onBindViewHolder(holder: VH, position: Int) {
            val ticket = items[position]
            holder.officeName.text = ticket.officeName ?: "Unknown Office"
            holder.officeType.text = ticket.officeType ?: ""
            holder.ticketNumber.text = "Ticket #${ticket.ticketNumber}"
            holder.date.text = ticket.createdAt?.take(10) ?: ""

            val (label, bg, fg) = when (ticket.status.lowercase()) {
                "served", "completed" -> Triple("Served", Color.parseColor("#D1FAE5"), Color.parseColor("#065F46"))
                "cancelled" -> Triple("Cancelled", Color.parseColor("#FEE2E2"), Color.parseColor("#991B1B"))
                "waiting" -> Triple("Waiting", Color.parseColor("#DBEAFE"), Color.parseColor("#1D4ED8"))
                "serving" -> Triple("Serving", Color.parseColor("#FEF3C7"), Color.parseColor("#92400E"))
                else -> Triple(ticket.status.replaceFirstChar { it.uppercase() }, Color.parseColor("#F3F4F6"), Color.parseColor("#374151"))
            }
            holder.status.text = label
            holder.status.setBackgroundColor(bg)
            holder.status.setTextColor(fg)
        }
    }
}
