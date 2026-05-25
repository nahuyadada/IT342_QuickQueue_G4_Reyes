package com.example.quickqueue.queue

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class QueuePollingWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {

    override suspend fun doWork(): Result {
        return try {
            QueueNotificationChecker.check(applicationContext)
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }
}
