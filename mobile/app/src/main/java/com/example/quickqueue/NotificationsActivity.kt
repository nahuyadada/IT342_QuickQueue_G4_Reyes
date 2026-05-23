package com.example.quickqueue

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.card.MaterialCardView

data class NotificationItem(
    val id: Int,
    val type: String,   // "green" | "yellow" | "blue"
    val icon: String,
    val title: String,
    val subtitle: String,
    val time: String,
    var isRead: Boolean
)

class NotificationsActivity : AppCompatActivity() {

    private val items = mutableListOf(
        NotificationItem(1, "green",  "▶",  "You're next!",
            "Please proceed to Counter 2 at BPI Makati.",
            "just now", isRead = false),
        NotificationItem(2, "yellow", "⏳", "3 customers ahead",
            "You have 3 people ahead of you at PhilHealth Office.",
            "5 min ago", isRead = false),
        NotificationItem(3, "blue",   "🎟", "Queue joined successfully",
            "You've joined the BPI queue. Ticket: BPI-A103.",
            "2 hrs ago", isRead = true),
        NotificationItem(4, "green",  "✅", "Service completed",
            "Your service at Metro Bank has been completed. Thank you!",
            "Yesterday", isRead = true)
    )

    private lateinit var adapter: NotifAdapter
    private lateinit var tvUnreadCount: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_notifications)

        val toolbar = findViewById<Toolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = ""

        tvUnreadCount = findViewById(R.id.tvUnreadCount)
        updateUnreadCount()

        adapter = NotifAdapter(items)
        val recyclerView = findViewById<RecyclerView>(R.id.recyclerView)
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter

        findViewById<TextView>(R.id.btnClearAll).setOnClickListener {
            items.forEach { it.isRead = true }
            adapter.notifyDataSetChanged()
            updateUnreadCount()
        }
    }

    private fun updateUnreadCount() {
        val count = items.count { !it.isRead }
        tvUnreadCount.text = if (count > 0) "$count unread" else "All caught up"
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    private inner class NotifAdapter(private val data: MutableList<NotificationItem>) :
        RecyclerView.Adapter<NotifAdapter.VH>() {

        inner class VH(view: View) : RecyclerView.ViewHolder(view) {
            val card: MaterialCardView = view.findViewById(R.id.card)
            val tvIcon: TextView = view.findViewById(R.id.tvIcon)
            val tvTitle: TextView = view.findViewById(R.id.tvTitle)
            val tvSubtitle: TextView = view.findViewById(R.id.tvSubtitle)
            val tvTime: TextView = view.findViewById(R.id.tvTime)
            val unreadDot: View = view.findViewById(R.id.unreadDot)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH =
            VH(LayoutInflater.from(parent.context).inflate(R.layout.item_notification, parent, false))

        override fun getItemCount() = data.size

        override fun onBindViewHolder(holder: VH, position: Int) {
            val item = data[position]

            holder.tvTitle.text = item.title
            holder.tvSubtitle.text = item.subtitle
            holder.tvTime.text = item.time
            holder.tvIcon.text = item.icon

            val (iconBg, iconFg, cardBg) = when (item.type) {
                "green" -> Triple(
                    Color.parseColor("#D1FAE5"),
                    Color.parseColor("#065F46"),
                    if (item.isRead) Color.WHITE else Color.parseColor("#F0FDF4")
                )
                "yellow" -> Triple(
                    Color.parseColor("#FEF3C7"),
                    Color.parseColor("#92400E"),
                    if (item.isRead) Color.WHITE else Color.parseColor("#FFFBEB")
                )
                else -> Triple(  // blue
                    Color.parseColor("#DBEAFE"),
                    Color.parseColor("#1D4ED8"),
                    if (item.isRead) Color.WHITE else Color.parseColor("#EFF6FF")
                )
            }

            holder.tvIcon.setBackgroundColor(iconBg)
            holder.tvIcon.setTextColor(iconFg)

            // Make icon circle by setting equal width/height and rounded corners via code
            holder.tvIcon.post {
                val size = holder.tvIcon.height
                val bg = android.graphics.drawable.GradientDrawable()
                bg.shape = android.graphics.drawable.GradientDrawable.OVAL
                bg.setColor(iconBg)
                holder.tvIcon.background = bg
            }

            holder.card.setCardBackgroundColor(cardBg)
            holder.unreadDot.visibility = if (item.isRead) View.GONE else View.VISIBLE
        }
    }
}
