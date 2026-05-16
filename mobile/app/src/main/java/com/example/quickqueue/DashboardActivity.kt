package com.example.quickqueue

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.google.android.material.bottomnavigation.BottomNavigationView

class DashboardActivity : AppCompatActivity() {

    private lateinit var bottomNav: BottomNavigationView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        val prefs = getSharedPreferences("quickqueue_prefs", MODE_PRIVATE)
        com.example.quickqueue.network.ApiClient.token = prefs.getString("token", null)

        bottomNav = findViewById(R.id.bottomNav)

        if (savedInstanceState == null) {
            loadFragment(HomeFragment())
        }

        bottomNav.setOnItemSelectedListener { item ->
            val fragment: Fragment = when (item.itemId) {
                R.id.nav_home -> HomeFragment()
                R.id.nav_map -> MapFragment()
                R.id.nav_tickets -> TicketsFragment()
                R.id.nav_profile -> ProfileFragment()
                else -> HomeFragment()
            }
            loadFragment(fragment)
            true
        }
    }

    private fun loadFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, fragment)
            .commit()
    }

    fun navigateToTickets() {
        bottomNav.selectedItemId = R.id.nav_tickets
    }

    fun logout() {
        val prefs = getSharedPreferences("quickqueue_prefs", MODE_PRIVATE)
        prefs.edit().clear().apply()
        com.example.quickqueue.network.ApiClient.token = null
        startActivity(Intent(this, Login::class.java))
        finish()
    }
}
