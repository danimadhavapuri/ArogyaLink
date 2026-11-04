import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOrders, getOrderById, addOrders, getCallbackTasks } from './data/store.js';
import { generateExpiringToken, verifyExpiringToken } from './services/tokenService.js';
import { recordAccessLog, fetchAllAuditLogs } from './services/auditService.js';
import { parseLISCSV } from './services/csvParser.js';
import { generateMultiLanguageSummary } from './services/aiSummaryService.js';

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

// 5. Import LIS CSV Batch (Supports raw text, JSON { csv: "..." }, or auto-loads sample file)
app.post('/api/orders/import-csv', (req, res) => {
  try {
    let csvData = null;

    if (typeof req.body === 'string' && req.body.trim()) {
      csvData = req.body;
    } else if (req.body && typeof req.body === 'object' && req.body.csv) {
      csvData = req.body.csv;
    }

    // Smart Fallback: If no CSV was passed in the request body, load sample_lis_export.csv automatically
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

// 10. Get Multi-Language Clinical Summary for an Order (English, Telugu, Hindi)
app.get('/api/reports/:id/summary', (req, res) => {
  const order = getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const summary = generateMultiLanguageSummary(order);
  res.json({
    success: true,
    orderId: order.orderId,
    patientName: order.patientName,
    parameter: order.parameter,
    result: `${order.result} ${order.unit}`,
    referenceRange: order.referenceRange,
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

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 ArogyaLink Server running on http://localhost:${PORT}`);
  console.log(`🏥 Diagnostic Lab Chain Portal - Vijayawada`);
  console.log(`===============================================`);
});