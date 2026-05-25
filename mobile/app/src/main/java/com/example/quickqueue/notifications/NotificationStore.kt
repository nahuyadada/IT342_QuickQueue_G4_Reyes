package com.example.quickqueue.notifications

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class StoredNotification(
    val id: Long,
    val type: String,   // "green" | "yellow" | "blue"
    val icon: String,
    val title: String,
    val subtitle: String,
    val timeMillis: Long,
    var isRead: Boolean
)

data class TicketSnapshot(
    val status: String,
    val peopleAhead: Int
)

object NotificationStore {

    private const val PREFS_NAME = "qq_notifications"
    private const val KEY_LIST = "notif_list"
    private const val KEY_SNAPSHOTS = "ticket_snapshots"
    private const val MAX_NOTIFICATIONS = 50

    fun save(ctx: Context, notif: StoredNotification) {
        val prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val arr = getArray(prefs)
        val newArr = JSONArray()
        newArr.put(toJson(notif))
        for (i in 0 until minOf(arr.length(), MAX_NOTIFICATIONS - 1)) {
            if (arr.getJSONObject(i).getLong("id") != notif.id) {
                newArr.put(arr.get(i))
            }
        }
        prefs.edit().putString(KEY_LIST, newArr.toString()).apply()
    }

    fun getAll(ctx: Context): List<StoredNotification> {
        val prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val arr = getArray(prefs)
        return (0 until arr.length()).map { fromJson(arr.getJSONObject(it)) }
    }

    fun markAllRead(ctx: Context) {
        val prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val arr = getArray(prefs)
        val newArr = JSONArray()
        for (i in 0 until arr.length()) {
            val obj = arr.getJSONObject(i)
            obj.put("isRead", true)
            newArr.put(obj)
        }
        prefs.edit().putString(KEY_LIST, newArr.toString()).apply()
    }

    fun getSnapshots(ctx: Context): Map<Long, TicketSnapshot> {
        val prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val raw = prefs.getString(KEY_SNAPSHOTS, "{}") ?: "{}"
        return try {
            val obj = JSONObject(raw)
            obj.keys().asSequence().mapNotNull { key ->
                val id = key.toLongOrNull() ?: return@mapNotNull null
                val snap = obj.getJSONObject(key)
                id to TicketSnapshot(snap.getString("status"), snap.getInt("peopleAhead"))
            }.toMap()
        } catch (_: Exception) { emptyMap() }
    }

    fun saveSnapshots(ctx: Context, snapshots: Map<Long, TicketSnapshot>) {
        val prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val obj = JSONObject()
        snapshots.forEach { (id, snap) ->
            obj.put(id.toString(), JSONObject().apply {
                put("status", snap.status)
                put("peopleAhead", snap.peopleAhead)
            })
        }
        prefs.edit().putString(KEY_SNAPSHOTS, obj.toString()).apply()
    }

    fun formatTime(millis: Long): String {
        val now = System.currentTimeMillis()
        val diff = now - millis
        return when {
            diff < 60_000L -> "just now"
            diff < 3_600_000L -> "${diff / 60_000} min ago"
            diff < 86_400_000L -> "${diff / 3_600_000} hr ago"
            else -> SimpleDateFormat("MMM d", Locale.getDefault()).format(Date(millis))
        }
    }

    private fun getArray(prefs: android.content.SharedPreferences): JSONArray {
        val json = prefs.getString(KEY_LIST, "[]") ?: "[]"
        return try { JSONArray(json) } catch (_: Exception) { JSONArray() }
    }

    private fun toJson(n: StoredNotification) = JSONObject().apply {
        put("id", n.id)
        put("type", n.type)
        put("icon", n.icon)
        put("title", n.title)
        put("subtitle", n.subtitle)
        put("timeMillis", n.timeMillis)
        put("isRead", n.isRead)
    }

    private fun fromJson(obj: JSONObject) = StoredNotification(
        id = obj.getLong("id"),
        type = obj.getString("type"),
        icon = obj.getString("icon"),
        title = obj.getString("title"),
        subtitle = obj.getString("subtitle"),
        timeMillis = obj.getLong("timeMillis"),
        isRead = obj.getBoolean("isRead")
    )
}
