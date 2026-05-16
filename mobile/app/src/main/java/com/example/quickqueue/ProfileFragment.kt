package com.example.quickqueue

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment

class ProfileFragment : Fragment() {

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        val view = inflater.inflate(R.layout.fragment_profile, container, false)

        // Populate from SharedPreferences
        val prefs = requireActivity().getSharedPreferences("quickqueue_prefs", 0)
        val name = prefs.getString("user_name", null) ?: "Juan Dela Cruz"
        val email = prefs.getString("user_email", null) ?: "juan.delacruz@email.com"

        view.findViewById<TextView>(R.id.profileName).text = name
        view.findViewById<TextView>(R.id.profileEmail).text = email

        // Avatar initials
        val initials = name.split(" ")
            .filter { it.isNotBlank() }
            .take(2)
            .joinToString("") { it.first().uppercase() }
        view.findViewById<TextView>(R.id.profileAvatar).text = initials.ifBlank { "U" }

        // Logout
        view.findViewById<LinearLayout>(R.id.menuLogout).setOnClickListener {
            (activity as? DashboardActivity)?.logout()
        }

        return view
    }
}
