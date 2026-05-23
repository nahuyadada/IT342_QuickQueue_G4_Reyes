package com.example.quickqueue

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.quickqueue.network.QueueRepository
import kotlinx.coroutines.launch

class ProfileFragment : Fragment() {

    private lateinit var nameView: TextView
    private lateinit var emailView: TextView
    private lateinit var avatarView: TextView

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        val view = inflater.inflate(R.layout.fragment_profile, container, false)

        nameView = view.findViewById(R.id.profileName)
        emailView = view.findViewById(R.id.profileEmail)
        avatarView = view.findViewById(R.id.profileAvatar)

        // Show cached values immediately, then refresh from the backend.
        val prefs = requireActivity().getSharedPreferences("quickqueue_prefs", 0)
        bind(
            name = prefs.getString("user_name", null)?.takeIf { it.isNotBlank() } ?: "QuickQueue User",
            email = prefs.getString("user_email", null)?.takeIf { it.isNotBlank() } ?: "—"
        )

        view.findViewById<LinearLayout>(R.id.menuLogout).setOnClickListener {
            (activity as? DashboardActivity)?.logout()
        }

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        loadProfile()
    }

    private fun loadProfile() {
        viewLifecycleOwner.lifecycleScope.launch {
            QueueRepository.getCurrentUserProfile().onSuccess { profile ->
                bind(profile.name.ifBlank { "QuickQueue User" }, profile.email)

                // Cache the fresh profile for other screens and faster startup.
                requireActivity().getSharedPreferences("quickqueue_prefs", 0)
                    .edit()
                    .putLong("user_id", profile.id)
                    .putString("user_name", profile.name)
                    .putString("user_email", profile.email)
                    .apply()
            }
            // On failure the cached values stay on screen — no disruption.
        }
    }

    private fun bind(name: String, email: String) {
        nameView.text = name
        emailView.text = email

        val initials = name.split(" ")
            .filter { it.isNotBlank() }
            .take(2)
            .joinToString("") { it.first().uppercase() }
        avatarView.text = initials.ifBlank { "U" }
    }
}
