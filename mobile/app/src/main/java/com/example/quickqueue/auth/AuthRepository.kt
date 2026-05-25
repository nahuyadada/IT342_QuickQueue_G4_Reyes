package com.example.quickqueue.auth
import com.example.quickqueue.core.ApiClient

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

    suspend fun changePassword(oldPassword: String, newPassword: String): AuthResult {
        return try {
            val response = ApiClient.authApiService.changePassword(
                ChangePasswordRequest(oldPassword, newPassword)
            )
            val body = response.body()
            if (response.isSuccessful) {
                if (body?.success == false) {
                    AuthResult(success = false, message = body.error?.message?.takeIf { it.isNotBlank() } ?: "Request failed")
                } else {
                    AuthResult(success = true, message = "Password changed successfully")
                }
            } else {
                AuthResult(success = false, message = parseErrorMessage(response.errorBody()?.string()))
            }
        } catch (_: IOException) {
            AuthResult(success = false, message = "Cannot connect to backend.")
        } catch (ex: Exception) {
            AuthResult(success = false, message = ex.localizedMessage ?: "Unexpected error occurred")
        }
    }

    private suspend fun executeAuthCall(call: suspend () -> Response<AuthApiResponse>): AuthResult {
        return try {
            val response = call()
            val body = response.body()

            if (response.isSuccessful) {
                if (body?.success == false) {
                    val message = body.error?.message?.takeIf { it.isNotBlank() } ?: "Request failed"
                    return AuthResult(success = false, message = message)
                }

                val authPayload = body?.data ?: body?.toLegacyAuthResponse()
                val message = authPayload?.message?.takeIf { it.isNotBlank() }
                    ?: body?.message?.takeIf { it.isNotBlank() }
                    ?: "Request successful"
                val token = authPayload?.token ?: body?.token

                AuthResult(
                    success = true,
                    message = message,
                    token = token,
                    userId = authPayload?.id,
                    name = authPayload?.name,
                    email = authPayload?.email
                )
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
            val topMessage = json.optString("message")
            val topError = json.opt("error")

            when {
                !topMessage.isNullOrBlank() -> topMessage.trim()
                topError is JSONObject && !topError.optString("message").isNullOrBlank() -> {
                    topError.optString("message").trim()
                }
                !json.optString("error").isNullOrBlank() -> json.optString("error").trim()
                else -> "Request failed"
            }
        } catch (_: Exception) {
            "Request failed"
        }
    }

    private fun AuthApiResponse.toLegacyAuthResponse(): AuthResponse? {
        if (token.isNullOrBlank() && message.isNullOrBlank()) {
            return null
        }
        return AuthResponse(message = message, token = token)
    }
}