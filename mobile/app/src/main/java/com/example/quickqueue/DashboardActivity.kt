package com.example.quickqueue

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.example.quickqueue.network.ApiClient
import com.google.android.material.bottomnavigation.BottomNavigationView

class DashboardActivity : AppCompatActivity() {

    private lateinit var bottomNav: BottomNavigationView

    private lateinit var homeFragment: HomeFragment
    private lateinit var mapFragment: MapFragment
    private lateinit var ticketsFragment: TicketsFragment
    private lateinit var profileFragment: ProfileFragment
    private lateinit var activeFragment: Fragment

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        val prefs = getSharedPreferences("quickqueue_prefs", MODE_PRIVATE)
        ApiClient.token = prefs.getString("token", null)

        bottomNav = findViewById(R.id.bottomNav)

        if (savedInstanceState == null) {
            // First launch: create all fragments, show only Home.
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
            // After rotation / process death: the fragment manager already restored instances.
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
        val prefs = getSharedPreferences("quickqueue_prefs", MODE_PRIVATE)
        prefs.edit().clear().apply()
        ApiClient.token = null
        startActivity(Intent(this, Login::class.java))
        finish()
    }
}
