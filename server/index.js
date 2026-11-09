import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getOrders,
  getOrderById,
  getOrdersByDoctor,
  addOrders,
  getCallbackTasks,
  addFlaggedSummary,
  getFlaggedSummaries,
  resolveFlaggedSummary,
  authenticateUser,
  registerUser,
  getAllDoctors
} from './data/store.js';
import { generateExpiringToken, verifyExpiringToken } from './services/tokenService.js';
import { recordAccessLog, fetchAllAuditLogs } from './services/auditService.js';
import { parseLISCSV } from './services/csvParser.js';
import { generateMultiLanguageSummary } from './services/aiSummaryService.js';
import { SUPPORTED_LANGUAGES, translateSummary, resolvePatientDoubt } from './services/translationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: 'text/csv' }));

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ArogyaLink Lab Report Delivery API',
    location: 'Vijayawada, Coastal Andhra Pradesh',
    timestamp: new Date().toISOString()
  });
});



// 2. Get All Orders
app.get('/api/orders', (req, res) => {
  const orders = getOrders();
  res.json({
    success: true,
    total: orders.length,
    data: orders
  });
});

// 3. Get Single Order by Order ID
app.get('/api/orders/:id', (req, res) => {
  const order = getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  res.json({ success: true, data: order });
});

// 4. Download Sample LIS CSV Template (For Front-Desk)
app.get('/api/orders/sample-csv', (req, res) => {
  const samplePath = path.join(__dirname, 'data', 'sample_lis_export.csv');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="sample_lis_export.csv"');
  fs.createReadStream(samplePath).pipe(res);
});

// 5. Import LIS CSV Batch
app.post('/api/orders/import-csv', (req, res) => {
  try {
    let csvData = null;

    if (typeof req.body === 'string' && req.body.trim()) {
      csvData = req.body;
    } else if (req.body && typeof req.body === 'object' && req.body.csv) {
      csvData = req.body.csv;
    }

    if (!csvData) {
      const samplePath = path.join(__dirname, 'data', 'sample_lis_export.csv');
      if (fs.existsSync(samplePath)) {
        csvData = fs.readFileSync(samplePath, 'utf-8');
      }
    }

    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'No CSV content provided and sample file was not found.'
      });
    }

    const parsedOrders = parseLISCSV(csvData);
    const result = addOrders(parsedOrders);

    res.json({
      success: true,
      message: `Successfully processed LIS batch: ${result.addedCount} new orders added.`,
      addedCount: result.addedCount,
      totalOrders: result.totalOrders,
      importedOrders: parsedOrders
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: 'Failed to parse LIS CSV file',
      error: err.message
    });
  }
});

// 6. Generate 72-Hour Expiring Link for an Order
app.post('/api/reports/generate-link', (req, res) => {
  const { orderId } = req.body;
  const order = getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const tokenData = generateExpiringToken(orderId);
  const portalUrl = `http://localhost:5173/report/${tokenData.token}`;

  res.json({
    success: true,
    orderId,
    patientName: order.patientName,
    patientPhone: order.patientPhone,
    token: tokenData.token,
    expiresAt: tokenData.expiresAt,
    portalUrl,
    mockSmsMessage: `ArogyaLink Vijayawada: Dear ${order.patientName}, your test report (${order.testName}) is signed and ready. Access it securely here: ${portalUrl} (Link expires in 72 hours).`
  });
});

// 7. Verify Expiring Token
app.get('/api/reports/verify-token/:token', (req, res) => {
  const verification = verifyExpiringToken(req.params.token);
  if (!verification.valid) {
    return res.status(400).json({
      success: false,
      expired: verification.expired || false,
      message: verification.error
    });
  }

  const order = getOrderById(verification.orderId);
  res.json({
    success: true,
    orderId: verification.orderId,
    expiresAt: verification.expiresAt,
    patientName: order ? order.patientName : null,
    maskedPhone: order ? order.patientPhone.replace(/\d{5}$/, '*****') : null
  });
});

// 8. Verify Mobile OTP to Unlock Full Report (Demo OTP: 1234)
app.post('/api/reports/verify-otp', (req, res) => {
  const { token, enteredOtp } = req.body;

  const verification = verifyExpiringToken(token);
  if (!verification.valid) {
    return res.status(400).json({
      success: false,
      message: verification.error || 'Token expired or invalid'
    });
  }

  const DEMO_OTP = '1234';
  if (enteredOtp !== DEMO_OTP) {
    return res.status(401).json({
      success: false,
      message: 'Invalid OTP. For demonstration, please use OTP: 1234'
    });
  }

  const order = getOrderById(verification.orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Report record not found' });
  }

  recordAccessLog({
    orderId: order.orderId,
    patientName: order.patientName,
    patientPhone: order.patientPhone,
    accessMethod: 'Patient Mobile OTP Authentication',
    ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    userAgent: req.headers['user-agent']
  });

  res.json({
    success: true,
    message: 'OTP verified successfully. Access granted.',
    data: order
  });
});

// 9. Get DPDP Audit Access Logs
app.get('/api/audit-logs', (req, res) => {
  const logs = fetchAllAuditLogs();
  res.json({
    success: true,
    total: logs.length,
    data: logs
  });
});

// 10. Get Multi-Language Clinical Summary for an Order
app.get('/api/reports/:id/summary', (req, res) => {
  const order = getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const summary = generateMultiLanguageSummary(order);
  res.json({
    success: true,
    data: {
      ...order,
      summary
    },
    summary,
    disclaimer: 'This summary is an educational aid and does not substitute for clinical advice from your referring doctor.'
  });
});

// 11. Get Urgent Callback Tasks (For Front-Desk Staff)
app.get('/api/callback-tasks', (req, res) => {
  const tasks = getCallbackTasks();
  res.json({
    success: true,
    total: tasks.length,
    data: tasks
  });
});

// 11b. Resolve an Urgent Callback Task
app.post('/api/callback-tasks/:id/resolve', (req, res) => {
  const tasks = getCallbackTasks();
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  task.status = 'Completed';
  task.resolvedAt = new Date().toISOString();
  task.resolvedBy = req.body.resolvedBy || 'Front-Desk Duty Officer';
  task.notes = req.body.notes || 'Referring Doctor contacted directly via priority hospital phone line.';

  res.json({
    success: true,
    message: 'Emergency callback task marked as completed.',
    data: task
  });
});

// 12. Get List of Supported Regional Languages
app.get('/api/languages', (req, res) => {
  res.json({
    success: true,
    languages: SUPPORTED_LANGUAGES
  });
});

// 13. On-Demand Regional Translation
app.post('/api/reports/:id/translate', async (req, res) => {
  const order = getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (order.isCritical) {
    return res.status(400).json({
      success: false,
      isCritical: true,
      message: 'Summary translation is suppressed for critical emergency values.'
    });
  }

  const { targetLanguage } = req.body;
  const translation = await translateSummary(order, targetLanguage || 'tenglish');

  res.json({
    success: true,
    data: translation
  });
});

// 14. In-App Patient Doubt Resolver
app.post('/api/reports/:id/ask-ai', async (req, res) => {
  try {
    const order = getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const { question, language } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a question' });
    }

    const response = await resolvePatientDoubt(order, question, language || 'tenglish');
    res.json({
      success: true,
      data: response
    });
  } catch (err) {
    console.error('Error in ask-ai:', err);
    res.status(500).json({ success: false, message: 'Failed to answer question: ' + err.message });
  }
});

// 15. Patient Flags a Summary (For Pathologist Quality Audit)
app.post('/api/reports/:id/flag', (req, res) => {
  try {
    const order = getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const { reason, patientComment } = req.body;
    const flag = addFlaggedSummary({
      orderId: order.orderId,
      patientName: order.patientName,
      parameter: order.parameter,
      result: `${order.result} ${order.unit}`,
      reason: reason || 'Unclear medical explanation',
      patientComment: patientComment || 'Patient requested clinical review'
    });

    res.json({
      success: true,
      message: 'Summary flagged for Pathologist weekly quality review.',
      data: flag
    });
  } catch (err) {
    console.error('Error in report flag:', err);
    res.status(500).json({ success: false, message: 'Failed to record flag: ' + err.message });
  }
});

// 16. Get Pathologist Weekly Review Queue
app.get('/api/pathologist/review-queue', (req, res) => {
  const queue = getFlaggedSummaries();
  res.json({
    success: true,
    totalFlagged: queue.length,
    data: queue
  });
});

// 17. Pathologist Resolves a Flagged Summary
app.post('/api/pathologist/review/:id/resolve', (req, res) => {
  const { pathologistNotes } = req.body;
  const resolved = resolveFlaggedSummary(req.params.id, pathologistNotes || 'Reviewed and validated by Chief Pathologist.');
  if (!resolved) {
    return res.status(404).json({ success: false, message: 'Flag record not found' });
  }

  res.json({
    success: true,
    message: 'Summary reviewed and signed off by Pathologist.',
    data: resolved
  });
});

// 18. Get Referring Doctor Reports (Last 90 Days)
app.get('/api/doctors/reports', (req, res) => {
  const doctorQuery = req.query.doctor || 'Ramanaiah';
  const doctorOrders = getOrdersByDoctor(doctorQuery);

  res.json({
    success: true,
    filterDoctor: doctorQuery,
    timeWindow: 'Last 90 Days',
    total: doctorOrders.length,
    data: doctorOrders
  });
});

// ==========================================
// 19. AUTHENTICATION & ROLE-BASED ACCESS
// ==========================================

// Login (Staff & Doctor)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email address and password.'
    });
  }

  const authenticated = authenticateUser(email, password);
  if (!authenticated) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password. Please check your credentials.'
    });
  }

  // Audit login under DPDP Act 2023
  recordAccessLog({
    orderId: 'PORTAL-AUTH',
    patientName: authenticated.name,
    patientPhone: authenticated.email,
    accessMethod: `${authenticated.role} Portal Sign-In (${authenticated.email})`,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    userAgent: req.headers['user-agent']
  });

  res.json({
    success: true,
    message: `Welcome back, ${authenticated.name}!`,
    user: authenticated
  });
});

// Register New Staff or Doctor
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role, specialty, clinic, department, branch, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required to create an account.'
      });
    }

    const newUser = registerUser({
      name,
      email,
      password,
      role: role || 'STAFF',
      specialty,
      clinic,
      department,
      branch,
      phone
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: newUser
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
});

// Get List of All Referring Doctors (with patient counts and profiles)
app.get('/api/auth/doctors', (req, res) => {
  const doctors = getAllDoctors();
  res.json({
    success: true,
    total: doctors.length,
    data: doctors
  });
});

// ==========================================
// Authentication Endpoints (Doctor & Staff)
// ==========================================

// Login endpoint (validates credentials and returns role info)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = authenticateUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Generate lightweight session token
  const token = `token_${user.id}_${Date.now()}`;
  res.json({
    success: true,
    message: `Logged in successfully as ${user.name}`,
    user,
    token
  });
});

// Register endpoint (Sign Up for new Doctor or Staff)
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, role, doctorName, specialization, center, phone } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Email, password, name, and role are required.' });
  }

  if (role !== 'doctor' && role !== 'staff') {
    return res.status(400).json({ error: "Role must be either 'doctor' or 'staff'." });
  }

  try {
    const newUser = createUser({
      email,
      password,
      name,
      role,
      doctorName: doctorName || name,
      specialization,
      center,
      phone
    });

    const token = `token_${newUser.id}_${Date.now()}`;
    res.status(201).json({
      success: true,
      message: `Account created successfully for ${newUser.name}`,
      user: newUser,
      token
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get doctors directory with patient count (for Staff Supervision view)
app.get('/api/auth/doctors', (req, res) => {
  const allUsers = getUsers();
  const doctors = allUsers.filter(u => u.role === 'doctor');
  const allOrders = getOrders();

  // Attach active patient counts for each doctor
  const doctorsWithStats = doctors.map(doc => {
    const doctorOrders = allOrders.filter(o => 
      o.referringDoctor && o.referringDoctor.toLowerCase().includes(doc.doctorName.toLowerCase().replace('dr.', '').trim())
    );
    return {
      ...doc,
      patientCount: doctorOrders.length,
      orders: doctorOrders.map(o => ({
        id: o.id,
        patientName: o.patientName,
        age: o.patientAge,
        gender: o.patientGender,
        testName: o.tests?.[0]?.testName || 'Diagnostic Panel',
        status: o.reportStatus,
        date: o.orderDate
      }))
    };
  });

  res.json({ success: true, doctors: doctorsWithStats });
});

// Serve frontend static files in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 ArogyaLink Server running on http://localhost:${PORT}`);
  console.log(`🏥 Diagnostic Lab Chain Portal - Vijayawada`);
  console.log(`===============================================`);
});
