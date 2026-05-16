package com.example.quickqueue

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.view.View
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.example.quickqueue.network.ApiClient
import com.example.quickqueue.network.AuthRepository
import kotlinx.coroutines.launch

class Login : AppCompatActivity() {

    private lateinit var editEmail: EditText
    private lateinit var editPassword: EditText
    private lateinit var textError: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var buttonLogin: MaterialButton

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Auto-login: if we already have a token, skip straight to the dashboard.
        val prefs = getSharedPreferences("quickqueue_prefs", MODE_PRIVATE)
        val savedToken = prefs.getString("token", null)
        if (!savedToken.isNullOrBlank()) {
            ApiClient.token = savedToken
            startActivity(Intent(this, DashboardActivity::class.java))
            finish()
            return
        }

        setContentView(R.layout.activity_login)

        editEmail = findViewById(R.id.editEmail)
        editPassword = findViewById(R.id.editPassword)
        textError = findViewById(R.id.textError)
        progressBar = findViewById(R.id.progressBar)
        buttonLogin = findViewById(R.id.buttonLogin)

        buttonLogin.setOnClickListener { submitLogin() }

        findViewById<TextView>(R.id.textGoToRegister).setOnClickListener {
            startActivity(Intent(this, Registration::class.java))
        }

        findViewById<TextView>(R.id.textForgotPassword).setOnClickListener {
            Toast.makeText(this, R.string.forgot_password_unavailable, Toast.LENGTH_SHORT).show()
        }
    }

    private fun submitLogin() {
        val email = editEmail.text.toString().trim()
        val password = editPassword.text.toString()

        if (!validateInput(email, password)) {
            return
        }

        setLoadingState(true)
        lifecycleScope.launch {
            val result = AuthRepository.login(email, password)
            setLoadingState(false)

            if (result.success) {
                textError.visibility = View.GONE

                // Persist the token so the dashboard (and future launches) can use it.
                val prefs = getSharedPreferences("quickqueue_prefs", MODE_PRIVATE)
                result.token?.let { token ->
                    ApiClient.token = token
                    prefs.edit().putString("token", token).apply()
                }

                // Store minimal user info (email for now; the dashboard will
                // resolve the full profile from /api/auth/me).
                prefs.edit()
                    .putString("user_email", email)
                    .apply()

                Toast.makeText(this@Login, result.message, Toast.LENGTH_SHORT).show()
                startActivity(Intent(this@Login, DashboardActivity::class.java))
                finish()
            } else {
                textError.text = result.message
                textError.visibility = View.VISIBLE
            }
        }
    }

    private fun validateInput(email: String, password: String): Boolean {
        if (email.isBlank()) {
            editEmail.error = "Email is required"
            editEmail.requestFocus()
            return false
        }
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            editEmail.error = "Enter a valid email"
            editEmail.requestFocus()
            return false
        }
        if (password.isBlank()) {
            editPassword.error = "Password is required"
            editPassword.requestFocus()
            return false
        }
        if (password.length < 6) {
            editPassword.error = "Password must be at least 6 characters"
            editPassword.requestFocus()
            return false
        }
        return true
    }

    private fun setLoadingState(isLoading: Boolean) {
        progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        buttonLogin.isEnabled = !isLoading
    }
}