import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedFilePath = path.join(__dirname, 'seedData.json');

let orders = [];
let auditLogs = [];
let callbackTasks = [];
let flaggedSummaries = [];

// Load seed data on start
try {
  const rawData = fs.readFileSync(seedFilePath, 'utf-8');
  orders = JSON.parse(rawData);
  console.log(`[Database] Loaded ${orders.length} orders from seed data.`);

  // 🚨 AUTOMATIC CRITICAL SEEDING:
  // Any critical patient (like Farzana Begum Potassium 6.8) immediately gets an active callback task!
  orders.forEach((o) => {
    if (o.isCritical || (o.status && o.status.includes('critical'))) {
      callbackTasks.push({
        id: `TASK-CRIT-${o.orderId}`,
        orderId: o.orderId,
        patientName: o.patientName,
        patientPhone: o.patientPhone,
        parameter: o.parameter,
        result: `${o.result} ${o.unit}`,
        referringDoctor: o.referringDoctor,
        urgency: 'HIGH_CRITICAL',
        status: 'Pending',
        reason: `Critical panic value detected (${o.parameter}: ${o.result} ${o.unit}). Immediate physician notification required under clinical safety rules.`,
        createdAt: o.createdAt || new Date().toISOString()
      });
    }
  });

  // Also seed initial sample audit log so the DPDP tab has history
  auditLogs.push({
    id: `LOG-71204-INIT`,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    orderId: 'ORD-71204',
    patientName: 'Lakshmi Prasanna K',
    maskedPhone: '+91 98765 *****',
    accessMethod: 'Patient Mobile OTP Authentication',
    ipAddress: '152.58.12.94 (Coastal AP Airtel 5G)',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Mobile)',
    status: 'Authorized Access',
    complianceStandard: 'DPDP Act 2023 (Digital Personal Data Protection)'
  });
} catch (err) {
  console.error('[Database] Error loading seed data:', err.message);
  orders = [];
}

export const getOrders = () => orders;

export const getOrderById = (id) => orders.find((o) => o.orderId === id);

export const getOrdersByDoctor = (doctorName) => {
  return orders.filter((o) =>
    o.referringDoctor.toLowerCase().includes(doctorName.toLowerCase())
  );
};

// Add batch of orders from CSV import
export const addOrders = (newOrders) => {
  let addedCount = 0;
  newOrders.forEach((newOrder) => {
    const existingIndex = orders.findIndex((o) => o.orderId === newOrder.orderId);
    if (existingIndex >= 0) {
      orders[existingIndex] = { ...orders[existingIndex], ...newOrder };
    } else {
      orders.unshift(newOrder);
      addedCount++;
    }

    // If new imported order is critical, immediately create emergency callback task
    if (newOrder.isCritical) {
      const existingTask = callbackTasks.find((t) => t.orderId === newOrder.orderId);
      if (!existingTask) {
        callbackTasks.unshift({
          id: `TASK-CSV-${newOrder.orderId}`,
          orderId: newOrder.orderId,
          patientName: newOrder.patientName,
          patientPhone: newOrder.patientPhone,
          parameter: newOrder.parameter,
          result: `${newOrder.result} ${newOrder.unit}`,
          referringDoctor: newOrder.referringDoctor,
          urgency: 'HIGH_CRITICAL',
          status: 'Pending',
          reason: `Critical value imported from LIS batch (${newOrder.parameter}: ${newOrder.result} ${newOrder.unit}).`,
          createdAt: new Date().toISOString()
        });
      }
    }
  });
  return { addedCount, totalOrders: orders.length };
};

// DPDP 2023 Audit Logging
export const addAuditLog = (logEntry) => {
  const log = {
    id: `LOG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...logEntry
  };
  auditLogs.unshift(log);
  return log;
};

export const getAuditLogs = () => auditLogs;

// Emergency Callback Tasks
export const addCallbackTask = (task) => {
  const existing = callbackTasks.find((t) => t.orderId === task.orderId);
  if (existing) return existing;

  const newTask = {
    id: `TASK-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'Pending',
    ...task
  };
  callbackTasks.unshift(newTask);
  return newTask;
};

export const getCallbackTasks = () => callbackTasks;

// Patient Flagging & Pathologist Weekly Review Queue
export const addFlaggedSummary = (flagEntry) => {
  const flag = {
    id: `FLAG-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'Under Review',
    reviewedByPathologist: false,
    pathologistNotes: null,
    ...flagEntry
  };
  flaggedSummaries.unshift(flag);
  return flag;
};

export const getFlaggedSummaries = () => flaggedSummaries;

export const resolveFlaggedSummary = (flagId, pathologistNotes) => {
  const flag = flaggedSummaries.find((f) => f.id === flagId);
  if (flag) {
    flag.status = 'Resolved';
    flag.reviewedByPathologist = true;
    flag.pathologistNotes = pathologistNotes;
    flag.resolvedAt = new Date().toISOString();
  }
  return flag;
};