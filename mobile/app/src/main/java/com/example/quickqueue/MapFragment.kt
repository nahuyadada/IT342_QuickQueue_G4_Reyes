package com.example.quickqueue

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment

class MapFragment : Fragment() {

    data class MapLocation(
        val name: String,
        val type: String,
        val waitMin: Int,
        val queueCount: Int,
        val status: String,
        val hasAdvanceBooking: Boolean
    )

    private val locations = listOf(
        MapLocation("BDO Makati Branch", "Bank", 5, 3, "green", false),
        MapLocation("Manila Doctors Hospital", "Hospital", 15, 8, "yellow", true),
        MapLocation("SSS Main Office", "Gov't Office", 45, 23, "red", true),
        MapLocation("BPI Ortigas Branch", "Bank", 3, 2, "green", false),
        MapLocation("Philippine General Hospital", "Hospital", 60, 30, "red", true),
        MapLocation("DFA Manila", "Gov't Office", 25, 12, "yellow", true)
    )

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        val view = inflater.inflate(R.layout.fragment_map, container, false)

        val webView = view.findViewById<WebView>(R.id.mapWebView)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.cacheMode = WebSettings.LOAD_DEFAULT
        webView.webViewClient = WebViewClient()
        webView.loadUrl("file:///android_asset/map.html")

        val listContainer = view.findViewById<LinearLayout>(R.id.mapLocationList)
        locations.forEach { loc -> listContainer.addView(createLocationRow(loc)) }

        return view
    }

    private fun createLocationRow(loc: MapLocation): View {
        val ctx = requireContext()
        val dp = { v: Int -> (v * resources.displayMetrics.density).toInt() }

        val row = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, dp(8), 0, dp(8))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        val dotRes = when (loc.status) {
            "green" -> R.drawable.bg_dot_green
            "yellow" -> R.drawable.bg_dot_yellow
            else -> R.drawable.bg_dot_red
        }

        val dot = View(ctx).apply {
            layoutParams = LinearLayout.LayoutParams(dp(10), dp(10)).apply { marginEnd = dp(10) }
            setBackgroundResource(dotRes)
        }

        val info = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val nameRow = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val name = TextView(ctx).apply {
            text = loc.name
            setTextColor(Color.parseColor("#111827"))
            textSize = 14f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        }
        nameRow.addView(name)

        if (loc.hasAdvanceBooking) {
            val badge = TextView(ctx).apply {
                text = "Advance Booking"
                textSize = 10f
                setTextColor(Color.parseColor("#1D4ED8"))
                setBackgroundResource(R.drawable.bg_badge_blue)
                setPadding(dp(6), dp(2), dp(6), dp(2))
                val lp = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                lp.marginStart = dp(8)
                layoutParams = lp
            }
            nameRow.addView(badge)
        }

        val detail = TextView(ctx).apply {
            text = "${loc.type}  ·  ${loc.queueCount} waiting  ·  ~${loc.waitMin} min"
            setTextColor(Color.parseColor("#6B7280"))
            textSize = 12f
        }

        info.addView(nameRow)
        info.addView(detail)

        row.addView(dot)
        row.addView(info)
        return row
    }
}
