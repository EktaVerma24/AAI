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

    // ✅ Generate Professional PDF Invoice
    const formatted = formatTimestamp(bill.createdAt);
    const invoiceFileName = `invoice-${bill._id}-${formatted}.pdf`;
    const invoicePath = path.join(__dirname, `../invoices/${invoiceFileName}`);
    const invoiceURL = `/invoices/${invoiceFileName}`;

    // Ensure invoices directory exists
    const invoicesDir = path.dirname(invoicePath);
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `Invoice - ${bill._id}`,
        Author: 'Airport Inventory Management System',
        Subject: 'Commercial Invoice',
        Keywords: 'invoice, airport, inventory, billing',
        Creator: 'Airport Inventory System',
        Producer: 'PDFKit'
      }
    });
    
    const writeStream = fs.createWriteStream(invoicePath);
    doc.pipe(writeStream);

    // Add logo with comprehensive error handling
    try {
      const logoPath = path.join(__dirname, '../assets/logo.png');
      if (fs.existsSync(logoPath)) {
        const stats = fs.statSync(logoPath);
        if (stats.size > 0) { // Check if file is not empty
          doc.image(logoPath, 50, 50, { width: 80, height: 80 });
        } else {
          console.log('Logo file is empty, skipping logo');
        }
      } else {
        console.log('Logo file not found at:', logoPath);
      }
    } catch (logoError) {
      console.log('Logo loading failed, continuing without logo:', logoError.message);
      // Continue without logo if there's an error
    }

        // Header Section with enhanced styling
    doc.fontSize(28).fillColor('#1e40af').font('Helvetica-Bold')
      .text('AIRPORT INVENTORY MANAGEMENT SYSTEM', 50, 60, { align: 'center' });
    
    // Add decorative line
    // doc.moveTo(150, 95).lineTo(550, 95).stroke();
    
    doc.fontSize(18).fillColor('#374151').font('Helvetica-Bold')
        .text('COMMERCIAL INVOICE', { align: 'center' }).moveDown(0.5);

    // Invoice Details Section with enhanced styling
    doc.fontSize(11).fillColor('#6b7280').font('Helvetica-Bold').text('INVOICE DETAILS', 50, 160);
    doc.fontSize(12).fillColor('#111827').font('Helvetica-Bold')
      .text(`Invoice #: ${bill._id}`, 50, 180)
      .fontSize(10).font('Helvetica').fillColor('#374151')
      .text(`Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 50, 200)
      .text(`Time: ${new Date(bill.createdAt).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })}`, 50, 215);

    // Shop Information with enhanced styling
    doc.fontSize(11).fillColor('#6b7280').font('Helvetica-Bold').text('SHOP INFORMATION', 300, 160);
    doc.fontSize(12).fillColor('#111827').font('Helvetica-Bold')
      .text(shop?.name || 'N/A', 300, 180)
      .fontSize(10).font('Helvetica').fillColor('#374151')
      .text(`Location: ${shop?.location || 'N/A'}`, 300, 200);

    // Customer Information with enhanced styling
    doc.fontSize(11).fillColor('#6b7280').font('Helvetica-Bold').text('CUSTOMER INFORMATION', 50, 250);
    doc.fontSize(12).fillColor('#111827').font('Helvetica-Bold')
      .text(customerName || 'Walk-in Customer', 50, 270)
      .fontSize(10).font('Helvetica').fillColor('#374151')
      .text(`Phone: ${customerPhone || 'N/A'}`, 50, 290);

    // Table Header with enhanced styling
    doc.moveTo(50, 330).lineTo(550, 330).stroke();
    // Add background color for header
    doc.rect(50, 330, 500, 30).fill('#f3f4f6');
    doc.fontSize(11).fillColor('#1e40af').font('Helvetica-Bold')
      .text('S.No.', 50, 340, { width: 40 })
      .text('Product ID', 90, 340, { width: 80 })
      .text('Quantity', 170, 340, { width: 60 })
      .text('Unit Price (₹)', 230, 340, { width: 80 })
      .text('Total (₹)', 310, 340, { width: 80 })
      .text('GST (18%)', 390, 340, { width: 60 })
      .text('Final Total (₹)', 450, 340, { width: 100 });
    doc.moveTo(50, 360).lineTo(550, 360).stroke();

    // Table Content with enhanced styling
    let yPosition = 370;
    let serialNumber = 1;
    
    updatedProducts.forEach((item, index) => {
      const itemTotal = item.quantity * item.price;
      const gst = itemTotal * 0.18;
      const finalTotal = itemTotal + gst;
      
      // Alternate row colors for better readability
      if (index % 2 === 0) {
        doc.rect(50, yPosition - 5, 500, 20).fill('#f9fafb');
      }
      
      doc.fontSize(10).fillColor('#111827').font('Helvetica')
        .text(serialNumber.toString(), 50, yPosition, { width: 40 })
        .text(item.productId.toString().slice(-8), 90, yPosition, { width: 80 })
        .text(item.quantity.toString(), 170, yPosition, { width: 60 })
        .text(item.price.toFixed(2), 230, yPosition, { width: 80 })
        .text(itemTotal.toFixed(2), 310, yPosition, { width: 80 })
        .text(gst.toFixed(2), 390, yPosition, { width: 60 })
        .text(finalTotal.toFixed(2), 450, yPosition, { width: 100 });
      
      yPosition += 20;
      serialNumber++;
    });

    // Table Footer
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;

    // Summary Section with enhanced styling
    const subtotal = total;
    const gstTotal = subtotal * 0.18;
    const grandTotal = subtotal + gstTotal;

    // Add summary box background
    doc.rect(380, yPosition - 10, 170, 80).fill('#f8fafc').stroke('#e2e8f0');
    
    doc.fontSize(12).fillColor('#1e40af').font('Helvetica-Bold')
      .text('SUMMARY', 400, yPosition, { width: 150, align: 'right' });
    yPosition += 20;
    
    doc.fontSize(10).fillColor('#6b7280').font('Helvetica')
      .text('Subtotal:', 400, yPosition, { width: 100, align: 'right' })
      .fontSize(10).fillColor('#111827').font('Helvetica-Bold')
      .text(`₹${subtotal.toFixed(2)}`, 500, yPosition, { width: 50, align: 'right' });
    yPosition += 15;
    
    doc.fontSize(10).fillColor('#6b7280').font('Helvetica')
      .text('GST (18%):', 400, yPosition, { width: 100, align: 'right' })
      .fontSize(10).fillColor('#111827').font('Helvetica-Bold')
      .text(`₹${gstTotal.toFixed(2)}`, 500, yPosition, { width: 50, align: 'right' });
    yPosition += 15;
    
    doc.moveTo(400, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;
    
    doc.fontSize(14).fillColor('#1e40af').font('Helvetica-Bold')
      .text('GRAND TOTAL:', 400, yPosition, { width: 100, align: 'right' })
      .fontSize(14).fillColor('#1e40af').font('Helvetica-Bold')
      .text(`₹${grandTotal.toFixed(2)}`, 500, yPosition, { width: 50, align: 'right' });

    // Footer Section with enhanced styling
    yPosition += 40;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 20;

    // Add footer background
    doc.rect(50, yPosition - 5, 500, 100).fill('#f8fafc').stroke('#e2e8f0');
    
    doc.fontSize(10).fillColor('#1e40af').font('Helvetica-Bold')
      .text('TERMS & CONDITIONS:', 60, yPosition + 5, { width: 480 })
      .fontSize(9).fillColor('#6b7280').font('Helvetica')
      .text('• This is a computer generated invoice and does not require signature', 60, yPosition + 20, { width: 480 })
      .text('• Goods once sold will not be taken back or exchanged', 60, yPosition + 35, { width: 480 })
      .text('• Payment should be made at the time of purchase', 60, yPosition + 50, { width: 480 })
      .text('• For any queries, please contact our customer support', 60, yPosition + 65, { width: 480 });

    yPosition += 100;
    doc.fontSize(12).fillColor('#1e40af').font('Helvetica-Bold')
      .text('Thank you for your business!', { align: 'center' })
      .fontSize(9).fillColor('#6b7280').font('Helvetica')
      .text('Airport Inventory Management System | Email: support@airport-inventory.com | Phone: +91-XXXXXXXXXX', { align: 'center' });

    doc.end();

    // Wait a moment for PDF to be written
    setTimeout(() => {
      res.status(200).json({
        msg: '✅ Billing successful. Invoice generated.',
        billId: bill._id,
        pdfPath: invoiceURL,
      });
    }, 100);
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
