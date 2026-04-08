package com.example.quickqueue

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.quickqueue.network.AuthRepository
import kotlinx.coroutines.launch

class Registration : AppCompatActivity() {

    private lateinit var editName: EditText
    private lateinit var editEmail: EditText
    private lateinit var editPassword: EditText
    private lateinit var textError: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var buttonRegister: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_registration)

        editName = findViewById(R.id.editName)
        editEmail = findViewById(R.id.editEmail)
        editPassword = findViewById(R.id.editPassword)
        textError = findViewById(R.id.textError)
        progressBar = findViewById(R.id.progressBar)
        buttonRegister = findViewById(R.id.buttonRegister)

        buttonRegister.setOnClickListener { submitRegistration() }

        findViewById<TextView>(R.id.textGoToLogin).setOnClickListener {
            finish()
        }
    }

    private fun submitRegistration() {
        val name = editName.text.toString().trim()
        val email = editEmail.text.toString().trim()
        val password = editPassword.text.toString()

        if (!validateInput(name, email, password)) {
            return
        }

        setLoadingState(true)
        lifecycleScope.launch {
            val result = AuthRepository.register(name, email, password)
            setLoadingState(false)

            if (result.success) {
                textError.visibility = View.GONE
                Toast.makeText(this@Registration, result.message, Toast.LENGTH_SHORT).show()
                startActivity(Intent(this@Registration, Login::class.java))
                finish()
            } else {
                textError.text = result.message
                textError.visibility = View.VISIBLE
            }
        }
    }

    private fun validateInput(name: String, email: String, password: String): Boolean {
        if (name.isBlank()) {
            editName.error = "Name is required"
            editName.requestFocus()
            return false
        }
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
        buttonRegister.isEnabled = !isLoading
    }
}