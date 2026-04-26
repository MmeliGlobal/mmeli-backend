require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const supabase = require('./supabase');

// Import your routes (make sure all these files exist)
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

// ---------------------------------------------------------------------
// Helper to fetch product data for meta tags
async function getProductForMeta(id) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

// Middleware to inject dynamic Open Graph tags for social media crawlers
app.use(async (req, res, next) => {
  if (req.method !== 'GET') return next();

  const userAgent = req.headers['user-agent'] || '';
  const botKeywords = ['facebookexternalhit', 'WhatsApp', 'Twitterbot', 'LinkedInBot', 'Slackbot', 'Discordbot', 'TelegramBot', 'Googlebot', 'bingbot', 'Slurp', 'DuckDuckBot', 'baiduspider'];
  const isCrawler = botKeywords.some(keyword => userAgent.toLowerCase().includes(keyword.toLowerCase()));
  if (!isCrawler && !req.query._escaped_fragment_) return next();

  // Extract product ID from the hash (e.g., /#/product/123)
  let productId = null;
  const hash = req.headers['x-hash'] || req.query._hash || '';
  const match = hash.match(/\/product\/(\d+)/) || (req.url.match(/#!\/product\/(\d+)/));
  if (match) productId = match[1];
  if (!productId && req.query._escaped_fragment_) {
    const fragMatch = req.query._escaped_fragment_.match(/\/product\/(\d+)/);
    if (fragMatch) productId = fragMatch[1];
  }

  if (productId) {
    const product = await getProductForMeta(productId);
    if (product) {
      const indexPath = path.join(__dirname, '../frontend/index.html');
      try {
        let html = fs.readFileSync(indexPath, 'utf8');
        // Replace meta tags
        html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${product.name} | Mmeli Global">`);
        html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${(product.description || 'Shop premium products.').substring(0,200)}">`);
        html = html.replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${product.main_image}">`);
        html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${req.protocol}://${req.get('host')}/#/product/${product.id}">`);
        html = html.replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${product.name}">`);
        html = html.replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${(product.description || 'Shop premium products.').substring(0,200)}">`);
        html = html.replace(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${product.main_image}">`);
        return res.send(html);
      } catch (err) {
        console.error('Meta injection error:', err);
      }
    }
  }
  next();
});

// Serve static frontend
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

// Catch-all: send index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
