package com.example.quickqueue

import android.app.AlertDialog
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SwitchCompat
import androidx.appcompat.widget.Toolbar
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText

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
        AlertDialog.Builder(this)
            .setTitle("Change Password")
            .setMessage("Password change requires verification via email. This feature will be available in a future update.")
            .setPositiveButton("OK", null)
            .show()
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
