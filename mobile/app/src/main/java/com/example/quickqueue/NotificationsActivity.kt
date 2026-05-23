package com.example.quickqueue

import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.quickqueue.network.NotificationStore
import com.example.quickqueue.network.StoredNotification
import com.google.android.material.card.MaterialCardView

class NotificationsActivity : AppCompatActivity() {

    private lateinit var adapter: NotifAdapter
    private lateinit var tvUnreadCount: TextView
    private lateinit var emptyView: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_notifications)

        val toolbar = findViewById<Toolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = ""

        tvUnreadCount = findViewById(R.id.tvUnreadCount)
        emptyView = TextView(this).apply {
            text = "No notifications yet.\nYou'll be notified when your queue status changes."
            setTextColor(Color.parseColor("#6B7280"))
            textSize = 14f
            gravity = Gravity.CENTER
            setPadding(48, 64, 48, 0)
        }

        val items = NotificationStore.getAll(this).toMutableList()
        updateUnreadCount(items)

        adapter = NotifAdapter(items)
        val recyclerView = findViewById<RecyclerView>(R.id.recyclerView)
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter

        if (items.isEmpty()) {
            recyclerView.visibility = View.GONE
            (recyclerView.parent as ViewGroup).addView(emptyView)
        }

        findViewById<TextView>(R.id.btnClearAll).setOnClickListener {
            NotificationStore.markAllRead(this)
            items.forEach { it.isRead = true }
            adapter.notifyDataSetChanged()
            updateUnreadCount(items)
        }
    }

    private fun updateUnreadCount(items: List<StoredNotification>) {
        val count = items.count { !it.isRead }
        tvUnreadCount.text = if (count > 0) "$count unread" else "All caught up"
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    private inner class NotifAdapter(private val data: MutableList<StoredNotification>) :
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
            holder.tvTime.text = NotificationStore.formatTime(item.timeMillis)
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
                else -> Triple(
                    Color.parseColor("#DBEAFE"),
                    Color.parseColor("#1D4ED8"),
                    if (item.isRead) Color.WHITE else Color.parseColor("#EFF6FF")
                )
            }

            holder.tvIcon.post {
                val bg = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(iconBg)
                }
                holder.tvIcon.background = bg
            }
            holder.tvIcon.setTextColor(iconFg)
            holder.card.setCardBackgroundColor(cardBg)
            holder.unreadDot.visibility = if (item.isRead) View.GONE else View.VISIBLE
        }
    }
}
