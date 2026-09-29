# Security Specification: CitaPro MX Firestore ABAC

## 1. Data Invariants
- **Affiliates Collection (`/affiliates/{affiliateId}`)**:
  - Anyone can read/list affiliate profiles (public business directory).
  - Writing requires an authenticated affiliate owner matching `request.auth.uid` or new creation.
  - Plan updates and verification badges can only be modified through authorized flows.
  - Strings cannot exceed size thresholds (max 1000 chars for descriptions, 128 for names).
- **Appointments Collection (`/appointments/{appointmentId}`)**:
  - Clients can create an appointment if required fields are provided (valid date, time, clientPhone, affiliateId).
  - Appointments can be read by the associated affiliate or by the client with the matching phone or appointment ID.
  - Cancellations and rescheduling must respect the refund policies (50% refund if >24h, 0% if <=24h).
  - Terminal statuses (`cancelled`, `completed`) cannot be mutated except for legitimate notes.
- **Reviews Collection (`/reviews/{reviewId}`)**:
  - Rating must be between 1 and 5.
  - Reviews require a valid appointment reference.

## 2. The Dirty Dozen Payloads (Security Attack Vectors)
1. **P1 (Shadow Field Injection)**: Creating an affiliate with `isVerified: true` or `isTurbo: true` without payment.
2. **P2 (ID Poisoning)**: Document ID with 10KB junk string or SQL injection chars.
3. **P3 (Price Tampering)**: Setting `servicePrice: -500` or modifying `paidAmount` to zero.
4. **P4 (PII Exfiltration)**: Blanket listing of all appointments across all affiliates without filters.
5. **P5 (Unrestricted Deletion)**: A random client deleting an affiliate document.
6. **P6 (Terminal State Bypass)**: Changing a `completed` appointment back to `pending`.
7. **P7 (Impersonation Write)**: An unauthenticated attacker modifying another affiliate's working hours.
8. **P8 (Denial of Wallet)**: Injecting 2MB payload into the `description` or `internalNotes` field.
9. **P9 (Self-Assigned Admin)**: Client setting `isAdmin: true` in auth claims or profile.
10. **P10 (Negative Refund Exploitation)**: Overwriting `refundAmount` to an arbitrary high value.
11. **P11 (Review Flooding)**: Creating reviews without an associated valid appointment ID.
12. **P12 (Orphan Appointment Creation)**: Booking an appointment targeting a non-existent affiliate ID.

## 3. Test Runner
Rules are validated using Firestore Rules Emulator and Security Rules specifications ensuring zero update gaps and zero unauthorized reads.
