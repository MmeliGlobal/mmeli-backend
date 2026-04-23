require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const supabase = require('./supabase');

// Import routes (make sure all these files exist in your routes folder)
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const quotationRoutes = require('./routes/quotations');
const shipmentRoutes = require('./routes/shipments');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const promotionRoutes = require('./routes/promotions');
const notificationRoutes = require('./routes/notifications');
const policyRoutes = require('./routes/policies');
const inventoryRoutes = require('./routes/inventory');
const marketingRoutes = require('./routes/marketing');
const returnsRoutes = require('./routes/returns');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test Supabase connection at startup (critical!)
async function testSupabaseConnection() {
try {
const { data, error } = await supabase.from('products').select('id', { count: 'exact', head: true });
if (error) {
console.error('❌ Supabase connection error:', error.message);
console.error(' Please check your SUPABASE_SERVICE_ROLE_KEY in .env');
console.error(' The key must be the service_role key (not anon).');
} else {
console.log('✅ Supabase connection OK (service_role)');
}
} catch (err) {
console.error('❌ Supabase connection failed:', err.message);
}
}
testSupabaseConnection();

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Catch-all: serve frontend index.html for any non-API route
app.get('*', (req, res) => {
res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
console.log(`Server running on http://localhost:${PORT}`);
});