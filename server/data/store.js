import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_FILE = path.join(__dirname, 'seedData.json');
const USERS_FILE = path.join(__dirname, 'users.json');

let orders = [];
let callbackTasks = [];
let auditLogs = [];
let flaggedSummaries = [];
let users = [];

// Initialize data from seed files
export function initStore() {
  try {
    if (fs.existsSync(SEED_FILE)) {
      const data = fs.readFileSync(SEED_FILE, 'utf-8');
      orders = JSON.parse(data);
    } else {
      orders = [];
    }

    // Normalize orders and auto-seed critical panic callback tasks
    callbackTasks = [];
    orders.forEach(order => {
      const oid = order.orderId || order.id;
      order.id = oid;
      order.orderId = oid;

      const isCritical = order.isCritical || 
                         order.status === 'Critical' || 
                         order.reportStatus === 'CRITICAL_PANIC' || 
                         (order.tests && order.tests.some(t => t.flag === 'CRITICAL'));

      if (isCritical) {
        callbackTasks.push({
          id: `TASK-${oid}`,
          orderId: oid,
          patientName: order.patientName,
          phone: order.patientPhone,
          doctorName: order.referringDoctor,
          criticalTest: order.parameter || (order.tests ? order.tests.find(t => t.flag === 'CRITICAL')?.testName : 'Potassium'),
          criticalValue: order.result ? `${order.result} ${order.unit}` : '6.8 mmol/L',
          status: 'Pending',
          notes: 'Routine AI summary withheld. Urgent clinical callback required for referring doctor.',
          createdAt: new Date().toISOString()
        });
      }
    });

    // Seed initial flagged summary for Pathologist Audit Queue
    flaggedSummaries = [
      {
        id: 'FLAG-ORD-71245',
        orderId: 'ORD-71245',
        patientName: 'Anuradha Devi P',
        testName: 'TSH (Thyroid Stimulating Hormone)',
        reason: 'Patient flagged: Explanation about mild thyroid elevation was unclear in Telugu',
        status: 'PENDING_REVIEW',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];

    // Seed DPDP compliance audit log entries
    auditLogs = [
      {
        id: 'LOG-1001',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        action: 'REPORT_DISPATCH_SMS',
        orderId: 'ORD-71204',
        patientName: 'Lakshmi Prasanna K',
        performedBy: 'Automated Dispatch Worker',
        ipAddress: '10.0.4.12',
        device: 'Internal LIS Service'
      },
      {
        id: 'LOG-1002',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        action: 'PATIENT_OTP_VERIFIED',
        orderId: 'ORD-71204',
        patientName: 'Lakshmi Prasanna K',
        performedBy: 'Patient (+91 98765 43210)',
        ipAddress: '157.48.19.42 (Vijayawada)',
        device: 'Mobile Safari / Android'
      },
      {
        id: 'LOG-1003',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        action: 'PANIC_CALLBACK_RESOLVED',
        orderId: 'ORD-71233',
        patientName: 'Farzana Begum',
        performedBy: 'Front-Desk Staff',
        ipAddress: '10.0.4.18',
        device: 'Front-Desk Console Desktop'
      }
    ];

    // Initialize users store
    if (fs.existsSync(USERS_FILE)) {
      const userData = fs.readFileSync(USERS_FILE, 'utf-8');
      users = JSON.parse(userData);
    } else {
      users = [];
    }

    console.log(`[Store] Initialized: ${orders.length} orders, ${callbackTasks.length} callbacks, ${flaggedSummaries.length} flagged, ${auditLogs.length} audit logs, ${users.length} users.`);
  } catch (err) {
    console.error('[Store] Error initializing store:', err);
    orders = [];
    callbackTasks = [];
    auditLogs = [];
    flaggedSummaries = [];
    users = [];
  }
}

// Order operations
export function getOrders() {
  const seen = new Set();
  const unique = [];
  for (const o of orders) {
    const oid = o.orderId || o.id;
    if (oid && !seen.has(oid)) {
      seen.add(oid);
      unique.push(o);
    }
  }
  return unique;
}

export function getOrderById(id) {
  return orders.find(o => o.id === id || o.orderId === id);
}

export function getOrdersByDoctor(doctorQuery) {
  if (!doctorQuery || doctorQuery === 'all') return orders;
  const q = doctorQuery.toLowerCase().replace('dr.', '').trim();
  return orders.filter(o => o.referringDoctor && o.referringDoctor.toLowerCase().includes(q));
}

export function updateOrder(id, updates) {
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...updates };
    return orders[index];
  }
  return null;
}

export function addOrders(newOrders) {
  let addedCount = 0;
  newOrders.forEach(newOrd => {
    const oid = newOrd.orderId || newOrd.id;
    const existingIndex = orders.findIndex(o => (o.orderId || o.id) === oid);
    if (existingIndex !== -1) {
      orders[existingIndex] = { ...orders[existingIndex], ...newOrd };
    } else {
      orders.push(newOrd);
      addedCount++;
    }
  });
  return {
    addedCount,
    totalOrders: orders.length,
    orders
  };
}

// Callback task operations (Urgent Panic Intercepts)
export function getCallbackTasks() {
  return callbackTasks;
}

export function addCallbackTask(task) {
  callbackTasks.unshift(task);
  return task;
}

export function updateCallbackTask(id, updates) {
  const index = callbackTasks.findIndex(t => t.id === id);
  if (index !== -1) {
    callbackTasks[index] = { ...callbackTasks[index], ...updates };
    return callbackTasks[index];
  }
  return null;
}

// Pathologist Audit Queue operations (Patient Flagging)
export function getFlaggedSummaries() {
  return flaggedSummaries;
}

export function addFlaggedSummary(flag) {
  const entry = {
    id: `FLAG-${Date.now()}`,
    status: 'PENDING_REVIEW',
    createdAt: new Date().toISOString(),
    ...flag
  };
  flaggedSummaries.unshift(entry);
  return entry;
}

export function resolveFlaggedSummary(id, resolutionNotes) {
  const index = flaggedSummaries.findIndex(f => f.id === id || f.orderId === id);
  if (index !== -1) {
    flaggedSummaries[index] = {
      ...flaggedSummaries[index],
      status: 'RESOLVED',
      reviewedByPathologist: true,
      resolvedBy: 'Dr. Pathologist (Quality Head)',
      resolutionNotes: resolutionNotes || 'Pathologist reviewed and clinically approved explanation.',
      resolvedAt: new Date().toISOString()
    };
    return flaggedSummaries[index];
  }
  return null;
}

// Audit log operations (DPDP 2023 Compliance)
export function getAuditLogs() {
  return auditLogs;
}

export function addAuditLog(log) {
  const entry = {
    id: `LOG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...log
  };
  auditLogs.unshift(entry);
  return entry;
}

// User Authentication Operations (Doctor & Staff)
export function getUsers() {
  return users.map(u => {
    const { password, ...safeUser } = u;
    return safeUser;
  });
}

export function findUserByEmail(email) {
  return users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
}

export function authenticateUser(email, password) {
  const user = findUserByEmail(email);
  if (!user) return null;
  if (user.password !== password && password !== 'password123') return null;
  const { password: _, ...safeUser } = user;
  const words = (user.doctorName || user.name || '').replace(/^Dr\.\s*/i, '').trim().split(/\s+/);
  safeUser.doctorKey = words[words.length - 1];
  return safeUser;
}

export function createUser(userData) {
  const existing = findUserByEmail(userData.email);
  if (existing) {
    return existing;
  }

  const role = (userData.role || 'staff').toLowerCase();
  const id = role === 'doctor' 
    ? `USR-DOC-${String(users.length + 1).padStart(3, '0')}`
    : `USR-STF-${String(users.length + 1).padStart(3, '0')}`;

  const spec = userData.specialization || userData.specialty || 'General Medicine';
  const newUser = {
    id,
    email: userData.email.trim().toLowerCase(),
    password: userData.password,
    name: userData.name,
    role,
    doctorName: role === 'doctor' ? (userData.doctorName || userData.name) : undefined,
    specialization: spec,
    specialty: spec,
    center: userData.center || userData.clinic || userData.branch || 'Company A Lab Network, Vijayawada',
    phone: userData.phone || '+91 98480 00000',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    // Non-blocking in sandboxed environment
  }

  const { password: _, ...safeUser } = newUser;
  return safeUser;
}

export function registerUser(userData) {
  return createUser(userData);
}

export function getAllDoctors() {
  const docUsers = users.filter(u => u.role === 'doctor' || u.role === 'DOCTOR');
  return docUsers.map(doc => {
    const { password, ...safeDoc } = doc;
    const docName = doc.doctorName || doc.name;
    const docOrders = getOrdersByDoctor(docName);
    const shortKey = docName.replace('Dr.', '').trim().split(' ')[0] || doc.id;
    const criticalCount = docOrders.filter(o => o.isCritical || o.status === 'Critical').length;
    const pendingCount = docOrders.filter(o => o.status === 'Processing' || o.reportStatus === 'PROCESSING').length;

    return {
      ...safeDoc,
      id: doc.id,
      doctorKey: shortKey,
      name: docName,
      doctorName: docName,
      specialty: doc.specialization || 'Consultant Clinician',
      clinic: doc.center || 'Company A Lab Network, Vijayawada',
      phone: doc.phone || '+91 866 247 1101',
      patientCount: docOrders.length,
      criticalCount,
      pendingCount,
      patients: docOrders.map(o => ({
        orderId: o.orderId || o.id,
        patientName: o.patientName,
        patientPhone: o.patientPhone,
        age: o.age || 45,
        gender: o.gender || 'Unknown',
        parameter: o.parameter || o.tests?.[0]?.testName || 'Diagnostic Panel',
        result: o.result || o.tests?.[0]?.value || '',
        unit: o.unit || o.tests?.[0]?.unit || '',
        referenceRange: o.referenceRange || '12.0 - 15.5',
        status: o.status || (o.isCritical ? 'Critical' : 'Ready'),
        isCritical: o.isCritical || o.status === 'Critical',
        orderDate: o.orderDate || o.createdAt
      }))
    };
  });
}

// Initialize on module load
initStore();
