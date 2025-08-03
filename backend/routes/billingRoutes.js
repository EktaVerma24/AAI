const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const Bill = require('../models/billModel');
const Shop = require('../models/shopModel');
const auth = require('../middleware/authMiddleware');
const { multiRoleAuth } = require('../middleware/authMiddleware');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ✅ POST /api/billing — Generate bill, deduct stock, generate PDF
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

      updatedProducts.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    const shopId = updatedProducts[0]
      ? (await Product.findById(updatedProducts[0].productId)).shopId
      : null;

    const shop = await Shop.findById(shopId);

    const bill = await Bill.create({
      items: updatedProducts,
      total,
      customerName,
      customerPhone,
      cashierId: req.user.id,
      shopId,
      createdAt: new Date()
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const invoiceFileName = `invoice-${bill._id}-${timestamp}.pdf`;
    const invoicePath = path.join(__dirname, `../invoices/${invoiceFileName}`);
    const invoiceURL = `/invoices/${invoiceFileName}`;

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(invoicePath));

    // PDF Content
    doc.fontSize(18).text('✈️ Airport Shop Invoice');
    doc.moveDown();
    doc.fontSize(12).text(`Bill ID: ${bill._id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
    doc.text(`Shop: ${shop?.name || 'N/A'} (${shop?.location || ''})`);
    doc.text(`Customer: ${customerName || 'N/A'} | Phone: ${customerPhone || 'N/A'}`);
    doc.text(`Total Amount: ₹${total}`);
    doc.moveDown();
    doc.text('Items Purchased:');
    updatedProducts.forEach(item => {
      doc.text(`- Product ID: ${item.productId} | Qty: ${item.quantity} | Price: ₹${item.price}`);
    });

    doc.end();

    res.status(200).json({
      msg: '✅ Billing successful. Invoice generated.',
      billId: bill._id,
      pdfPath: invoiceURL
    });
  } catch (err) {
    console.error('❌ Billing Error:', err.message);
    res.status(500).json({ msg: err.message });
  }
});

// ✅ GET /api/billing/cashier — Bills for a cashier
router.get('/cashier', auth('cashier'), async (req, res) => {
  try {
    const bills = await Bill.find({ cashierId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('items.productId')
      .populate('shopId');
    res.json(bills);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ GET /api/billing/vendor — Bills for all shops (vendor or cashier)
router.get('/vendor', multiRoleAuth(['vendor', 'cashier']), async (req, res) => {
  try {
    let shopIds = [];

    if (req.user.role === 'vendor') {
      const vendorShops = await Shop.find({ vendorId: req.user.id }).select('_id');
      shopIds = vendorShops.map(s => s._id);
    } else if (req.user.role === 'cashier') {
      shopIds = [req.user.shopId];
    }

    const bills = await Bill.find({ shopId: { $in: shopIds } })
      .sort({ createdAt: -1 })
      .populate('items.productId')
      .populate('cashierId')
      .populate('shopId');

    res.json(bills);
  } catch (err) {
    console.error('❌ Vendor/Cashier bill fetch failed:', err.message);
    res.status(500).json({ msg: err.message });
  }
});

// ✅ GET /api/billing/shop/:shopId — Bills for a specific shop
router.get('/shop/:shopId', auth('vendor'), async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const bills = await Bill.find({ shopId })
      .sort({ createdAt: -1 })
      .populate('items.productId');
    res.json(bills);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
