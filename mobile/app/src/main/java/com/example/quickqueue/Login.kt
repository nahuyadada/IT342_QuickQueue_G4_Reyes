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
import com.example.quickqueue.network.AuthRepository
import kotlinx.coroutines.launch

class Login : AppCompatActivity() {

    private lateinit var editEmail: EditText
    private lateinit var editPassword: EditText
    private lateinit var textError: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var buttonLogin: MaterialButton
    private lateinit var buttonGoogleSignIn: MaterialButton

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        editEmail = findViewById(R.id.editEmail)
        editPassword = findViewById(R.id.editPassword)
        textError = findViewById(R.id.textError)
        progressBar = findViewById(R.id.progressBar)
        buttonLogin = findViewById(R.id.buttonLogin)
        buttonGoogleSignIn = findViewById(R.id.buttonGoogleSignIn)

        buttonLogin.setOnClickListener { submitLogin() }
        // Placeholder only for now: intentionally no action on click.
        buttonGoogleSignIn.setOnClickListener { }

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
                Toast.makeText(this@Login, result.message, Toast.LENGTH_SHORT).show()
                startActivity(Intent(this@Login, MainActivity::class.java))
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
        buttonGoogleSignIn.isEnabled = !isLoading
    }
}