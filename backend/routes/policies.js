const express = require('express');
const supabase = require('../supabase');
const { authMiddleware, adminMiddleware } = require('../middleware');
const router = express.Router();

// Get all policies (public)
router.get('/', async (req, res) => {
const { data, error } = await supabase.from('policies').select('*');
if (error) return res.status(500).json({ error: error.message });
res.json(data);
});

// Update a policy (admin)
router.put('/:key', authMiddleware, adminMiddleware, async (req, res) => {
const { key } = req.params;
const { content, title } = req.body;
const { data, error } = await supabase
.from('policies')
.update({ content, title, updated_at: new Date() })
.eq('key', key)
.select()
.single();
if (error) return res.status(500).json({ error: error.message });
res.json(data);
});

module.exports = router;