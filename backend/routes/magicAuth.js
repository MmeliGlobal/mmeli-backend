const express = require('express');
const supabase = require('../supabase');
const crypto = require('crypto');
const router = express.Router();

// Send OTP / magic link (simplified – use WhatsApp)
router.post('/send-otp', async (req, res) => {
const { phone, quotation_id } = req.body;
// Check if user exists by phone
let { data: profile } = await supabase
.from('profiles')
.select('*')
.eq('phone', phone)
.single();
if (!profile) {
// Auto-create unclaimed profile (pending)
const { data: newProfile, error: createError } = await supabase
.from('profiles')
.insert([{ phone, role: 'pending' }])
.select()
.single();
if (createError) return res.status(500).json({ error: createError.message });
profile = newProfile;
}
// Create magic token
const token = crypto.randomBytes(32).toString('hex');
const { error: tokenError } = await supabase
.from('magic_tokens')
.insert([{ token, user_id: profile.id, quotation_id }]);
if (tokenError) return res.status(500).json({ error: tokenError.message });
// For now, generate WhatsApp message with link
const magicLink = `${process.env.SITE_URL}/auth/magic?token=${token}`;
const waMessage = `View your quotation: ${magicLink}`;
res.json({ waMessage, magicLink });
});

// Verify magic token and login
router.get('/verify', async (req, res) => {
const { token } = req.query;
const { data: magic, error } = await supabase
.from('magic_tokens')
.select('*, profiles(*)')
.eq('token', token)
.eq('used', false)
.single();
if (error || !magic || new Date(magic.expires_at) < new Date()) {
return res.status(401).json({ error: 'Invalid or expired token' });
}
// Mark token as used
await supabase.from('magic_tokens').update({ used: true }).eq('id', magic.id);
// Generate JWT for the user
const jwt = require('jsonwebtoken');
const authToken = jwt.sign(
{ id: magic.user_id, role: magic.profiles.role },
process.env.JWT_SECRET,
{ expiresIn: '7d' }
);
res.json({ token: authToken, user: magic.profiles, quotation_id: magic.quotation_id });
});

module.exports = router;