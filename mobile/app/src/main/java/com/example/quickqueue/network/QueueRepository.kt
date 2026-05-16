package com.example.quickqueue.network

import java.io.IOException

/**
 * Repository that mirrors the web dashboard's queueService.js API calls.
 * All backend responses are wrapped in ApiResponse: { success, data, error, timestamp }.
 */
object QueueRepository {

    private val api get() = ApiClient.queueApiService

    /** GET /api/offices — fetch all offices. */
    suspend fun getOffices(): Result<List<OfficeDto>> = runCatching {
        val response = api.getOffices()
        if (response.isSuccessful) {
            val body = response.body()
            if (body?.success == false) {
                throw IOException(body.error?.message ?: "Request failed")
            }
            body?.data ?: emptyList()
        } else {
            throw IOException(parseError(response.errorBody()?.string()))
        }
    }

    /** POST /api/queues/join — join a queue. */
    suspend fun joinQueue(userId: Long, officeId: Long): Result<TicketDto> = runCatching {
        val response = api.joinQueue(userId, officeId)
        if (response.isSuccessful) {
            val body = response.body()
            if (body?.success == false) {
                throw IOException(body.error?.message ?: "Request failed")
            }
            body?.data ?: throw IOException("Empty response")
        } else {
            throw IOException(parseError(response.errorBody()?.string()))
        }
    }

    /** GET /api/queues/status/{ticketId} — get ticket status. */
    suspend fun getQueueStatus(ticketId: Long): Result<TicketDto> = runCatching {
        val response = api.getQueueStatus(ticketId)
        if (response.isSuccessful) {
            val body = response.body()
            if (body?.success == false) {
                throw IOException(body.error?.message ?: "Request failed")
            }
            body?.data ?: throw IOException("Empty response")
        } else {
            throw IOException(parseError(response.errorBody()?.string()))
        }
    }

    /** PATCH /api/queues/tickets/{ticketId} — cancel ticket. */
    suspend fun cancelTicket(ticketId: Long): Result<TicketDto> = runCatching {
        val response = api.cancelTicket(ticketId)
        if (response.isSuccessful) {
            val body = response.body()
            if (body?.success == false) {
                throw IOException(body.error?.message ?: "Request failed")
            }
            body?.data ?: throw IOException("Empty response")
        } else {
            throw IOException(parseError(response.errorBody()?.string()))
        }
    }

    /** GET /api/auth/me — resolve the current user profile. */
    suspend fun getCurrentUserProfile(): Result<UserProfileDto> = runCatching {
        val response = api.getCurrentUserProfile()
        if (response.isSuccessful) {
            val body = response.body()
            if (body?.success == false) {
                throw IOException(body.error?.message ?: "Request failed")
            }
            body?.data ?: throw IOException("Empty response")
        } else {
            throw IOException(parseError(response.errorBody()?.string()))
        }
    }

    private fun parseError(raw: String?): String {
        if (raw.isNullOrBlank()) return "Request failed"
        return try {
            val json = org.json.JSONObject(raw)
            json.optString("message").takeIf { it.isNotBlank() }
                ?: json.optJSONObject("error")?.optString("message")?.takeIf { it.isNotBlank() }
                ?: json.optString("error").takeIf { it.isNotBlank() }
                ?: "Request failed"
        } catch (_: Exception) {
            "Request failed"
        }
    }
}
