const express = require('express');
const supabase = require('../supabase');
const { authMiddleware } = require('../middleware');

const router = express.Router();

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, surname, address } = req.body;
    const { data, error } = await supabase
      .from('profiles')
      .update({ name, surname, address })
      .eq('id', req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;