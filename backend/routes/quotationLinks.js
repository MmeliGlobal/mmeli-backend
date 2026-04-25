const express = require('express');
const supabase = require('../supabase');
const crypto = require('crypto');
const { authMiddleware } = require('../middleware');
const router = express.Router();

// Generate secure token for a quotation
router.post('/generate-token', authMiddleware, async (req, res) => {
const { quotation_id } = req.body;
const token = crypto.randomBytes(32).toString('hex');
const { data, error } = await supabase
.from('quotation_links')
.insert([{ quotation_id, token }])
.select()
.single();
if (error) return res.status(500).json({ error: error.message });
res.json({ token, link: `${process.env.SITE_URL}/quotation/${token}` });
});

// Access quotation via token (public)
router.get('/token/:token', async (req, res) => {
const { token } = req.params;
const { data: link, error } = await supabase
.from('quotation_links')
.select('*, quotations(*)')
.eq('token', token)
.single();
if (error || !link || new Date(link.expires_at) < new Date()) {
return res.status(404).json({ error: 'Invalid or expired link' });
}
res.json(link.quotations);
});

module.exports = router;