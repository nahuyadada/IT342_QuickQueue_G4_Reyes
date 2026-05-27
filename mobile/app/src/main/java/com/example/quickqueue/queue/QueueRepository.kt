package com.example.quickqueue.queue
import com.example.quickqueue.core.ApiClient

import java.io.IOException
import kotlinx.coroutines.CancellationException

/**
 * Repository that mirrors the web dashboard's queueService.js API calls.
 * All backend responses are wrapped in ApiResponse: { success, data, error, timestamp }.
 *
 * CancellationException is always re-thrown so coroutine cancellation (e.g. from
 * viewLifecycleOwner.lifecycleScope when a fragment is destroyed) propagates correctly
 * instead of being swallowed by runCatching and landing in an onFailure callback
 * that tries to touch a detached fragment's views.
 */
object QueueRepository {

    private val api get() = ApiClient.queueApiService

    /** GET /api/offices — fetch all offices. */
    suspend fun getOffices(): Result<List<OfficeDto>> = try {
        val response = api.getOffices()
        if (response.isSuccessful) {
            val body = response.body()
            if (body?.success == false) throw IOException(body.error?.message ?: "Request failed")
            Result.success(body?.data ?: emptyList())
        } else {
            Result.failure(IOException(parseError(response.errorBody()?.string())))
        }
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        Result.failure(e)
    }

    /** GET /api/offices/queue-counts — waiting count per office id. */
    suspend fun getQueueCounts(): Result<Map<Long, Int>> = try {
        val response = api.getQueueCounts()
        if (response.isSuccessful) {
            val body = response.body()
            if (body?.success == false) throw IOException(body.error?.message ?: "Request failed")
            val counts = (body?.data ?: emptyMap())
                .mapNotNull { (key, value) -> key.toLongOrNull()?.let { it to value } }
                .toMap()
            Result.success(counts)
        } else {
            Result.failure(IOException(parseError(response.errorBody()?.string())))
        }
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        Result.failure(e)
    }

    /** GET /api/queues/my-tickets — every ticket belonging to the user. */
    suspend fun getMyTickets(userId: Long): Result<List<TicketDto>> = try {
        val response = api.getMyTickets(userId)
        if (response.isSuccessful) {
            val body = response.body()
            if (body?.success == false) throw IOException(body.error?.message ?: "Request failed")
            Result.success(body?.data ?: emptyList())
        } else {
            Result.failure(IOException(parseError(response.errorBody()?.string())))
        }
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        Result.failure(e)
    }

    /** POST /api/queues/join — join a queue. */
    suspend fun joinQueue(userId: Long, officeId: Long): Result<TicketDto> = try {
        val response = api.joinQueue(userId, officeId)
        if (response.isSuccessful) {
            val body = response.body()
            if (body?.success == false) throw IOException(body.error?.message ?: "Request failed")
            Result.success(body?.data ?: throw IOException("Empty response"))
        } else {
            Result.failure(IOException(parseError(response.errorBody()?.string())))
        }
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        Result.failure(e)
    }

    /** GET /api/queues/status/{ticketId} — get ticket status. */
    suspend fun getQueueStatus(ticketId: Long): Result<TicketDto> = try {
        val response = api.getQueueStatus(ticketId)
        if (response.isSuccessful) {
            val body = response.body()
            if (body?.success == false) throw IOException(body.error?.message ?: "Request failed")
            Result.success(body?.data ?: throw IOException("Empty response"))
        } else {
            Result.failure(IOException(parseError(response.errorBody()?.string())))
        }
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        Result.failure(e)
    }

    /** PATCH /api/queues/tickets/{ticketId} — cancel ticket. */
    suspend fun cancelTicket(ticketId: Long): Result<TicketDto> = try {
        val response = api.cancelTicket(ticketId)
        if (response.isSuccessful) {
            val body = response.body()
            if (body?.success == false) throw IOException(body.error?.message ?: "Request failed")
            Result.success(body?.data ?: throw IOException("Empty response"))
        } else {
            Result.failure(IOException(parseError(response.errorBody()?.string())))
        }
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        Result.failure(e)
    }

    /** GET /api/auth/me — resolve the current user profile. */
    suspend fun getCurrentUserProfile(): Result<UserProfileDto> = try {
        val response = api.getCurrentUserProfile()
        if (response.isSuccessful) {
            val body = response.body()
            if (body?.success == false) throw IOException(body.error?.message ?: "Request failed")
            Result.success(body?.data ?: throw IOException("Empty response"))
        } else {
            Result.failure(IOException(parseError(response.errorBody()?.string())))
        }
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        Result.failure(e)
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
