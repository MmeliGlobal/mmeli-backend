const express = require('express');
const supabase = require('../supabase');
const { authMiddleware, adminMiddleware } = require('../middleware');

const router = express.Router();

// Create quotation (admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('quotations').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all quotations (admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('quotations').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get quotations by client phone
router.get('/client/:phone', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('client->>phone', req.params.phone);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single quotation
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('quotations').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;