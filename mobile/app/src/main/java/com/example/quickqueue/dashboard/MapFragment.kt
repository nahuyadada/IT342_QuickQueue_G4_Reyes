package com.example.quickqueue.dashboard
import com.example.quickqueue.R

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
import androidx.lifecycle.lifecycleScope
import com.example.quickqueue.queue.OfficeDto
import com.example.quickqueue.queue.QueueRepository
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

class MapFragment : Fragment() {

    /** A service office merged with its live waiting count. */
    data class MapLocation(
        val name: String,
        val type: String,
        val latitude: Double?,
        val longitude: Double?,
        val queueCount: Int
    ) {
        val waitMin: Int get() = queueCount * 5
        val status: String get() = when {
            queueCount >= 15 -> "red"
            queueCount >= 6 -> "yellow"
            else -> "green"
        }
    }

    private lateinit var webView: WebView
    private lateinit var listContainer: LinearLayout

    private var pageLoaded = false
    private var pendingMapJson: String? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        val view = inflater.inflate(R.layout.fragment_map, container, false)

        webView = view.findViewById(R.id.mapWebView)
        listContainer = view.findViewById(R.id.mapLocationList)

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.cacheMode = WebSettings.LOAD_DEFAULT
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                pageLoaded = true
                pendingMapJson?.let { pushToMap(it) }
            }
        }
        webView.loadUrl("file:///android_asset/map.html")

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        loadOffices()
    }

    private fun loadOffices() {
        showMessage("Loading queue map…")
        viewLifecycleOwner.lifecycleScope.launch {
            val officesResult = QueueRepository.getOffices()
            val counts = QueueRepository.getQueueCounts().getOrDefault(emptyMap())
            if (!isAdded) return@launch

            officesResult
                .onSuccess { offices ->
                    val locations = offices.map { office ->
                        MapLocation(
                            name = office.name,
                            type = friendlyType(office),
                            latitude = office.latitude,
                            longitude = office.longitude,
                            queueCount = counts[office.id] ?: 0
                        )
                    }
                    renderList(locations)
                    pushToMap(buildMapJson(locations))
                }
                .onFailure { error ->
                    showMessage(error.message ?: "Unable to load the queue map.")
                }
        }
    }

    private fun friendlyType(office: OfficeDto): String {
        val category = office.category?.takeIf { it.isNotBlank() }
        if (category != null) return category
        val t = office.type.lowercase().replaceFirstChar { it.uppercase() }
        return t.ifBlank { "Office" }
    }

    /** Builds the JSON the in-page map expects: only offices with coordinates. */
    private fun buildMapJson(locations: List<MapLocation>): String {
        val array = JSONArray()
        locations.forEach { loc ->
            if (loc.latitude != null && loc.longitude != null) {
                array.put(JSONObject().apply {
                    put("name", loc.name)
                    put("type", loc.type)
                    put("lat", loc.latitude)
                    put("lng", loc.longitude)
                    put("count", loc.queueCount)
                    put("wait", loc.waitMin)
                })
            }
        }
        return array.toString()
    }

    private fun pushToMap(json: String) {
        if (!pageLoaded) {
            pendingMapJson = json
            return
        }
        pendingMapJson = null
        // JSONObject.quote turns the JSON array text into a safe JS string literal.
        webView.evaluateJavascript("window.qqRender(${JSONObject.quote(json)});", null)
    }

    private fun renderList(locations: List<MapLocation>) {
        listContainer.removeAllViews()
        if (locations.isEmpty()) {
            showMessage("No offices available yet.")
            return
        }
        locations.forEach { loc -> listContainer.addView(createLocationRow(loc)) }
    }

    private fun showMessage(message: String) {
        listContainer.removeAllViews()
        val dp = { v: Int -> (v * resources.displayMetrics.density).toInt() }
        listContainer.addView(TextView(requireContext()).apply {
            text = message
            setTextColor(Color.parseColor("#6B7280"))
            textSize = 13f
            setPadding(0, dp(12), 0, dp(12))
        })
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

        val name = TextView(ctx).apply {
            text = loc.name
            setTextColor(Color.parseColor("#111827"))
            textSize = 14f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        }

        val detail = TextView(ctx).apply {
            text = "${loc.type}  ·  ${loc.queueCount} waiting  ·  ~${loc.waitMin} min"
            setTextColor(Color.parseColor("#6B7280"))
            textSize = 12f
        }

        info.addView(name)
        info.addView(detail)

        row.addView(dot)
        row.addView(info)
        return row
    }
}
