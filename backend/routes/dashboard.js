const express = require('express');
const supabase = require('../supabase');
const { authMiddleware, adminMiddleware } = require('../middleware');
const router = express.Router();

router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
try {
const now = new Date();
const startOfDay = new Date(now.setHours(0,0,0,0));
const startOfWeek = new Date(now.setDate(now.getDate() - 7));

const [orders, products, users, revenue, todayOrders, weekRevenue] = await Promise.all([
supabase.from('orders').select('*', { count: 'exact', head: true }),
supabase.from('products').select('*', { count: 'exact', head: true }),
supabase.from('profiles').select('*', { count: 'exact', head: true }),
supabase.from('orders').select('total'),
supabase.from('orders').select('*', { count: 'exact', head: true }).gte('date', startOfDay.toISOString()),
supabase.from('orders').select('total').gte('date', startOfWeek.toISOString())
]);

const totalRevenue = revenue.data?.reduce((sum, o) => sum + o.total, 0) || 0;
const weekRevenueSum = weekRevenue.data?.reduce((sum, o) => sum + o.total, 0) || 0;

res.json({
totalOrders: orders.count,
totalProducts: products.count,
totalUsers: users.count,
totalRevenue,
todayOrders: todayOrders.count,
weekRevenue: weekRevenueSum
});
} catch (err) {
res.status(500).json({ error: err.message });
}
});

module.exports = router;