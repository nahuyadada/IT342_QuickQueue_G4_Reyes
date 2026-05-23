package com.example.quickqueue

import android.app.AlertDialog
import android.os.Bundle
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SwitchCompat
import androidx.appcompat.widget.Toolbar
import androidx.lifecycle.lifecycleScope
import com.example.quickqueue.network.AuthRepository
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import kotlinx.coroutines.launch

class AccountSettingsActivity : AppCompatActivity() {

    private lateinit var editFullName: TextInputEditText
    private lateinit var editEmail: TextInputEditText
    private lateinit var editPhone: TextInputEditText
    private lateinit var editLocation: TextInputEditText
    private lateinit var switchPush: SwitchCompat
    private lateinit var switchEmail: SwitchCompat
    private lateinit var switchSms: SwitchCompat

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_account_settings)

        val toolbar = findViewById<Toolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = ""

        editFullName = findViewById(R.id.editFullName)
        editEmail = findViewById(R.id.editEmail)
        editPhone = findViewById(R.id.editPhone)
        editLocation = findViewById(R.id.editLocation)
        switchPush = findViewById(R.id.switchPush)
        switchEmail = findViewById(R.id.switchEmail)
        switchSms = findViewById(R.id.switchSms)

        loadFromPrefs()

        findViewById<MaterialButton>(R.id.btnChangePassword).setOnClickListener {
            showChangePasswordDialog()
        }

        findViewById<MaterialButton>(R.id.btnSave).setOnClickListener {
            saveToPrefs()
            Toast.makeText(this, "Changes saved successfully", Toast.LENGTH_SHORT).show()
        }
    }

    private fun loadFromPrefs() {
        val prefs = getSharedPreferences("quickqueue_prefs", MODE_PRIVATE)
        editFullName.setText(prefs.getString("user_name", ""))
        editEmail.setText(prefs.getString("user_email", ""))
        editPhone.setText(prefs.getString("user_phone", ""))
        editLocation.setText(prefs.getString("user_location", ""))
        switchPush.isChecked = prefs.getBoolean("notif_push", true)
        switchEmail.isChecked = prefs.getBoolean("notif_email", true)
        switchSms.isChecked = prefs.getBoolean("notif_sms", false)
    }

    private fun saveToPrefs() {
        val prefs = getSharedPreferences("quickqueue_prefs", MODE_PRIVATE)
        prefs.edit()
            .putString("user_name", editFullName.text?.toString()?.trim() ?: "")
            .putString("user_email", editEmail.text?.toString()?.trim() ?: "")
            .putString("user_phone", editPhone.text?.toString()?.trim() ?: "")
            .putString("user_location", editLocation.text?.toString()?.trim() ?: "")
            .putBoolean("notif_push", switchPush.isChecked)
            .putBoolean("notif_email", switchEmail.isChecked)
            .putBoolean("notif_sms", switchSms.isChecked)
            .apply()
    }

    private fun showChangePasswordDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_change_password, null)
        val layoutOld = dialogView.findViewById<TextInputLayout>(R.id.layoutOldPassword)
        val layoutNew = dialogView.findViewById<TextInputLayout>(R.id.layoutNewPassword)
        val layoutConfirm = dialogView.findViewById<TextInputLayout>(R.id.layoutConfirmPassword)
        val editOld = dialogView.findViewById<TextInputEditText>(R.id.editOldPassword)
        val editNew = dialogView.findViewById<TextInputEditText>(R.id.editNewPassword)
        val editConfirm = dialogView.findViewById<TextInputEditText>(R.id.editConfirmPassword)
        val tvError = dialogView.findViewById<TextView>(R.id.tvPasswordError)

        val dialog = AlertDialog.Builder(this)
            .setTitle("Change Password")
            .setView(dialogView)
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Change Password", null)
            .create()

        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                layoutOld.error = null
                layoutNew.error = null
                layoutConfirm.error = null
                tvError.visibility = View.GONE

                val old = editOld.text?.toString().orEmpty()
                val new1 = editNew.text?.toString().orEmpty()
                val new2 = editConfirm.text?.toString().orEmpty()

                var valid = true
                if (old.isBlank()) {
                    layoutOld.error = "Required"
                    valid = false
                }
                if (new1.length < 6) {
                    layoutNew.error = "Minimum 6 characters"
                    valid = false
                }
                if (new2.isBlank()) {
                    layoutConfirm.error = "Required"
                    valid = false
                } else if (new1 != new2) {
                    layoutConfirm.error = "Passwords do not match"
                    valid = false
                }
                if (!valid) return@setOnClickListener

                val btn = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
                btn.isEnabled = false
                btn.text = "Changing…"

                lifecycleScope.launch {
                    val result = AuthRepository.changePassword(old, new1)
                    if (result.success) {
                        dialog.dismiss()
                        Toast.makeText(this@AccountSettingsActivity, "Password changed successfully", Toast.LENGTH_SHORT).show()
                    } else {
                        btn.isEnabled = true
                        btn.text = "Change Password"
                        tvError.text = result.message
                        tvError.visibility = View.VISIBLE
                    }
                }
            }
        }

        dialog.show()
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
