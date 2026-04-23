const express = require('express');
const supabase = require('../supabase');
const { authMiddleware, adminMiddleware } = require('../middleware');

const router = express.Router();

// Create shipment
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('shipments').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all shipments
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('shipments').select('*').order('date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/track/:code', async (req, res) => {
const { data, error } = await supabase
.from('shipments')
.select('*')
.eq('tracking_code', req.params.code)
.single();
if (error) return res.status(404).json({ error: 'Not found' });
res.json(data);
});

// Update shipment status/paid
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.paid !== undefined) updates.paid = req.body.paid;
    const { data, error } = await supabase.from('shipments').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;