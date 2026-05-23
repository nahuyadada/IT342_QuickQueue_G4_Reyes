package com.example.quickqueue.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST

interface AuthApiService {

    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthApiResponse>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthApiResponse>

    @PATCH("api/auth/password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): Response<ApiDataResponse<Any>>
}