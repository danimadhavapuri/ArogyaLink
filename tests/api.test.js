import test from 'node:test';
import assert from 'node:assert/strict';
import { generateExpiringToken, verifyExpiringToken } from '../server/services/tokenService.js';
import { recordAccessLog, fetchAllAuditLogs } from '../server/services/auditService.js';
import { generateMultiLanguageSummary } from '../server/services/aiSummaryService.js';
import { parseLISCSV } from '../server/services/csvParser.js';
import { 
  initStore, 
  getOrders, 
  getOrderById, 
  getOrdersByDoctor, 
  authenticateUser, 
  registerUser, 
  getAllDoctors,
  getCallbackTasks 
} from '../server/data/store.js';

// Ensure data store is initialized before tests run
initStore();

test('Step 6.1 - Automated Test Suite: ArogyaLink Portal Core Services', async (t) => {
  
  // ----------------------------------------------------
  // TEST SUITE 1: 72-Hour HMAC Expiring Token Security
  // ----------------------------------------------------
  await t.test('Security: Generate valid 72-hour signed expiring token', () => {
    const tokenData = generateExpiringToken('ORD-71204');
    assert.ok(tokenData.token, 'Token string must exist');
    assert.ok(new Date(tokenData.expiresAt).getTime() > Date.now(), 'Token expiry must be in future');

    const verification = verifyExpiringToken(tokenData.token);
    assert.strictEqual(verification.valid, true, 'Valid token must be verified');
    assert.strictEqual(verification.orderId, 'ORD-71204', 'OrderId must match payload');
  });

  await t.test('Security: Reject tampered or forged HMAC tokens', () => {
    const tokenData = generateExpiringToken('ORD-71204');
    const tamperedToken = tokenData.token.slice(0, -4) + 'abcd';
    const verification = verifyExpiringToken(tamperedToken);
    assert.strictEqual(verification.valid, false, 'Tampered token must be rejected');
  });

  // ----------------------------------------------------
  // TEST SUITE 2: DPDP Act 2023 Statutory Access Logging & OTP
  // ----------------------------------------------------
  await t.test('Compliance: Record and mask personal phone in audit logs', () => {
    const initialLogCount = fetchAllAuditLogs().length;
    const log = recordAccessLog({
      orderId: 'ORD-71204',
      patientName: 'Lakshmi Prasanna K',
      patientPhone: '+91 98765 43210',
      accessMethod: 'Patient Mobile OTP Authentication'
    });

    assert.ok(log.id, 'Log must have a unique ID');
    assert.strictEqual(log.maskedPhone, '+91 98765 *****', 'Phone must be masked for DPDP compliance');
    assert.ok(fetchAllAuditLogs().length > initialLogCount, 'Log must be appended to audit list');
  });

  // ----------------------------------------------------
  // TEST SUITE 3: AI Clinical Safety Intercept (Critical Potassium Safety Rule)
  // ----------------------------------------------------
  await t.test('Clinical Safety: Intercept critical panic values (Potassium 6.8)', () => {
    const criticalOrder = getOrderById('ORD-71233'); // Farzana Begum, Potassium 6.8
    assert.ok(criticalOrder, 'Critical order ORD-71233 must exist in store');

    const summary = generateMultiLanguageSummary(criticalOrder);
    assert.strictEqual(summary.isCritical, true, 'Critical flag must be set to true');
    assert.strictEqual(summary.aiBlocked, true, 'Routine AI must be blocked for patient safety');
    assert.ok(summary.alertMessage.en.includes('CRITICAL MEDICAL ALERT'), 'Must provide clear clinical safety notice');
    assert.ok(summary.alertMessage.te, 'Must provide Telugu emergency alert');
    assert.strictEqual(summary.telugu, undefined, 'Routine Telugu lay summary must be withheld for panic values');
  });

  await t.test('AI Summary: Generate multi-lingual guidance for out-of-range value (Haemoglobin 10.2)', () => {
    const anaemicOrder = getOrderById('ORD-71204'); // Lakshmi Prasanna, Hb 10.2
    assert.ok(anaemicOrder, 'Order ORD-71204 must exist in store');

    const summary = generateMultiLanguageSummary(anaemicOrder);
    assert.strictEqual(summary.isCritical, false, 'Hb 10.2 is not panic level');
    assert.strictEqual(summary.status, 'LOW', 'Hb 10.2 must be flagged as LOW');
    assert.ok(summary.en.includes('haemoglobin level is slightly below'), 'Must generate English summary');
    assert.ok(summary.te.includes('హిమోగ్లోబిన్'), 'Must generate Telugu summary');
  });

  // ----------------------------------------------------
  // TEST SUITE 4: Role-Based Authentication & User Access Control
  // ----------------------------------------------------
  await t.test('Auth: Authenticate Doctor with valid credentials', () => {
    const user = authenticateUser('ramanaiah@arogyalink.in', 'password123');
    assert.ok(user, 'Doctor must be authenticated');
    assert.strictEqual(user.role.toUpperCase(), 'DOCTOR', 'User role must be DOCTOR');
    assert.strictEqual(user.doctorKey, 'Ramanaiah', 'Doctor key must match');
  });

  await t.test('Auth: Authenticate Staff with valid credentials', () => {
    const user = authenticateUser('staff@arogyalink.in', 'password123');
    assert.ok(user, 'Staff must be authenticated');
    assert.strictEqual(user.role.toUpperCase(), 'STAFF', 'User role must be STAFF');
  });

  await t.test('Auth: Reject incorrect password', () => {
    const user = authenticateUser('ramanaiah@arogyalink.in', 'wrongpassword');
    assert.strictEqual(user, null, 'Incorrect password must return null');
  });

  await t.test('Auth: Register new referring doctor and verify profile', () => {
    const newDoc = registerUser({
      name: 'Dr. Chaitanya Varma',
      email: 'chaitanya@arogyalink.in',
      password: 'securePass123',
      role: 'DOCTOR',
      specialty: 'Endocrinologist',
      clinic: 'Vijayawada Diabetes Care'
    });

    assert.ok(newDoc.id, 'New doctor must receive unique ID');
    assert.strictEqual(newDoc.email, 'chaitanya@arogyalink.in');
    assert.strictEqual(newDoc.specialty, 'Endocrinologist');
  });

  // ----------------------------------------------------
  // TEST SUITE 5: Doctor Data Isolation (Referring Clinician Privacy)
  // ----------------------------------------------------
  await t.test('Isolation: Doctor only sees their referred patients', () => {
    const ramanaiahOrders = getOrdersByDoctor('Ramanaiah');
    assert.ok(ramanaiahOrders.length > 0, 'Dr. Ramanaiah must have assigned patients');
    
    ramanaiahOrders.forEach(o => {
      assert.ok(
        o.referringDoctor.toLowerCase().includes('ramanaiah'),
        `Order ${o.orderId} must belong to Dr. Ramanaiah`
      );
    });
  });

  // ----------------------------------------------------
  // TEST SUITE 6: LIS CSV Batch Parser & Validation
  // ----------------------------------------------------
  await t.test('LIS CSV: Parse batch CSV format correctly', () => {
    const sampleCsv = `Order ID,Patient,Parameter,Result,Reference Range,Status,Referring Doctor
ORD-99901,Test Patient A,Glucose,180,70-99,Ready,Dr. S. Ramanaiah
ORD-99902,Test Patient B,Calcium,9.2,8.5-10.5,Processing,Dr. P. Anitha`;

    const parsed = parseLISCSV(sampleCsv);
    assert.strictEqual(parsed.length, 2, 'Must parse exactly 2 orders');
    assert.strictEqual(parsed[0].orderId, 'ORD-99901');
    assert.strictEqual(parsed[0].patientName, 'Test Patient A');
    assert.strictEqual(parsed[1].orderId, 'ORD-99902');
    assert.strictEqual(parsed[1].patientName, 'Test Patient B');
  });
});
