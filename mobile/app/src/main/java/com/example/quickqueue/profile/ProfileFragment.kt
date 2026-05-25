package com.example.quickqueue

import android.content.Intent
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
    private lateinit var phoneView: TextView
    private lateinit var statQueuesJoined: TextView
    private lateinit var statTimeSaved: TextView

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        val view = inflater.inflate(R.layout.fragment_profile, container, false)

        nameView = view.findViewById(R.id.profileName)
        emailView = view.findViewById(R.id.profileEmail)
        avatarView = view.findViewById(R.id.profileAvatar)
        phoneView = view.findViewById(R.id.profilePhone)
        statQueuesJoined = view.findViewById(R.id.statQueuesJoined)
        statTimeSaved = view.findViewById(R.id.statTimeSaved)

        val prefs = requireActivity().getSharedPreferences("quickqueue_prefs", 0)
        bindProfile(
            name = prefs.getString("user_name", null)?.takeIf { it.isNotBlank() } ?: "QuickQueue User",
            email = prefs.getString("user_email", null)?.takeIf { it.isNotBlank() } ?: "—",
            phone = prefs.getString("user_phone", null)
        )

        view.findViewById<LinearLayout>(R.id.menuAccountSettings).setOnClickListener {
            startActivity(Intent(requireContext(), AccountSettingsActivity::class.java))
        }
        view.findViewById<LinearLayout>(R.id.menuNotifications).setOnClickListener {
            startActivity(Intent(requireContext(), NotificationsActivity::class.java))
        }
        view.findViewById<LinearLayout>(R.id.menuQueueHistory).setOnClickListener {
            startActivity(Intent(requireContext(), QueueHistoryActivity::class.java))
        }
        view.findViewById<LinearLayout>(R.id.menuLogout).setOnClickListener {
            (activity as? DashboardActivity)?.logout()
        }

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        loadProfile()
        loadStats()
    }

    private fun loadProfile() {
        viewLifecycleOwner.lifecycleScope.launch {
            QueueRepository.getCurrentUserProfile().onSuccess { profile ->
                if (!isAdded) return@onSuccess
                bindProfile(
                    name = profile.name.ifBlank { "QuickQueue User" },
                    email = profile.email,
                    phone = null
                )
                activity?.getSharedPreferences("quickqueue_prefs", 0)
                    ?.edit()
                    ?.putLong("user_id", profile.id)
                    ?.putString("user_name", profile.name)
                    ?.putString("user_email", profile.email)
                    ?.apply()
            }
        }
    }

    private fun loadStats() {
        viewLifecycleOwner.lifecycleScope.launch {
            val prefs = requireActivity().getSharedPreferences("quickqueue_prefs", 0)
            val userId = prefs.getLong("user_id", -1L)
            if (userId == -1L) return@launch

            QueueRepository.getMyTickets(userId).onSuccess { tickets ->
                if (!isAdded) return@onSuccess
                val count = tickets.size
                statQueuesJoined.text = count.toString()
                // Estimate ~15 min saved per queue visit
                val minutesSaved = count * 15
                val hours = minutesSaved / 60
                val mins = minutesSaved % 60
                statTimeSaved.text = if (hours > 0) {
                    if (mins > 0) "${hours}h ${mins}m" else "${hours} hrs"
                } else {
                    "${mins} min"
                }
            }
        }
    }

    private fun bindProfile(name: String, email: String, phone: String?) {
        nameView.text = name
        emailView.text = email.ifBlank { "—" }
        phoneView.text = phone.takeUnless { it.isNullOrBlank() } ?: "—"

        val initials = name.split(" ")
            .filter { it.isNotBlank() }
            .take(2)
            .joinToString("") { it.first().uppercase() }
        avatarView.text = initials.ifBlank { "U" }
    }
}
