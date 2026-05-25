package com.example.quickqueue.network

import android.content.Context

/**
 * Resolves the signed-in user's backend id.
 *
 * The id is normally persisted at login. For sessions that predate that change
 * (token present but no stored id), this falls back to GET /api/auth/me and
 * caches the result so later screens don't have to ask again.
 */
object UserSession {

    private const val PREFS = "quickqueue_prefs"

    suspend fun resolveUserId(context: Context): Long? {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val cached = prefs.getLong("user_id", -1L)
        if (cached > 0L) return cached

        val profile = QueueRepository.getCurrentUserProfile().getOrNull() ?: return null
        prefs.edit()
            .putLong("user_id", profile.id)
            .putString("user_name", profile.name)
            .putString("user_email", profile.email)
            .apply()
        return profile.id
    }
}
