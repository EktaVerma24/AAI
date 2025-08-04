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
const path = require('path');
const analyticsRoutes = require('./routes/analyticsRoutes');

// const cors = require('cors');


const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // or frontend domain
  credentials: true
}));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/cashiers', cashierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));
app.use('/api/analytics', analyticsRoutes);





mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.send('API is running');
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
