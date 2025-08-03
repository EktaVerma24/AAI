const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const Bill = require('../models/billModel');
const auth = require('../middleware/authMiddleware');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// POST /api/billing — Generate bill, save data, generate PDF
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

    const bill = await Bill.create({
      items: updatedProducts,
      total,
      customerName,
      customerPhone,
      cashierId: req.user.id,
      shopId,
      createdAt: new Date()
    });

    // PDF Invoice Path
    const doc = new PDFDocument();
    const invoicePath = path.join(__dirname, `../invoices/invoice-${bill._id}.pdf`);
    doc.pipe(fs.createWriteStream(invoicePath));

    // PDF Content
    doc.fontSize(18).text('✈️ Airport Shop Invoice');
    doc.moveDown();
    doc.fontSize(12).text(`Bill ID: ${bill._id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
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
      pdfPath: `/invoices/invoice-${bill._id}.pdf`
    });
  } catch (err) {
    console.error('❌ Billing Error:', err.message);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
