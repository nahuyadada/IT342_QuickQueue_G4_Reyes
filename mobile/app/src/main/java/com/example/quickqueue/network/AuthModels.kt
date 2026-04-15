package com.example.quickqueue.network

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class AuthApiResponse(
    val success: Boolean? = null,
    val data: AuthResponse? = null,
    val error: ApiError? = null,
    val timestamp: String? = null,
    // Backward compatibility for flat auth payloads.
    val message: String? = null,
    val token: String? = null
)

data class ApiError(
    val code: String? = null,
    val message: String? = null,
    val details: Any? = null
)

data class AuthResponse(
    val message: String? = null,
    val token: String? = null,
    val success: Boolean? = null,
    val error: String? = null
)

data class AuthResult(
    val success: Boolean,
    val message: String,
    val token: String? = null
)