package com.example.quickqueue

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SwitchCompat
import androidx.appcompat.widget.Toolbar
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.example.quickqueue.network.NotificationStore
import com.example.quickqueue.network.QueueRepository
import com.example.quickqueue.network.StoredNotification
import com.example.quickqueue.network.UserSession
import com.google.android.material.button.MaterialButton
import com.google.android.material.progressindicator.CircularProgressIndicator
import com.google.android.material.textfield.TextInputEditText
import kotlinx.coroutines.launch
import java.util.Calendar

class BranchDetailActivity : AppCompatActivity() {

    /* intent extras */
    private var officeId   = 0L
    private var officeName = ""
    private var officeType = ""
    private var category   = ""
    private var address    = ""
    private var phone      = ""
    private var queueCount = 0
    private var waitMin    = 0

    /* views */
    private lateinit var tvName:          TextView
    private lateinit var tvTypeBadge:     TextView
    private lateinit var tvStars:         TextView
    private lateinit var tvStatusBadge:   TextView
    private lateinit var tvPeopleCount:   TextView
    private lateinit var tvWaitTime:      TextView
    private lateinit var tvAddress:       TextView
    private lateinit var tvPhone:         TextView
    private lateinit var cardBookingType: View
    private lateinit var tabJoinNow:      TextView
    private lateinit var tabAdvance:      TextView
    private lateinit var sectionDatePicker: View
    private lateinit var dateChipsContainer: LinearLayout
    private lateinit var timeSlotsContainer: LinearLayout
    private lateinit var priorityGroup:   RadioGroup
    private lateinit var radioRegular:    RadioButton
    private lateinit var cardIdVerification: View
    private lateinit var spinnerIdType:   Spinner
    private lateinit var editIdNumber:    TextInputEditText
    private lateinit var spinnerService:  Spinner
    private lateinit var progressQueue:   CircularProgressIndicator
    private lateinit var tvLiveCount:     TextView
    private lateinit var switchNotif:     SwitchCompat
    private lateinit var btnJoin:         MaterialButton

    /* state */
    private var bookingType   = "now"
    private var priority      = "regular"
    private var selectedDate  = ""
    private var selectedTime  = ""
    private var serviceType   = ""
    private var idTypeVal     = ""
    private var idNumberVal   = ""

    private val dateChipViews = mutableListOf<TextView>()
    private val timeChipViews = mutableListOf<TextView>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_branch_detail)

        readExtras()
        bindViews()
        setupToolbar()
        setupHeader()
        setupBookingTypeCard()
        setupPriorityGroup()
        setupServiceSpinner()
        setupLiveQueue()
        setupJoinButton()
    }

    private fun readExtras() {
        officeId   = intent.getLongExtra("office_id", 0L)
        officeName = intent.getStringExtra("office_name") ?: ""
        officeType = intent.getStringExtra("office_type") ?: ""
        category   = intent.getStringExtra("office_category") ?: ""
        address    = intent.getStringExtra("office_address") ?: ""
        phone      = intent.getStringExtra("office_phone") ?: ""
        queueCount = intent.getIntExtra("queue_count", 0)
        waitMin    = intent.getIntExtra("wait_min", 0)
    }

    private fun bindViews() {
        tvName             = findViewById(R.id.tvName)
        tvTypeBadge        = findViewById(R.id.tvTypeBadge)
        tvStars            = findViewById(R.id.tvStars)
        tvStatusBadge      = findViewById(R.id.tvStatusBadge)
        tvPeopleCount      = findViewById(R.id.tvPeopleCount)
        tvWaitTime         = findViewById(R.id.tvWaitTime)
        tvAddress          = findViewById(R.id.tvAddress)
        tvPhone            = findViewById(R.id.tvPhone)
        cardBookingType    = findViewById(R.id.cardBookingType)
        tabJoinNow         = findViewById(R.id.tabJoinNow)
        tabAdvance         = findViewById(R.id.tabAdvance)
        sectionDatePicker  = findViewById(R.id.sectionDatePicker)
        dateChipsContainer = findViewById(R.id.dateChipsContainer)
        timeSlotsContainer = findViewById(R.id.timeSlotsContainer)
        priorityGroup      = findViewById(R.id.priorityGroup)
        radioRegular       = findViewById(R.id.radioRegular)
        cardIdVerification = findViewById(R.id.cardIdVerification)
        spinnerIdType      = findViewById(R.id.spinnerIdType)
        editIdNumber       = findViewById(R.id.editIdNumber)
        spinnerService     = findViewById(R.id.spinnerService)
        progressQueue      = findViewById(R.id.progressQueue)
        tvLiveCount        = findViewById(R.id.tvLiveCount)
        switchNotif        = findViewById(R.id.switchNotifications)
        btnJoin            = findViewById(R.id.btnJoin)
    }

    private fun setupToolbar() {
        val toolbar = findViewById<Toolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = ""
        toolbar.setNavigationOnClickListener { finish() }
        findViewById<TextView>(R.id.tvToolbarTitle).text = officeName
    }

    private fun setupHeader() {
        tvName.text = officeName
        tvTypeBadge.text = officeType.ifBlank { category }.uppercase()

        val stars = when { queueCount >= 15 -> 2; queueCount >= 6 -> 3; else -> 5 }
        tvStars.text = "★".repeat(stars) + "☆".repeat(5 - stars)

        when {
            queueCount >= 15 -> { tvStatusBadge.text = "🔴 Long Wait";  tvStatusBadge.setTextColor(Color.parseColor("#FCA5A5")) }
            queueCount >= 6  -> { tvStatusBadge.text = "🟡 Moderate";   tvStatusBadge.setTextColor(Color.parseColor("#FDE68A")) }
            else             -> { tvStatusBadge.text = "🟢 Low Wait";   tvStatusBadge.setTextColor(Color.parseColor("#86EFAC")) }
        }

        tvPeopleCount.text = queueCount.toString()
        tvWaitTime.text    = waitMin.toString()

        if (address.isNotBlank()) { tvAddress.text = address; tvAddress.visibility = View.VISIBLE }
        if (phone.isNotBlank())   { tvPhone.text   = phone;   tvPhone.visibility   = View.VISIBLE }
    }

    /* ── Booking Type ── */

    private fun setupBookingTypeCard() {
        val showTabs = category.contains("hospital", ignoreCase = true) ||
                       category.contains("gov", ignoreCase = true) ||
                       officeType.contains("hospital", ignoreCase = true) ||
                       officeType.contains("gov", ignoreCase = true)

        if (showTabs) {
            cardBookingType.visibility = View.VISIBLE
            tabJoinNow.setOnClickListener { selectBookingType("now") }
            tabAdvance.setOnClickListener { selectBookingType("advance") }
            selectBookingType("now")
            buildDateChips()
            buildTimeSlots()
        }
    }

    private fun selectBookingType(type: String) {
        bookingType = type
        val isAdvance = type == "advance"
        tabJoinNow.apply {
            setBackgroundColor(if (!isAdvance) Color.WHITE else Color.TRANSPARENT)
            setTextColor(if (!isAdvance) Color.parseColor("#2563EB") else Color.parseColor("#6B7280"))
            elevation = if (!isAdvance) dp(2).toFloat() else 0f
        }
        tabAdvance.apply {
            setBackgroundColor(if (isAdvance) Color.WHITE else Color.TRANSPARENT)
            setTextColor(if (isAdvance) Color.parseColor("#2563EB") else Color.parseColor("#6B7280"))
            elevation = if (isAdvance) dp(2).toFloat() else 0f
        }
        sectionDatePicker.visibility = if (isAdvance) View.VISIBLE else View.GONE
        if (!isAdvance) { selectedDate = ""; selectedTime = "" }
        updateJoinButton()
    }

    private fun buildDateChips() {
        dateChipsContainer.removeAllViews()
        dateChipViews.clear()
        val cal = Calendar.getInstance()
        val dayNames   = arrayOf("Sun","Mon","Tue","Wed","Thu","Fri","Sat")
        val monthNames = arrayOf("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec")
        repeat(14) {
            cal.add(Calendar.DAY_OF_MONTH, 1)
            val key   = "${cal.get(Calendar.YEAR)}-${cal.get(Calendar.MONTH)}-${cal.get(Calendar.DAY_OF_MONTH)}"
            val label = "${dayNames[cal.get(Calendar.DAY_OF_WEEK)-1]}\n${cal.get(Calendar.DAY_OF_MONTH)}\n${monthNames[cal.get(Calendar.MONTH)]}"
            val chip  = makeDateChip(label, key)
            chip.tag  = key
            dateChipsContainer.addView(chip)
            dateChipViews.add(chip)
            (chip.layoutParams as LinearLayout.LayoutParams).marginEnd = dp(8)
        }
    }

    private fun makeDateChip(label: String, key: String): TextView {
        return TextView(this).apply {
            text  = label
            textSize = 11f
            gravity = Gravity.CENTER
            setTextColor(Color.parseColor("#374151"))
            setBackgroundResource(R.drawable.bg_chip)
            val p = dp(10)
            setPadding(p, dp(8), p, dp(8))
            layoutParams = LinearLayout.LayoutParams(dp(52), LinearLayout.LayoutParams.WRAP_CONTENT)
            setOnClickListener {
                selectedDate = if (selectedDate == key) "" else key
                refreshDateChips()
                updateJoinButton()
            }
        }
    }

    private fun refreshDateChips() {
        dateChipViews.forEach { chip ->
            val isActive = chip.tag == selectedDate
            chip.setBackgroundResource(if (isActive) R.drawable.bg_chip_active else R.drawable.bg_chip)
            chip.setTextColor(if (isActive) Color.WHITE else Color.parseColor("#374151"))
        }
    }

    private fun buildTimeSlots() {
        timeSlotsContainer.removeAllViews()
        timeChipViews.clear()
        val slots = listOf("8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM")
        var row: LinearLayout? = null
        slots.forEachIndexed { i, time ->
            if (i % 3 == 0) {
                row = LinearLayout(this).apply {
                    orientation = LinearLayout.HORIZONTAL
                    layoutParams = LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                    ).apply { bottomMargin = dp(8) }
                }
                timeSlotsContainer.addView(row)
            }
            val chip = makeTimeChip(time)
            chip.layoutParams = LinearLayout.LayoutParams(0, dp(40), 1f).apply { marginEnd = if (i % 3 < 2) dp(8) else 0 }
            row!!.addView(chip)
            timeChipViews.add(chip)
        }
    }

    private fun makeTimeChip(time: String): TextView {
        return TextView(this).apply {
            text = time
            textSize = 12f
            gravity = Gravity.CENTER
            setTextColor(Color.parseColor("#374151"))
            setBackgroundResource(R.drawable.bg_chip)
            setOnClickListener {
                selectedTime = if (selectedTime == time) "" else time
                timeChipViews.forEach { c ->
                    val active = c.text == selectedTime
                    c.setBackgroundResource(if (active) R.drawable.bg_chip_active else R.drawable.bg_chip)
                    c.setTextColor(if (active) Color.WHITE else Color.parseColor("#374151"))
                }
                updateJoinButton()
            }
        }
    }

    /* ── Priority Queue ── */

    private fun setupPriorityGroup() {
        priorityGroup.setOnCheckedChangeListener { _, checkedId ->
            priority = when (checkedId) {
                R.id.radioPwd      -> "pwd"
                R.id.radioSenior   -> "senior"
                R.id.radioPregnant -> "pregnant"
                else               -> "regular"
            }
            val showId = priority != "regular"
            cardIdVerification.visibility = if (showId) View.VISIBLE else View.GONE
            if (showId) setupIdTypeSpinner(priority)
            idTypeVal = ""; idNumberVal = ""
            updateJoinButton()
        }
        editIdNumber.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) { idNumberVal = s?.toString() ?: ""; updateJoinButton() }
            override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
            override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
        })
    }

    private fun setupIdTypeSpinner(prio: String) {
        val items = when (prio) {
            "pwd"      -> listOf("Select ID type…", "PWD ID", "PWD Booklet", "Medical Certificate")
            "senior"   -> listOf("Select ID type…", "Senior Citizen ID", "OSCA ID", "Gov't-issued ID with birthdate")
            "pregnant" -> listOf("Select ID type…", "Pregnancy Record / Prenatal Booklet", "Medical Certificate")
            else       -> listOf("Select ID type…")
        }
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, items)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerIdType.adapter = adapter
        spinnerIdType.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(p: AdapterView<*>?, v: View?, pos: Int, id: Long) {
                idTypeVal = if (pos == 0) "" else items[pos]
                updateJoinButton()
            }
            override fun onNothingSelected(p: AdapterView<*>?) {}
        }
    }

    /* ── Service Type ── */

    private fun setupServiceSpinner() {
        val items = mutableListOf("Select a service…") + getServiceTypes(officeType)
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, items)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerService.adapter = adapter
        spinnerService.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(p: AdapterView<*>?, v: View?, pos: Int, id: Long) {
                serviceType = if (pos == 0) "" else items[pos]
                updateJoinButton()
            }
            override fun onNothingSelected(p: AdapterView<*>?) {}
        }
    }

    /* ── Live Queue ── */

    private fun setupLiveQueue() {
        tvLiveCount.text = queueCount.toString()
        val pct = minOf(queueCount * 100 / 20, 100)
        progressQueue.progress = pct
        val color = when {
            queueCount >= 15 -> Color.parseColor("#EF4444")
            queueCount >= 6  -> Color.parseColor("#EAB308")
            else             -> Color.parseColor("#22C55E")
        }
        progressQueue.setIndicatorColor(color)
    }

    /* ── Join Button ── */

    private fun setupJoinButton() {
        updateJoinButton()
        btnJoin.setOnClickListener { handleJoin() }
    }

    private fun updateJoinButton() {
        val canJoin = serviceType.isNotEmpty() &&
                (priority == "regular" || (idTypeVal.isNotEmpty() && idNumberVal.trim().isNotEmpty())) &&
                (bookingType == "now" || (selectedDate.isNotEmpty() && selectedTime.isNotEmpty()))

        btnJoin.isEnabled = canJoin

        btnJoin.text = when {
            priority != "regular" -> "✅ Confirm Priority Queue"
            bookingType == "advance" -> "📅 Confirm Booking"
            else -> "🎟️ Join Virtual Queue"
        }
    }

    private fun handleJoin() {
        btnJoin.isEnabled = false
        btnJoin.text = "Processing…"

        lifecycleScope.launch {
            val userId = UserSession.resolveUserId(this@BranchDetailActivity)
            if (userId == null) {
                Toast.makeText(this@BranchDetailActivity, "Session expired. Please log in again.", Toast.LENGTH_LONG).show()
                btnJoin.isEnabled = true
                updateJoinButton()
                return@launch
            }

            QueueRepository.joinQueue(userId, officeId)
                .onSuccess { ticket ->
                    NotificationStore.save(this@BranchDetailActivity, StoredNotification(
                        id = System.currentTimeMillis(),
                        type = "blue", icon = "🎟",
                        title = "Queue joined!",
                        subtitle = "Ticket ${ticket.ticketNumber} at $officeName. We'll notify you when your turn is near.",
                        timeMillis = System.currentTimeMillis(),
                        isRead = false
                    ))
                    Toast.makeText(
                        this@BranchDetailActivity,
                        "🎉 Ticket ${ticket.ticketNumber} confirmed!",
                        Toast.LENGTH_LONG
                    ).show()
                    finish()
                }
                .onFailure { error ->
                    Toast.makeText(
                        this@BranchDetailActivity,
                        error.message ?: "Could not join the queue.",
                        Toast.LENGTH_LONG
                    ).show()
                    btnJoin.isEnabled = true
                    updateJoinButton()
                }
        }
    }

    /* ── Helpers ── */

    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

    private fun getServiceTypes(type: String): List<String> {
        val t = type.uppercase()
        return when {
            t.contains("BANK") || t.contains("FINANCE")       -> listOf("Teller","New Account Opening","Loan Inquiry","Card Services","Cash Deposit / Withdrawal")
            t.contains("HOSPITAL")                             -> listOf("General Consultation","Emergency","OPD – Cardiology","OPD – Pediatrics","Laboratory","Pharmacy")
            t.contains("DENTAL")                               -> listOf("Consultation","Cleaning","Extraction","Orthodontics")
            t.contains("CLINIC") || t.contains("MEDICAL")     -> listOf("General Consultation","Laboratory","Pharmacy")
            t.contains("GOV")                                  -> listOf("Birth Certificate","ID Application / Renewal","License Renewal","Business Permit","Civil Registry")
            t.contains("UTIL")                                 -> listOf("Bill Payment","New Connection","Reconnection","Transfer of Account")
            t.contains("TELECOM")                              -> listOf("Billing Concern","Plan Upgrade","SIM Replacement","Device Inquiry")
            else                                               -> listOf("Customer Service","Information Desk","General Inquiry")
        }
    }
}
