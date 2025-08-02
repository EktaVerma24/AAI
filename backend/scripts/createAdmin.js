// // scripts/createAdmin.js

// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// require('dotenv').config();

// const Admin = require('../models/adminModel');

// mongoose.connect(process.env.MONGO_URI)
//   .then(async () => {
//     const existing = await Admin.findOne({ email: 'admin@example.com' });
//     if (existing) {
//       console.log('⚠️ Admin already exists');
//       process.exit();
//     }

//     const hashedPassword = await bcrypt.hash('admin123', 10);
//     console.log('🔄 Connecting to DB...');
// mongoose.connect(process.env.MONGO_URI)
// console.log('🔧 Creating admin...');

//     const admin = await Admin.create({
//       name: 'Admin',
//       email: 'admin@airport.com',
//       password: hashedPassword,
//     });

//     console.log('✅ Admin created successfully:', admin);
//     process.exit();
//   })
//   .catch(err => {
//     console.error('❌ Error connecting or creating admin:', err);
//     process.exit(1);
//   });
