import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedFilePath = path.join(__dirname, 'seedData.json');

// In-memory store initialized with seed data
let orders = [];
let auditLogs = [];
let callbackTasks = [];
let flaggedSummaries = [];

// Load seed data on start
try {
  const rawData = fs.readFileSync(seedFilePath, 'utf-8');
  orders = JSON.parse(rawData);
  console.log(`[Database] Loaded ${orders.length} orders from seed data.`);
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