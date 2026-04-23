const express = require('express');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');
const { authMiddleware } = require('../middleware');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
try {
const { name, surname, email, phone, address, password } = req.body;
const { data: authData, error: authError } = await supabase.auth.signUp({
email, password,
options: { data: { name, surname, phone, address } }
});
if (authError) throw authError;
const { error: profileError } = await supabase
.from('profiles')
.insert([{ id: authData.user.id, name, surname, email, phone, address, role: 'user' }]);
if (profileError) throw profileError;
const token = jwt.sign({ id: authData.user.id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });
res.json({ token, user: { id: authData.user.id, name, surname, email, phone, address, role: 'user' } });
} catch (err) {
res.status(500).json({ error: err.message });
}
});

// Login (fixed to return user even if profile missing)
router.post('/login', async (req, res) => {
try {
const { email, password } = req.body;
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
if (error) throw error;

// Try to get profile, if not exists, create a basic one
let { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
if (!profile) {
const newProfile = {
id: data.user.id,
name: data.user.user_metadata?.name || email.split('@')[0],
surname: data.user.user_metadata?.surname || '',
email: email,
phone: data.user.user_metadata?.phone || '',
address: data.user.user_metadata?.address || '',
role: email === 'admin@mmeliglobal.com' ? 'admin' : 'user'
};
await supabase.from('profiles').insert([newProfile]);
profile = newProfile;
}

const token = jwt.sign({ id: data.user.id, role: profile.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
res.json({ token, user: profile });
} catch (err) {
res.status(401).json({ error: err.message });
}
});

router.get('/me', authMiddleware, async (req, res) => {
const { data, error } = await supabase.from('profiles').select('*').eq('id', req.user.id).single();
if (error) return res.status(404).json({ error: 'Profile not found' });
res.json(data);
});

module.exports = router;