package com.example.quickqueue.network

import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface QueueApiService {

    /** List all approved, active offices. Wrapped in ApiResponse<List<OfficeDto>>. */
    @GET("api/offices")
    suspend fun getOffices(): Response<ApiDataResponse<List<OfficeDto>>>

    /** Join a queue. Wrapped in ApiResponse<TicketDto>. */
    @POST("api/queues/join")
    suspend fun joinQueue(
        @Query("userId") userId: Long,
        @Query("officeId") officeId: Long
    ): Response<ApiDataResponse<TicketDto>>

    /** Get the current status of a ticket. Wrapped in ApiResponse<TicketDto>. */
    @GET("api/queues/status/{ticketId}")
    suspend fun getQueueStatus(@Path("ticketId") ticketId: Long): Response<ApiDataResponse<TicketDto>>

    /** Cancel a ticket. Wrapped in ApiResponse<TicketDto>. */
    @PATCH("api/queues/tickets/{ticketId}")
    suspend fun cancelTicket(@Path("ticketId") ticketId: Long): Response<ApiDataResponse<TicketDto>>

    /** Get current user profile. Wrapped in ApiResponse<UserProfileDto>. */
    @GET("api/auth/me")
    suspend fun getCurrentUserProfile(): Response<ApiDataResponse<UserProfileDto>>
}
