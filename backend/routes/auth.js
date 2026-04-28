const express = require('express');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');
const { authMiddleware } = require('../middleware');

const router = express.Router();

// Register with phone (email optional)
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, address, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: 'Phone and password required' });

    // Check if phone already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .single();
    if (existing) return res.status(400).json({ error: 'Phone already registered' });

    // Create Supabase Auth user (email is required by Supabase Auth, so we use phone@phone.local if no email)
    const authEmail = email || `${phone}@phone.local`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: authEmail,
      password,
      options: { data: { name, phone, address } }
    });
    if (authError) throw authError;

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: authData.user.id, name, phone, email: email || null, address, role: 'user' }]);
    if (profileError) throw profileError;

    const token = jwt.sign({ id: authData.user.id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: authData.user.id, name, phone, email: email || null, address, role: 'user' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login with phone (or email)
router.post('/login', async (req, res) => {
  try {
    const { phone, email, password } = req.body;
    const identifier = phone || email;
    if (!identifier || !password) return res.status(400).json({ error: 'Phone/email and password required' });

    // Find profile by phone or email
    let query = supabase.from('profiles').select('*');
    if (phone) query = query.eq('phone', phone);
    else query = query.eq('email', email);
    const { data: profile } = await query.single();

    if (!profile) return res.status(401).json({ error: 'User not found' });

    // Supabase Auth requires email for login, so we need the email from profile
    const authEmail = profile.email || `${profile.phone}@phone.local`;
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
    if (error) throw error;

    const token = jwt.sign({ id: data.user.id, role: profile.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: profile });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', req.user.id).single();
  if (error) return res.status(404).json({ error: 'Profile not found' });
  res.json(data);
});

module.exports = router;
