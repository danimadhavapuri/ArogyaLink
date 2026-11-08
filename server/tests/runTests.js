import assert from 'assert';
import { generateExpiringToken, verifyExpiringToken } from '../services/tokenService.js';
import { recordAccessLog, fetchAllAuditLogs } from '../services/auditService.js';
import { generateMultiLanguageSummary } from '../services/aiSummaryService.js';
import { parseLISCSV } from '../services/csvParser.js';
import { 
  getOrders, 
  getOrderById, 
  getOrdersByDoctor, 
  authenticateUser, 
  registerUser, 
  getAllDoctors 
} from '../data/store.js';

console.log('====================================================');
console.log('🧪 ArogyaLink Automated Test Suite (Isocode Labs)');
console.log('Testing Core Logic, Security, DPDP Compliance & AI');
console.log('====================================================\n');

let passedCount = 0;
let failedCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${err.message}`);
    failedCount++;
  }
}

// ----------------------------------------------------
// TEST 1: 72-Hour HMAC Expiring Token Security
// ----------------------------------------------------
runTest('Security: Generate valid 72-hour signed expiring token', () => {
  const tokenData = generateExpiringToken('ORD-71204');
  assert(tokenData.token, 'Token string must exist');
  assert(new Date(tokenData.expiresAt).getTime() > Date.now(), 'Token expiry must be in future');

  const verification = verifyExpiringToken(tokenData.token);
  assert.strictEqual(verification.valid, true, 'Valid token must be verified');
  assert.strictEqual(verification.orderId, 'ORD-71204', 'OrderId must match payload');
});

runTest('Security: Reject tampered or forged HMAC tokens', () => {
  const tokenData = generateExpiringToken('ORD-71204');
  const tamperedToken = tokenData.token.slice(0, -4) + 'abcd';
  const verification = verifyExpiringToken(tamperedToken);
  assert.strictEqual(verification.valid, false, 'Tampered token must be rejected');
});

// ----------------------------------------------------
// TEST 2: DPDP Act 2023 Statutory Access Logging
// ----------------------------------------------------
runTest('Compliance: Record and mask personal phone in audit logs', () => {
  const initialLogCount = fetchAllAuditLogs().length;
  const log = recordAccessLog({
    orderId: 'ORD-71204',
    patientName: 'Lakshmi Prasanna K',
    patientPhone: '+91 98765 43210',
    accessMethod: 'Patient Mobile OTP Authentication'
  });

  assert(log.id, 'Log must have a unique ID');
  assert.strictEqual(log.maskedPhone, '+91 98765 *****', 'Phone must be masked for DPDP compliance');
  assert(fetchAllAuditLogs().length > initialLogCount, 'Log must be appended to audit list');
});

// ----------------------------------------------------
// TEST 3: AI Clinical Safety Intercept (Critical Panic Values)
// ----------------------------------------------------
runTest('Clinical Safety: Intercept critical panic values (Potassium 6.8)', () => {
  const criticalOrder = getOrderById('ORD-71233'); // Farzana Begum, Potassium 6.8
  assert(criticalOrder, 'Critical order ORD-71233 must exist in store');

  const summary = generateMultiLanguageSummary(criticalOrder);
  assert.strictEqual(summary.isCritical, true, 'Critical flag must be set to true');
  assert.strictEqual(summary.aiBlocked, true, 'Routine AI must be blocked for patient safety');
  assert(summary.alertMessage.en.includes('CRITICAL MEDICAL ALERT'), 'Must provide clear clinical safety notice');
  assert(summary.alertMessage.te, 'Must provide Telugu emergency alert');
  assert(!summary.telugu, 'Routine Telugu lay summary must be withheld for panic values');
});

runTest('AI Summary: Generate multi-lingual guidance for out-of-range value (Haemoglobin 10.2)', () => {
  const anaemicOrder = getOrderById('ORD-71204'); // Lakshmi Prasanna, Hb 10.2
  assert(anaemicOrder, 'Order ORD-71204 must exist in store');

  const summary = generateMultiLanguageSummary(anaemicOrder);
  assert.strictEqual(summary.isCritical, false, 'Hb 10.2 is not panic level');
  assert.strictEqual(summary.status, 'LOW', 'Hb 10.2 must be flagged as LOW');
  assert(summary.en.includes('haemoglobin level is slightly below'), 'Must generate English summary');
  assert(summary.te.includes('హిమోగ్లోబిన్'), 'Must generate Telugu summary');
});

// ----------------------------------------------------
// TEST 4: Role-Based Authentication & User Access Control
// ----------------------------------------------------
runTest('Auth: Authenticate Doctor with valid credentials', () => {
  const user = authenticateUser('ramanaiah@arogyalink.in', 'password123');
  assert(user, 'Doctor must be authenticated');
  assert.strictEqual(user.role.toUpperCase(), 'DOCTOR', 'User role must be DOCTOR');
  assert.strictEqual(user.doctorKey, 'Ramanaiah', 'Doctor key must match');
});

runTest('Auth: Authenticate Staff with valid credentials', () => {
  const user = authenticateUser('staff@arogyalink.in', 'password123');
  assert(user, 'Staff must be authenticated');
  assert.strictEqual(user.role.toUpperCase(), 'STAFF', 'User role must be STAFF');
});

runTest('Auth: Reject incorrect password', () => {
  const user = authenticateUser('ramanaiah@arogyalink.in', 'wrongpassword');
  assert.strictEqual(user, null, 'Incorrect password must return null');
});

runTest('Auth: Register new referring doctor and check profile', () => {
  const newDoc = registerUser({
    name: 'Dr. Chaitanya Varma',
    email: 'chaitanya@arogyalink.in',
    password: 'securePass123',
    role: 'DOCTOR',
    specialty: 'Endocrinologist',
    clinic: 'Vijayawada Diabetes Care'
  });

  assert(newDoc.id, 'New doctor must receive unique ID');
  assert.strictEqual(newDoc.email, 'chaitanya@arogyalink.in');
  assert.strictEqual(newDoc.specialty, 'Endocrinologist');
});

// ----------------------------------------------------
// TEST 5: Doctor Data Isolation (Referring Clinician Privacy)
// ----------------------------------------------------
runTest('Isolation: Doctor only sees their referred patients', () => {
  const ramanaiahOrders = getOrdersByDoctor('Ramanaiah');
  assert(ramanaiahOrders.length > 0, 'Dr. Ramanaiah must have assigned patients');
  
  ramanaiahOrders.forEach(o => {
    assert(
      o.referringDoctor.toLowerCase().includes('ramanaiah'),
      `Order ${o.orderId} must belong to Dr. Ramanaiah`
    );
  });
});

// ----------------------------------------------------
// TEST 6: LIS CSV Batch Parser & Validation
// ----------------------------------------------------
runTest('LIS CSV: Parse batch CSV format correctly', () => {
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

console.log('\n====================================================');
console.log(`Results: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log('====================================================');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 All automated tests passed successfully!');
  process.exit(0);
}
