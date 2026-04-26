require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const supabase = require('./supabase');

// Import all route modules
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

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========== PRODUCT PREVIEW FOR SOCIAL MEDIA ==========
// Special route for product link previews (WhatsApp, Facebook, Twitter, etc.)
app.get('/product/:id', async (req, res) => {
  const productId = req.params.id;
  const { data: product, error } = await supabase.from('products').select('*').eq('id', productId).single();
  if (error || !product) {
    return res.status(404).send('Product not found');
  }
  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta property="og:title" content="${product.name} | Mmeli Global">
    <meta property="og:description" content="${(product.description || 'Shop premium products').substring(0,200)}">
    <meta property="og:image" content="${product.main_image}">
    <meta property="og:url" content="https://mmeliglobal.com/#/product/${product.id}">
    <meta property="og:type" content="product">
    <meta name="twitter:card" content="summary_large_image">
    <meta http-equiv="refresh" content="0; url=/#/product/${product.id}">
    <title>${product.name} | Mmeli Global</title>
  </head>
  <body>
    <p>Redirecting to product...</p>
  </body>
  </html>`;
  res.send(html);
});
// ======================================================

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

// Mount API routes
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

// Catch-all: send index.html for any other request (handles client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
