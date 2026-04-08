package com.example.quickqueue.network

import org.json.JSONObject
import retrofit2.Response
import java.io.IOException

object AuthRepository {

    suspend fun register(name: String, email: String, password: String): AuthResult {
        return executeAuthCall {
            ApiClient.authApiService.register(RegisterRequest(name, email, password))
        }
    }

    suspend fun login(email: String, password: String): AuthResult {
        return executeAuthCall {
            ApiClient.authApiService.login(LoginRequest(email, password))
        }
    }

    private suspend fun executeAuthCall(call: suspend () -> Response<AuthResponse>): AuthResult {
        return try {
            val response = call()
            if (response.isSuccessful) {
                val body = response.body()
                val message = body?.message?.takeIf { it.isNotBlank() } ?: "Request successful"
                AuthResult(success = true, message = message, token = body?.token)
            } else {
                val errorMessage = parseErrorMessage(response.errorBody()?.string())
                AuthResult(success = false, message = errorMessage)
            }
        } catch (_: IOException) {
            AuthResult(
                success = false,
                message = "Cannot connect to backend. Check server status and BACKEND_BASE_URL."
            )
        } catch (ex: Exception) {
            AuthResult(
                success = false,
                message = ex.localizedMessage ?: "Unexpected error occurred"
            )
        }
    }

    private fun parseErrorMessage(raw: String?): String {
        if (raw.isNullOrBlank()) {
            return "Request failed"
        }

        return try {
            val json = JSONObject(raw)
            when {
                !json.optString("message").isNullOrBlank() -> json.optString("message")
                !json.optString("error").isNullOrBlank() -> json.optString("error")
                else -> "Request failed"
            }
        } catch (_: Exception) {
            "Request failed"
        }
    }

    private fun String?.isNullOrBlank(): Boolean {
        return this == null || this.isBlank()
    }
}