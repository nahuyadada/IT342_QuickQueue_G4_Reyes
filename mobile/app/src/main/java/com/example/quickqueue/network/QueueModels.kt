package com.example.quickqueue.network

import com.google.gson.annotations.SerializedName

// ── Office ──

data class OfficeDto(
    val id: Long = 0,
    val name: String = "",
    val type: String = "",
    val category: String? = null,
    val address: String? = null,
    val phoneNumber: String? = null,
    val website: String? = null,
    @SerializedName("isActive") val isActive: Boolean = false,
    val approvalStatus: String? = null,
    val businessHours: String? = null
)

// ── Ticket / Queue Status ──

data class TicketDto(
    val ticketId: Long = 0,
    val ticketNumber: String = "",
    val status: String = "",
    val officeName: String? = null,
    val peopleAhead: Int? = null,
    val estimatedWaitMinutes: Int? = null,
    val position: Int? = null,
    val waitingCount: Int? = null
)

// ── Generic API wrapper (the backend wraps some responses) ──

data class ApiListResponse<T>(
    val success: Boolean? = null,
    val data: List<T>? = null,
    val error: ApiError? = null,
    val message: String? = null
)

data class ApiDataResponse<T>(
    val success: Boolean? = null,
    val data: T? = null,
    val error: ApiError? = null,
    val message: String? = null
)

// ── User profile (for resolving userId) ──

data class UserProfileDto(
    val id: Long = 0,
    val name: String = "",
    val email: String = "",
    val role: String = ""
)
