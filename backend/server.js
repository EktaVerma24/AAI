const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const cashierRoutes = require('./routes/cashierRoutes');
const productRoutes = require('./routes/productRoutes');
const billingRoutes = require('./routes/billingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const path = require('path');

const http = require('http');
const { Server } = require('socket.io');

const app = express();

// 💡 Create HTTP server for Socket.IO to hook into
const server = http.createServer(app);

// ⚙️ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// 🌐 Store io instance in app so you can access it in any route
app.set('io', io);

// 🎧 Listen for socket connections
io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// 🌍 Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL ||'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// 📦 Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/cashiers', cashierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

// 📁 Serve invoices
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// 🧪 Root route
app.get('/', (req, res) => {
  res.send('API is running');
});

// ⚡ Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(process.env.PORT, () => {
      console.log(`🚀 Server is running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
