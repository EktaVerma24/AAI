const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const Bill = require('../models/billModel');
const Shop = require('../models/shopModel');
const Vendor = require('../models/vendorModel');
const auth = require('../middleware/authMiddleware');
const { multiRoleAuth } = require('../middleware/authMiddleware');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const sendEmail = require('../utils/sendEmails');

// ✅ Utility: Format timestamp to create clean PDF filenames
const formatTimestamp = (date) =>
  date.toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '');

// ✅ POST /api/billing — Generate bill and PDF
router.post('/', auth('cashier'), async (req, res) => {
  const { items, customerName, customerPhone } = req.body;

  try {
    let total = 0;
    const updatedProducts = [];

    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.quantity < item.quantity) {
        return res.status(400).json({ msg: `Not enough stock for ${product?.name || 'product'}` });
      }

      product.quantity -= item.quantity;
      await product.save();

      total += item.quantity * product.price;
      updatedProducts.push({ productId: product._id, quantity: item.quantity, price: product.price });

      // ✅ Low Stock Alert
      if (product.quantity <= product.lowStockThreshold) {
        const shop = await Shop.findById(product.shopId);
        const vendor = await Vendor.findById(shop.vendorId);

        const subject = `⚠️ Low Stock Alert: ${product.name}`;
        const message = `
Dear ${vendor.companyName || vendor.name || 'Vendor'},

The product "${product.name}" in your shop "${shop.name}" is running low.

Current Stock: ${product.quantity}
Threshold: ${product.lowStockThreshold}

Please restock soon.

Regards,
Airport Inventory System`.trim();

        await sendEmail(vendor.email, subject, message);
      }
    }

    const shopId = (await Product.findById(updatedProducts[0].productId)).shopId;
    const shop = await Shop.findById(shopId);

    const bill = await Bill.create({
      items: updatedProducts,
      total,
      customerName,
      customerPhone,
      cashierId: req.user.id,
      shopId,
      createdAt: new Date(),
    });

    // ✅ Emit real-time event via Socket.IO
    const io = req.app.get('io'); // 🔁 Get socket.io instance
    io.emit('newBill', {         // 🔁 Emit to all connected vendor dashboards
      billId: bill._id,
      shopId: shop._id,
      shopName: shop.name,
      total: bill.total,
      createdAt: bill.createdAt,
      customerName: bill.customerName || 'N/A'
    });

    // ✅ Generate PDF Invoice
    const formatted = formatTimestamp(bill.createdAt);
    const invoiceFileName = `invoice-${bill._id}-${formatted}.pdf`;
    const invoicePath = path.join(__dirname, `../invoices/${invoiceFileName}`);
    const invoiceURL = `/invoices/${invoiceFileName}`;

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(invoicePath));

    doc.fontSize(22).fillColor('#007ACC').text('✈️ Airport Inventory Management System', { align: 'center' }).moveDown();
    doc.fontSize(14).fillColor('black').text('Invoice', { align: 'center' }).moveDown(1.5);

    doc.fontSize(12).text(`Bill ID: ${bill._id}`);
    doc.text(`Date: ${new Date(bill.createdAt).toLocaleString()}`).moveDown();
    doc.text(`Shop: ${shop?.name || 'N/A'}`);
    doc.text(`Location: ${shop?.location || 'N/A'}`).moveDown();
    doc.text(`Customer Name: ${customerName || 'N/A'}`);
    doc.text(`Customer Phone: ${customerPhone || 'N/A'}`).moveDown(1.5);

    doc.fontSize(12).fillColor('#000');
    doc.text('Product ID', 50, doc.y, { continued: true, width: 200 });
    doc.text('Qty', 250, doc.y, { continued: true });
    doc.text('Price (₹)', 300, doc.y, { continued: true });
    doc.text('Total (₹)', 380);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    updatedProducts.forEach((item) => {
      const itemTotal = item.quantity * item.price;
      doc
        .fontSize(12)
        .text(item.productId.toString().slice(-5), 50, doc.y, { continued: true })
        .text(item.quantity, 250, doc.y, { continued: true })
        .text(item.price.toFixed(2), 300, doc.y, { continued: true })
        .text(itemTotal.toFixed(2), 380);
      doc.moveDown();
    });

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.fontSize(14).text(`Grand Total: ₹${total.toFixed(2)}`, { align: 'right' }).moveDown(2);

    doc
      .fontSize(10)
      .fillColor('gray')
      .text(
        'Thank you for shopping at Airport Vendor Shops.\nFor queries, contact support@airport-inventory.com',
        50,
        700,
        { align: 'center', lineGap: 2 }
      );

    doc.end();

    res.status(200).json({
      msg: '✅ Billing successful. Invoice generated.',
      billId: bill._id,
      pdfPath: invoiceURL,
    });
  } catch (err) {
    console.error('❌ Billing Error:', err.message);
    res.status(500).json({ msg: err.message });
  }
});

// ✅ GET /api/billing/cashier — Cashier bills
router.get('/cashier', auth('cashier'), async (req, res) => {
  try {
    const bills = await Bill.find({ cashierId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('items.productId')
      .populate('shopId');

    const withPdfPath = bills.map((b) => ({
      ...b._doc,
      pdfPath: `/invoices/invoice-${b._id}-${formatTimestamp(b.createdAt)}.pdf`,
    }));

    res.json(withPdfPath);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ GET /api/billing/vendor — Bills with optional filters
router.get('/vendor', multiRoleAuth(['vendor', 'cashier']), async (req, res) => {
  try {
    let shopIds = [];

    if (req.user.role === 'vendor') {
      const vendorShops = await Shop.find({ vendorId: req.user.id }).select('_id');
      shopIds = vendorShops.map((s) => s._id);
    } else {
      shopIds = [req.user.shopId];
    }

    const { startDate, endDate, customerName, minAmount, maxAmount } = req.query;

    const filter = { shopId: { $in: shopIds } };

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (customerName) {
      filter.customerName = { $regex: customerName, $options: 'i' };
    }

    if (minAmount || maxAmount) {
      filter.total = {};
      if (minAmount) filter.total.$gte = Number(minAmount);
      if (maxAmount) filter.total.$lte = Number(maxAmount);
    }

    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .populate('items.productId')
      .populate('cashierId')
      .populate('shopId');

    const withPdfPath = bills.map((b) => ({
      ...b._doc,
      pdfPath: `/invoices/invoice-${b._id}-${formatTimestamp(b.createdAt)}.pdf`,
    }));

    res.json(withPdfPath);
  } catch (err) {
    console.error('❌ Vendor/Cashier bill fetch failed:', err.message);
    res.status(500).json({ msg: err.message });
  }
});

// ✅ GET /api/billing/shop/:shopId — Specific shop bills
router.get('/shop/:shopId', auth('vendor'), async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const bills = await Bill.find({ shopId })
      .sort({ createdAt: -1 })
      .populate('items.productId');

    const withPdfPath = bills.map((b) => ({
      ...b._doc,
      pdfPath: `/invoices/invoice-${b._id}-${formatTimestamp(b.createdAt)}.pdf`,
    }));

    res.json(withPdfPath);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
