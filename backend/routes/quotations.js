const express = require('express');
const supabase = require('../supabase');
const { authMiddleware } = require('../middleware');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Helper to send WhatsApp message
async function sendWhatsApp(phone, message) {
  // You can integrate with Twilio, WhatsApp Business API, or just log
  console.log(`WhatsApp to ${phone}: ${message}`);
  // For production, use actual API like:
  // await fetch(`https://graph.facebook.com/v17.0/${process.env.WA_PHONE_ID}/messages`, {...})
}

// Create quotation (admin only) – auto‑registers user by phone
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { client, items, subtotal, discount, shipping, tax_rate, total } = req.body;
    if (!client.phone) return res.status(400).json({ error: 'Client phone is required' });

    // 1. Check if user exists by phone
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', client.phone)
      .single();

    let userId;
    let tempPassword = null;

    if (!profile) {
      // Auto‑register user
      tempPassword = Math.random().toString(36).slice(-8); // 8‑char random
      const authEmail = client.email || `${client.phone}@phone.local`;

      // Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: tempPassword,
        options: { data: { name: client.name, phone: client.phone, address: client.address } }
      });
      if (authError) throw authError;

      userId = authData.user.id;

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert([{
        id: userId,
        name: client.name,
        phone: client.phone,
        email: client.email || null,
        address: client.address,
        role: 'user'
      }]);
      if (profileError) throw profileError;

      // Send WhatsApp with credentials
      const waMessage = `Hello ${client.name},\nA quotation has been created for you.\nLogin at https://mmeliglobal.com/account\nPhone: ${client.phone}\nPassword: ${tempPassword}\n\nYou can change your password after login.`;
      await sendWhatsApp(client.phone, waMessage);
    } else {
      userId = profile.id;
      // Optional: notify existing user about the quotation
      const waMessage = `Hello ${client.name},\nYou have a new quotation. Please log in to view it.`;
      await sendWhatsApp(client.phone, waMessage);
    }

    // 2. Save quotation with user_id
    const quoteNumber = 'QT-' + Date.now();
    const { data: quote, error: quoteError } = await supabase.from('quotations').insert([{
      user_id: userId,
      quote_number: quoteNumber,
      client_data: client,
      items,
      subtotal,
      discount,
      shipping,
      tax_rate,
      total,
      issue_date: new Date().toISOString().split('T')[0],
      status: 'pending'
    }]);
    if (quoteError) throw quoteError;

    res.json({ success: true, quote_number: quoteNumber, new_user_created: !profile, temp_password: tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get quotations for logged‑in user (by phone)
router.get('/my-quotations', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get single quotation (authorise by user_id)
router.get('/:id', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Quotation not found' });
  res.json(data);
});

module.exports = router;
