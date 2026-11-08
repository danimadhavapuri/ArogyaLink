# 🚀 ArogyaLink Portal — Deployment & Reviewer Guide

**Diagnostic Lab Automated Report-Delivery Portal for Patients and Referring Doctors**  
*Coastal Andhra Pradesh Diagnostic Network • Vijayawada (6 Labs & 38 Collection Centres)*  
*Compliance: Digital Personal Data Protection (DPDP) Act 2023 | NABL Clinical Guidelines*  
*Public Repository: [https://github.com/danimadhavapuri/ArogyaLink.git](https://github.com/danimadhavapuri/ArogyaLink.git)*  
*Live Application URL: [https://arogyalink-sc22.onrender.com](https://arogyalink-sc22.onrender.com)*

---

## 1. System Requirements & Prerequisites

- **Node.js**: `v18.0.0` or higher (tested on `v20.x` and `v24.x`)
- **Package Manager**: `npm` (v9+) or `pnpm`
- **Operating System**: Windows, macOS, or Linux
- **Web Browser**: Chrome, Edge, Safari, or Firefox

---

## 2. Step-by-Step Local Setup & Execution

### Step A: Clone the Repository
```bash
git clone https://github.com/danimadhavapuri/ArogyaLink.git
cd ArogyaLink
```

### Step B: Install Root & Client Dependencies
```bash
# 1. Install root dependencies (Express, CORS, Concurrently)
npm install

# 2. Install client dependencies (React, Vite, Tailwind CSS, Lucide Icons)
npm install --prefix client
```

### Step C: Run Full-Stack Application
Start both the Express backend API and Vite React frontend concurrently with a single command:
```bash
npm run dev
```

> **Services Started:**
> - 🌐 **Frontend Client**: [http://localhost:5173](http://localhost:5173)
> - 🚀 **Backend REST API**: [http://localhost:5000](http://localhost:5000)
> - 🏥 **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

*(Optional: Run in separate terminals if preferred)*
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run client
```

---

## 3. Environment Variables (Names Only)

Per security guidelines, the application operates with safe fallback defaults for zero-configuration local review. For staging and production deployments, the system reads the following environment variable names (names only, no secrets committed):

- `PORT` : Port on which the Express backend listens
- `NODE_ENV` : Application environment (`development` | `production`)
- `HMAC_SECRET` : Secret key used to generate and verify 72-hour signed expiring links
- `TOKEN_EXPIRY_HOURS` : Regulatory retention window (Default: 72)
- `DOCTOR_ACCESS_DAYS` : Referring clinician consultation access window (Default: 90)
- `CLIENT_URL` : Allowed CORS origin for the React client

---

## 4. How It Is Deployed (Cloud Deployment Steps)

The application is structured for instant containerized or PaaS cloud deployment (e.g. Render, Railway, or AWS):

### Option 1: Monolithic PaaS Deployment (Render / Railway)
1. Link your GitHub repository (`https://github.com/danimadhavapuri/ArogyaLink.git`).
2. Set **Build Command**:
   ```bash
   npm install && npm install --prefix client && npm run build --prefix client
   ```
3. Set **Start Command**:
   ```bash
   node server/index.js
   ```
4. Configure environment variable names: `NODE_ENV=production`, `PORT=10000`, and `HMAC_SECRET`.

### Option 2: Split Static Client + API
- **Backend (Render / Railway)**: Deploys `server/index.js` as a Web Service.
- **Frontend (Vercel / Netlify)**: Deploys `client/` directory with build command `npm run build` and output directory `client/dist`.

---

## 5. Reviewer Demo Accounts & 1-Click Credentials

For reviewer convenience, the sign-in cards for both Doctor and Staff consoles feature **1-Click Quick Fill Credentials** buttons that populate the login forms instantly.

### 🩺 A. Referring Clinician Accounts
| Doctor Name | Email | Password | Specialization & Clinical Focus |
| :--- | :--- | :--- | :--- |
| **Dr. S. Ramanaiah** | `ramanaiah@arogyalink.in` | `doctor123` | General Physician • Coastal Health Clinic |
| **Dr. P. Anitha** | `anitha@arogyalink.in` | `doctor123` | Cardiologist • Coastal Heart Care |
| **Dr. K. Suresh** | `suresh@arogyalink.in` | `doctor123` | Nephrologist • AP Kidney Institute |

*Doctor Experience Features:*
- Strict patient data isolation: Clinicians view only their referred patients.
- 90-day clinical consultation regulatory window.
- In-modal full report viewer (preserves doctor portal context).

### 🏢 B. Front-Desk Staff Operations Account
| Staff Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Operations Supervisor** | `staff@arogyalink.in` | `staff123` | Central Diagnostic Hub, Vijayawada |

*Staff Console Features:*
- **Patient Search & Dispatch**: Real-time search across Name, Order ID, Mobile, or Test Parameter.
- **Triage Status Filters**: Instant filtering for `Ready`, `Processing`, and `🚨 Critical` with priority sorting.
- **Doctor Portfolios & Rosters**: View all 3 doctor rosters and send WhatsApp/SMS reminders.
- **🚨 Urgent Doctor Callbacks**: Track panic values, confirm doctor contacted, log clinical notes.
- **Pathologist Audit Queue**: Chief Pathologist sign-off station (50 summaries/week quota).
- **DPDP 2023 Statutory Audit Logs**: Immutable chronological record of report decryptions and access events.
- **1-Click LIS Batch Import**: Ingest daily diagnostic CSV spreadsheets.

### 📱 C. Patient SMS Expiring Link Simulator
- Click **📱 Test Patient SMS Link** in the top navigation bar.
- Test scenarios:
  1. **Lakshmi Prasanna K** (`ORD-71204`) — Mildly low Haemoglobin (10.2 g/dL), Telugu/Tenglish AI summary.
  2. **Venkata Rao M** (`ORD-71219`) — Borderline LDL Cholesterol (142 mg/dL), dietary lifestyle tips.
  3. **🚨 Farzana Begum** (`ORD-71233`) — **Critical Panic Value (Potassium 6.8 mmol/L)**. *Routine AI summary withheld; immediate emergency banner and hospital callback initiated.*
  4. **Subba Rao K** (`ORD-71240`) — Elevated Fasting Blood Sugar (Glucose 168 mg/dL).
  5. **Anuradha Devi P** (`ORD-71245`) — Thyroid Function Test (TSH 6.4 uIU/mL).
  6. **Kiran Kumar B** (`ORD-71250`) — Platelet Count (180,000 /uL Dengue Care).
- **Patient OTP Code**: Enter any 4-digit code (e.g. `1234`) or click the **⚡ Auto-Fill Demo OTP** button.

---

## 6. Automated Test Suite Execution

Run the official automated test suite validating 72h token expiry, mobile OTP authentication, and the critical Potassium safety intercept:

```bash
# Run Node.js Native Test Runner (Step 6.1)
node --test tests/api.test.js

# Or via npm script
npm test
```

**Expected Test Output:**
```
✔ Step 6.1 - Automated Test Suite: ArogyaLink Portal Core Services
  ✔ Security: Generate valid 72-hour signed expiring token
  ✔ Security: Reject tampered or forged HMAC tokens
  ✔ Compliance: Record and mask personal phone in audit logs
  ✔ Clinical Safety: Intercept critical panic values (Potassium 6.8)
  ✔ AI Summary: Generate multi-lingual guidance for out-of-range value (Haemoglobin 10.2)
  ✔ Auth: Authenticate Doctor with valid credentials
  ✔ Auth: Authenticate Staff with valid credentials
  ✔ Auth: Reject incorrect password
  ✔ Auth: Register new referring doctor and verify profile
  ✔ Isolation: Doctor only sees their referred patients
  ✔ LIS CSV: Parse batch CSV format correctly
ℹ tests 11
ℹ suites 1
ℹ pass 11
ℹ fail 0
```
