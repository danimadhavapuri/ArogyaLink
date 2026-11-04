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

// Add batch of orders from CSV import (avoids duplicates)
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