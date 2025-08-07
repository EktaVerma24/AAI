const express = require('express');
const router = express.Router();
const Bill = require('../models/billModel');
const Shop = require('../models/shopModel');
const Product = require('../models/productModel');
const auth = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// ✅ GET /api/analytics/vendor — Overall analytics for vendor
router.get('/vendor', auth('vendor'), async (req, res) => {
  try {
    // 1. Get all shop IDs for the vendor
    const shops = await Shop.find({ vendorId: req.user.id }).select('_id');
    const shopIds = shops.map(s => s._id);

    // 2. Total Revenue
    const totalRevenue = await Bill.aggregate([
      { $match: { shopId: { $in: shopIds } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // 3. Sales per Day
    const salesPerDay = await Bill.aggregate([
      { $match: { shopId: { $in: shopIds } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. Best Selling Products
    const productSales = await Bill.aggregate([
      { $match: { shopId: { $in: shopIds } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          quantitySold: { $sum: '$items.quantity' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          quantitySold: 1
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      salesPerDay,
      productSales
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// ✅ GET /api/analytics/vendor/daily-product-sales?date=YYYY-MM-DD
// 📊 Returns total quantity sold per product for a specific date
router.get('/vendor/daily-product-sales', auth('vendor'), async (req, res) => {
  try {
    const date = req.query.date;
    if (!date) return res.status(400).json({ msg: 'Date is required in YYYY-MM-DD format' });

    const start = new Date(date);
    const end = new Date(new Date(date).setDate(start.getDate() + 1));

    // Get vendor's shop IDs
    const shops = await Shop.find({ vendorId: req.user.id }).select('_id');
    const shopIds = shops.map(s => s._id);

    const sales = await Bill.aggregate([
      {
        $match: {
          shopId: { $in: shopIds },
          createdAt: { $gte: start, $lt: end }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          quantitySold: { $sum: '$items.quantity' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $project: {
          productId: '$_id',
          name: '$productInfo.name',
          quantitySold: 1,
          _id: 0
        }
      },
      { $sort: { quantitySold: -1 } }
    ]);

    res.json(sales);
  } catch (err) {
    console.error('❌ Daily sales fetch error:', err.message);
    res.status(500).json({ msg: err.message });
  }
});

// ✅ NEW: GET /api/analytics/vendor/sales-per-shop?date=YYYY-MM-DD
router.get('/vendor/sales-per-shop', auth('vendor'), async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ msg: 'Date is required in YYYY-MM-DD format' });


    const start = new Date(date); // midnight UTC of the day
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const shops = await Shop.find({ vendorId: req.user.id });
    const shopIds = shops.map(s => s._id);

    const startDate = start.toISOString().split("T")[0];
    const endDate = end.toISOString().split("T")[0];

    console.log('Start:', startDate);
    console.log('End:', endDate);
    
    console.log('Shop IDs:', shopIds);

    console.log('Matching against shopIds:', shopIds.map(id => id.toString()));

    const billss = await Bill.find({
  shopId: { $in: [
    new mongoose.Types.ObjectId("688e70dc98e3bcfe6e5af923"),
    new mongoose.Types.ObjectId("688e70f198e3bcfe6e5af925"),
    new mongoose.Types.ObjectId("689100b2bf0ea818b15d91b8"),
    new mongoose.Types.ObjectId("6893042622c849cd59411de2")
  ]},
  createdAt: {
    $gte: new Date("2025-03-07T00:00:00.000Z"),
    $lt: new Date("2025-03-08T00:00:00.000Z")
  }
});
console.log("Matching bills:", billss);

console.log("Shop IDs (final):", shopIds.map(id => typeof id));



    const bills = await Bill.aggregate([
      // {
      //   $match: {
      //     shopId: { $in: shopIds },
      //     createdAt: { $gte: start, $lt: end }
      //   }
      // },
      {
        $group: {
          _id: '$shopId',
          totalSales: { $sum: '$total' }
        }
      },
      {
        $lookup: {
          from: 'shops',
          localField: '_id',
          foreignField: '_id',
          as: 'shop'
        }
      },
      { $unwind: '$shop' },
      {
        $project: {
          shopName: '$shop.name',
          totalSales: 1
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    console.log(bills);
    

    res.json(bills);
  } catch (err) {
    console.error('❌ Shop sales fetch error:', err.message);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
