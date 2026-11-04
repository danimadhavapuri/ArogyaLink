import express from 'express';
import cors from 'cors';
import { getOrders, getOrderById } from './data/store.js';
import { generateExpiringToken, verifyExpiringToken } from './services/tokenService.js';
import { recordAccessLog, fetchAllAuditLogs } from './services/auditService.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

// 4. Generate 72-Hour Expiring Link for an Order
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

// 5. Verify Expiring Token
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

// 6. Verify Mobile OTP to Unlock Full Report (Demo OTP: 1234)
app.post('/api/reports/verify-otp', (req, res) => {
  const { token, enteredOtp } = req.body;

  // Verify the 72-hour token first
  const verification = verifyExpiringToken(token);
  if (!verification.valid) {
    return res.status(400).json({
      success: false,
      message: verification.error || 'Token expired or invalid'
    });
  }

  // Demo OTP verification rule: accepts '1234' or any 4-digit code in test mode
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

  // Record DPDP 2023 compliance audit log
  recordAccessLog({
    orderId: order.orderId,
    patientName: order.patientName,
    patientPhone: order.patientPhone,
    accessMethod: 'Patient Mobile OTP Authentication',
    ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    userAgent: req.headers['user-agent']
  });

  // Return authorized report data
  res.json({
    success: true,
    message: 'OTP verified successfully. Access granted.',
    data: order
  });
});

// 7. Get DPDP Audit Access Logs (For Front-Desk & Compliance)
app.get('/api/audit-logs', (req, res) => {
  const logs = fetchAllAuditLogs();
  res.json({
    success: true,
    total: logs.length,
    data: logs
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 ArogyaLink Server running on http://localhost:${PORT}`);
  console.log(`🏥 Diagnostic Lab Chain Portal - Vijayawada`);
  console.log(`===============================================`);
});