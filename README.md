# 🏥 ArogyaLink — Diagnostic Lab Report-Delivery Portal
**Modern, Secure & DPDP Act 2023 Compliant Diagnostic Portal for Patients and Referring Doctors**  
*Coastal Andhra Pradesh Diagnostic Chain (Vijayawada • 6 Labs & 38 Centres)*  
*Built for the Isocode Labs Software Engineering Take-Home Task*

---

## 🌟 Key Capabilities

1. **🔒 72-Hour Expiring Links & Mobile OTP Authentication**:
   - Cryptographically signed HMAC-SHA256 URLs that expire in 72 hours per India's DPDP Act 2023.
   - 2-factor OTP verification gate with masked mobile numbers (`+91 98765 *****`).
2. **🚨 Clinical Panic Value Safety Intercept (#1 Safety Rule)**:
   - Routine AI summaries are immediately withheld for life-threatening results (e.g. Potassium 6.8 mmol/L).
   - High-contrast emergency banner prompts immediate clinical attention.
   - Auto-generates an urgent callback task on the Front-Desk console for the referring doctor.
3. **🤖 Multilingual AI Clinical Assistant in 26+ Indian Languages**:
   - Translates complex diagnostic parameters into simple plain language in Telugu, English, Hindi, Tenglish, Hinglish, Tamil, Kannada, and 20+ other regional languages.
   - In-app doubt chat resolves patient questions safely within the secure sandbox.
4. **🩺 Isolated Referring Doctor Portal (90-Day Clinical Window)**:
   - Dedicated sign-in and sign-up for Dr. S. Ramanaiah, Dr. P. Anitha, and Dr. K. Suresh.
   - Strict clinician data privacy: Doctors view only their referred patients.
   - In-modal full report viewer and 90-day active window tracking.
5. **🏢 Front-Desk Operations & Compliance Console**:
   - Real-time patient search by Name, Order ID, Mobile, or Test Parameter.
   - Priority status filters (`Ready`, `Processing`, `🚨 Critical`).
   - 1-Click "Resend Expiring Link" with live WhatsApp/SMS preview.
   - Doctor Portfolios & Rosters supervision station.
   - Closed-loop Chief Pathologist Audit Queue (50 summaries/week quota).
   - Immutable DPDP Act 2023 access audit log table.
   - 1-Click LIS bulk CSV batch import.
6. **✨ Aesthetic Medical Aurora & Glassmorphic UI**:
   - Animated ambient medical gradient mesh and floating background glows.
   - Glassmorphic panels with smooth elevation transitions on hover.

---

## 🚀 Quick Start (Local Run)

```bash
# 1. Clone repository
git clone https://github.com/danimadhavapuri/ArogyaLink.git
cd ArogyaLink

# 2. Install dependencies
npm install
npm install --prefix client

# 3. Start full-stack app (Server + Client concurrently)
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Automated Test Suite (Step 6.1)

Run the automated test runner validating token expiry, OTP security, doctor isolation, and the critical Potassium safety intercept:

```bash
node --test tests/api.test.js
```
*(All 11 tests pass with 0 failures)*

---

## 📖 Complete Documentation
- **Deployment & Reviewer Instructions**: [`deployment.md`](./deployment.md)
- **Full Architecture & Technical Design Document**: [`TECHNICAL_DESIGN_DOCUMENT.md`](./TECHNICAL_DESIGN_DOCUMENT.md)
