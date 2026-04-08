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