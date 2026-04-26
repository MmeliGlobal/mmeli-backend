require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const supabase = require('./supabase');

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

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to fetch product by ID (for meta tags)
async function getProductForMeta(id) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

// Middleware to inject meta tags based on URL fragment (for crawlers)
app.use(async (req, res, next) => {
  // Only for GET requests that want HTML
  if (req.method !== 'GET') return next();
  const ua = req.headers['user-agent'] || '';
  const isCrawler = /bot|crawl|slurp|facebookexternalhit|whatsapp|twitterbot/i.test(ua);
  if (!isCrawler && !req.query._escaped_fragment_) return next();

  // Extract product ID from hash (URL like /#/product/123)
  const hash = req.headers['x-hash'] || req.query._hash || '';
  let productId = null;
  const match = hash.match(/\/product\/(\d+)/) || (req.url.match(/#!\/product\/(\d+)/));
  if (match) productId = match[1];
  if (!productId && req.query._escaped_fragment_) {
    const fragment = req.query._escaped_fragment_;
    const fragMatch = fragment.match(/\/product\/(\d+)/);
    if (fragMatch) productId = fragMatch[1];
  }

  if (productId) {
    const product = await getProductForMeta(productId);
    if (product) {
      // Override the HTML with custom meta tags
      const indexPath = path.join(__dirname, '../frontend/index.html');
      let html = require('fs').readFileSync(indexPath, 'utf8');
      // Replace OG tags
      const ogTitle = `<meta property="og:title" content="${product.name} | Mmeli Global">`;
      const ogDesc = `<meta property="og:description" content="${product.description ? product.description.substring(0,200) : 'Shop premium products.'}">`;
      const ogImage = `<meta property="og:image" content="${product.main_image}">`;
      const ogUrl = `<meta property="og:url" content="${req.protocol}://${req.get('host')}/#/product/${product.id}">`;
      const twitterTitle = `<meta name="twitter:title" content="${product.name}">`;
      const twitterDesc = `<meta name="twitter:description" content="${product.description ? product.description.substring(0,200) : 'Shop premium products.'}">`;
      const twitterImage = `<meta name="twitter:image" content="${product.main_image}">`;

      // Replace existing meta tags (simple string replacement)
      html = html.replace(/<meta property="og:title"[^>]*>/, ogTitle);
      html = html.replace(/<meta property="og:description"[^>]*>/, ogDesc);
      html = html.replace(/<meta property="og:image"[^>]*>/, ogImage);
      html = html.replace(/<meta property="og:url"[^>]*>/, ogUrl);
      html = html.replace(/<meta name="twitter:title"[^>]*>/, twitterTitle);
      html = html.replace(/<meta name="twitter:description"[^>]*>/, twitterDesc);
      html = html.replace(/<meta name="twitter:image"[^>]*>/, twitterImage);

      return res.send(html);
    }
  }
  next();
});

// Serve static frontend (after meta injection check)
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

// For all other requests, send the index.html (handles client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
