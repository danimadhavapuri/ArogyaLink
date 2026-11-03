import express from 'express';
import cors from 'cors';
import { getOrders, getOrderById } from './data/store.js';

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

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 ArogyaLink Server running on http://localhost:${PORT}`);
  console.log(`🏥 Diagnostic Lab Chain Portal - Vijayawada`);
  console.log(`===============================================`);
});