package com.example.quickqueue.dashboard
import com.example.quickqueue.queue.QueuePollingWorker
import com.example.quickqueue.queue.QueueNotificationChecker
import com.example.quickqueue.profile.ProfileFragment
import com.example.quickqueue.notifications.NotificationHelper
import com.example.quickqueue.auth.Login
import com.example.quickqueue.R

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.example.quickqueue.core.ApiClient
import com.google.android.material.bottomnavigation.BottomNavigationView
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

class DashboardActivity : AppCompatActivity() {

    private lateinit var bottomNav: BottomNavigationView

    private lateinit var homeFragment: HomeFragment
    private lateinit var mapFragment: MapFragment
    private lateinit var ticketsFragment: TicketsFragment
    private lateinit var profileFragment: ProfileFragment
    private lateinit var activeFragment: Fragment

    private val pollHandler = Handler(Looper.getMainLooper())
    private val pollRunnable = object : Runnable {
        override fun run() {
            lifecycleScope.launch { QueueNotificationChecker.check(this@DashboardActivity) }
            pollHandler.postDelayed(this, FOREGROUND_POLL_INTERVAL_MS)
        }
    }

    private val notifPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { /* result ignored */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        val prefs = getSharedPreferences("quickqueue_prefs", MODE_PRIVATE)
        ApiClient.token = prefs.getString("token", null)

        NotificationHelper.createChannel(this)
        requestNotificationPermissionIfNeeded()
        scheduleBackgroundPolling()

        bottomNav = findViewById(R.id.bottomNav)

        if (savedInstanceState == null) {
            homeFragment = HomeFragment()
            mapFragment = MapFragment()
            ticketsFragment = TicketsFragment()
            profileFragment = ProfileFragment()
            activeFragment = homeFragment

            supportFragmentManager.beginTransaction()
                .add(R.id.fragmentContainer, profileFragment, "profile").hide(profileFragment)
                .add(R.id.fragmentContainer, ticketsFragment, "tickets").hide(ticketsFragment)
                .add(R.id.fragmentContainer, mapFragment, "map").hide(mapFragment)
                .add(R.id.fragmentContainer, homeFragment, "home")
                .commit()
        } else {
            homeFragment = supportFragmentManager.findFragmentByTag("home") as HomeFragment
            mapFragment = supportFragmentManager.findFragmentByTag("map") as MapFragment
            ticketsFragment = supportFragmentManager.findFragmentByTag("tickets") as TicketsFragment
            profileFragment = supportFragmentManager.findFragmentByTag("profile") as ProfileFragment

            val activeTag = savedInstanceState.getString("active_tab", "home") ?: "home"
            activeFragment = supportFragmentManager.findFragmentByTag(activeTag) ?: homeFragment
        }

        bottomNav.setOnItemSelectedListener { item ->
            val target: Fragment = when (item.itemId) {
                R.id.nav_home -> homeFragment
                R.id.nav_map -> mapFragment
                R.id.nav_tickets -> ticketsFragment
                R.id.nav_profile -> profileFragment
                else -> homeFragment
            }
            if (target !== activeFragment) {
                supportFragmentManager.beginTransaction()
                    .hide(activeFragment)
                    .show(target)
                    .commit()
                activeFragment = target
            }
            true
        }
    }

    override fun onResume() {
        super.onResume()
        // Immediate check + foreground 30-second polling loop
        pollHandler.post(pollRunnable)
    }

    override fun onPause() {
        super.onPause()
        pollHandler.removeCallbacks(pollRunnable)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        val tag = when (activeFragment) {
            is MapFragment -> "map"
            is TicketsFragment -> "tickets"
            is ProfileFragment -> "profile"
            else -> "home"
        }
        outState.putString("active_tab", tag)
    }

    fun navigateToTickets() {
        bottomNav.selectedItemId = R.id.nav_tickets
    }

    fun logout() {
        WorkManager.getInstance(this).cancelUniqueWork(BACKGROUND_WORK_NAME)
        val prefs = getSharedPreferences("quickqueue_prefs", MODE_PRIVATE)
        prefs.edit().clear().apply()
        ApiClient.token = null
        startActivity(Intent(this, Login::class.java))
        finish()
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    private fun scheduleBackgroundPolling() {
        val request = PeriodicWorkRequestBuilder<QueuePollingWorker>(15, TimeUnit.MINUTES)
            .build()
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            BACKGROUND_WORK_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            request
        )
    }

    companion object {
        private const val BACKGROUND_WORK_NAME = "queue_status_poller"
        private const val FOREGROUND_POLL_INTERVAL_MS = 30_000L
    }
}
