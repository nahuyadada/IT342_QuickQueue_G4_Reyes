package com.example.demo.config;

import com.example.demo.auth.model.User;
import com.example.demo.auth.repository.UserRepository;
import com.example.demo.queue.facade.QueueFacade;
import com.example.demo.office.dto.OfficeRegistrationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final QueueFacade queueFacade;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.findByEmail("admin@example.com").isEmpty()) {
            seedData();
        }
    }

    private void seedData() {
        System.out.println("Seeding database with sample data...");

        // ── Admin account ──
        User admin = new User();
        admin.setName("Admin User");
        admin.setEmail("admin@example.com");
        admin.setPassword(passwordEncoder.encode("password123"));
        admin.setRole(User.Role.ADMIN);
        userRepository.save(admin);

        // ── Sample customer accounts ──
        User alice = new User();
        alice.setName("Alice Smith");
        alice.setEmail("alice@example.com");
        alice.setPassword(passwordEncoder.encode("password123"));
        alice.setRole(User.Role.USER);
        userRepository.save(alice);

        User bob = new User();
        bob.setName("Bob Jones");
        bob.setEmail("bob@example.com");
        bob.setPassword(passwordEncoder.encode("password123"));
        bob.setRole(User.Role.USER);
        userRepository.save(bob);

        // ── Partner accounts & Service Offices ──
        // Each partner owns one service office/branch.
        // Email pattern: Partner4@gmail.com .. Partner25@gmail.com
        // Password: gwapo123

        // ═══════════════════════════════════════════
        //  BANKS (5)
        // ═══════════════════════════════════════════

        // Partner4 — HSBC Philippines
        User partner4 = createPartner("HSBC Philippines", "Partner4@gmail.com", 4);
        registerAndApprove(partner4, "HSBC Philippines", "Bank & Finance", "BANKING",
                "Masbate Rd, Cebu City, 6000 Cebu, Philippines",
                10.3158, 123.8854, "+63 32 231 1234");

        // Partner5 — UnionBank of the Philippines - Cebu IT Park
        User partner5 = createPartner("UnionBank IT Park", "Partner5@gmail.com", 5);
        registerAndApprove(partner5, "UnionBank of the Philippines - Cebu IT Park", "Bank & Finance", "BANKING",
                "G/F Unit GF 01, TG Tower, Asiatown, Apas, Cebu City, Cebu, Philippines",
                10.3310, 123.9065, "+63 32 232 2345");

        // Partner6 — BPI Cebu Main Branch
        User partner6 = createPartner("BPI Cebu Main", "Partner6@gmail.com", 6);
        registerAndApprove(partner6, "BPI Cebu Main Branch", "Bank & Finance", "BANKING",
                "Corner Magallanes and P. Burgos St, Cebu City, 6000 Cebu, Philippines",
                10.2963, 123.9020, "+63 32 255 3456");

        // Partner7 — Philippine Savings Bank - Cebu Uptown
        User partner7 = createPartner("PSBank Cebu Uptown", "Partner7@gmail.com", 7);
        registerAndApprove(partner7, "Philippine Savings Bank - Cebu Uptown", "Bank & Finance", "BANKING",
                "Insular Life Cebu Business Centre, Cebu City, Philippines",
                10.3175, 123.9050, "+63 32 233 4567");

        // Partner8 — UnionBank Insular Building
        User partner8 = createPartner("UnionBank Insular", "Partner8@gmail.com", 8);
        registerAndApprove(partner8, "UnionBank Insular Building", "Bank & Finance", "BANKING",
                "Mindanao Ave corner Biliran Rd, Cebu City, Philippines",
                10.3178, 123.9055, "+63 32 234 5678");

        // ═══════════════════════════════════════════
        //  DENTAL CLINICS (5)
        // ═══════════════════════════════════════════

        // Partner9 — Affinity Dental Clinics Cebu
        User partner9 = createPartner("Affinity Dental", "Partner9@gmail.com", 9);
        registerAndApprove(partner9, "Affinity Dental Clinics Cebu", "Dental Clinic", "DENTAL",
                "eBloc 2 Tower, IT Park, Cebu City, Philippines",
                10.3310, 123.9068, "+63 32 412 1234");

        // Partner10 — D&G Dental Clinic
        User partner10 = createPartner("D&G Dental", "Partner10@gmail.com", 10);
        registerAndApprove(partner10, "D&G Dental Clinic", "Dental Clinic", "DENTAL",
                "Dionisio Jakosalem St, Cebu City, Philippines",
                10.3085, 123.8948, "+63 32 413 2345");

        // Partner11 — Cebu Dental Care Center
        User partner11 = createPartner("Cebu Dental Care", "Partner11@gmail.com", 11);
        registerAndApprove(partner11, "Cebu Dental Care Center", "Dental Clinic", "DENTAL",
                "St. Patrick Square, R. Aboitiz St, Cebu City, Philippines",
                10.3140, 123.8935, "+63 32 414 3456");

        // Partner12 — Metro Dental SM City Cebu
        User partner12 = createPartner("Metro Dental SM", "Partner12@gmail.com", 12);
        registerAndApprove(partner12, "Metro Dental SM City Cebu", "Dental Clinic", "DENTAL",
                "SM City Cebu, North Reclamation Area, Mabolo, Cebu City",
                10.3115, 123.9189, "+63 32 415 4567");

        // Partner13 — Green Apple Dental Clinic Cebu
        User partner13 = createPartner("Green Apple Dental", "Partner13@gmail.com", 13);
        registerAndApprove(partner13, "Green Apple Dental Clinic Cebu", "Dental Clinic", "DENTAL",
                "Ayala Center Cebu Terraces, Cebu City, Philippines",
                10.3173, 123.9058, "+63 32 416 5678");

        // ═══════════════════════════════════════════
        //  HOSPITALS (4)
        // ═══════════════════════════════════════════

        // Partner14 — Cebu Doctors' University Hospital
        User partner14 = createPartner("Cebu Doctors Hospital", "Partner14@gmail.com", 14);
        registerAndApprove(partner14, "Cebu Doctors' University Hospital", "Hospital", "HOSPITAL",
                "Osmeña Blvd, Cebu City, 6000 Cebu, Philippines",
                10.3113, 123.8952, "+63 32 253 7511");

        // Partner15 — St. Vincent General Hospital Cebu
        User partner15 = createPartner("St. Vincent Hospital", "Partner15@gmail.com", 15);
        registerAndApprove(partner15, "St. Vincent General Hospital Cebu", "Hospital", "HOSPITAL",
                "R. Landon Ext, Cebu City, Philippines",
                10.3098, 123.8925, "+63 32 254 8622");

        // Partner16 — Adventist Hospital Cebu
        User partner16 = createPartner("Adventist Hospital", "Partner16@gmail.com", 16);
        registerAndApprove(partner16, "Adventist Hospital Cebu", "Hospital", "HOSPITAL",
                "Cebu City, Philippines",
                10.3180, 123.8850, "+63 32 255 9733");

        // Partner17 — VisayasMed Hospital
        User partner17 = createPartner("VisayasMed Hospital", "Partner17@gmail.com", 17);
        registerAndApprove(partner17, "VisayasMed Hospital", "Hospital", "HOSPITAL",
                "Osmeña Blvd, Cebu City, Philippines",
                10.3095, 123.8970, "+63 32 256 0844");

        // ═══════════════════════════════════════════
        //  GOVERNMENT OFFICES (4)
        // ═══════════════════════════════════════════

        // Partner18 — Cebu City Hall
        User partner18 = createPartner("Cebu City Hall", "Partner18@gmail.com", 18);
        registerAndApprove(partner18, "Cebu City Hall", "Government Office", "GOVERNMENT",
                "No. 1 Dr Jose P. Rizal St, Cebu City",
                10.2933, 123.9019, "+63 32 255 2811");

        // Partner19 — Office of the Building Official
        User partner19 = createPartner("Building Official", "Partner19@gmail.com", 19);
        registerAndApprove(partner19, "Office of the Building Official", "Government Office", "GOVERNMENT",
                "Cebu City Hall, Cebu City",
                10.2933, 123.9019, "+63 32 255 2812");

        // Partner20 — Human Resource Development Office Cebu City
        User partner20 = createPartner("HRDO Cebu City", "Partner20@gmail.com", 20);
        registerAndApprove(partner20, "Human Resource Development Office Cebu City", "Government Office", "GOVERNMENT",
                "Cebu City Hall Annex, Cebu City",
                10.2935, 123.9022, "+63 32 255 2813");

        // Partner21 — Public Services Office Cebu City
        User partner21 = createPartner("Public Services", "Partner21@gmail.com", 21);
        registerAndApprove(partner21, "Public Services Office Cebu City", "Government Office", "GOVERNMENT",
                "Ramos Area, Cebu City",
                10.3080, 123.8965, "+63 32 255 2814");

        System.out.println("Database seeding completed — 18 partners & service offices created.");
    }

    // ── Helper: Create a partner user account ──
    private User createPartner(String displayName, String email, int partnerNum) {
        User partner = new User();
        partner.setName(displayName);
        partner.setEmail(email);
        partner.setPassword(passwordEncoder.encode("gwapo123"));
        partner.setRole(User.Role.USER);
        return userRepository.save(partner);
    }

    // ── Helper: Register an office and immediately approve it ──
    private void registerAndApprove(User owner, String name, String category, String type,
                                     String address, double lat, double lng, String phone) {
        OfficeRegistrationRequest req = new OfficeRegistrationRequest();
        req.setName(name);
        req.setCategory(category);
        req.setType(type);
        req.setAddress(address);
        req.setLatitude(lat);
        req.setLongitude(lng);
        req.setPhoneNumber(phone);
        req.setBusinessHours("{\"Monday\":\"09:00 - 17:00\",\"Tuesday\":\"09:00 - 17:00\",\"Wednesday\":\"09:00 - 17:00\",\"Thursday\":\"09:00 - 17:00\",\"Friday\":\"09:00 - 17:00\",\"Saturday\":\"09:00 - 12:00\",\"Sunday\":\"Closed\"}");

        Map<String, Object> result = queueFacade.registerOffice(owner.getId(), req);
        queueFacade.approveOfficeRegistration(Long.valueOf(result.get("officeId").toString()));
        System.out.println("  ✅ " + name + " — owned by " + owner.getEmail());
    }
}
