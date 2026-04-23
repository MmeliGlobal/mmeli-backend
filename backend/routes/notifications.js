const express = require('express');
const supabase = require('../supabase');
const { authMiddleware, adminMiddleware } = require('../middleware');
const router = express.Router();

// Get all subscribers (admin)
router.get('/subscribers', authMiddleware, adminMiddleware, async (req, res) => {
const { data, error } = await supabase.from('subscribers').select('*');
if (error) return res.status(500).json({ error: error.message });
res.json(data);
});

// Subscribe (public)
router.post('/subscribe', async (req, res) => {
const { email, phone, name } = req.body;
if (!email && !phone) return res.status(400).json({ error: 'Email or phone required' });
const { data, error } = await supabase.from('subscribers').upsert({ email, phone, name }).select().single();
if (error) return res.status(500).json({ error: error.message });
res.json({ message: 'Subscribed successfully' });
});

// Send broadcast WhatsApp (admin) – generates a wa.me link for all numbers
router.post('/broadcast', authMiddleware, adminMiddleware, async (req, res) => {
const { message } = req.body;
const { data: subscribers } = await supabase.from('subscribers').select('phone');
const phones = subscribers.map(s => s.phone).filter(p => p);
const waLink = `https://wa.me/?text=${encodeURIComponent(message + '\n\nSent from Mmeli Global')}`;
res.json({ waLink, count: phones.length, phones });
});

module.exports = router;