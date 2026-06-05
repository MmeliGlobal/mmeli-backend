// ========== SUPABASE SETUP – NO VARIABLE CONFLICT ==========
const SUPABASE_URL = 'https://proljdccjrifqgbmsyco.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2xqZGNjanJpZnFnYm1zeWNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc4ODAxOSwiZXhwIjoyMDkxMzY0MDE5fQ.VltzBUq-bLvu0Ny4jPy1kBp5E-4hffQgqFpqHrRWlZA';
// Use a unique variable name – no conflict with the global 'supabase' function
const sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== GLOBALS ==========
let products = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentUser = null;
let currentLimit = 50;
let map = null;

// ========== UI HELPERS ==========
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId + 'Page').classList.add('active');
  if (pageId === 'cart') renderCart();
  if (pageId === 'tracking') initMap();
  if (pageId === 'home') loadProducts();
}
function updateCartCount() { document.getElementById('cartCount').innerText = cart.length; }

// ========== PRODUCTS ==========
async function loadProducts() {
  const { data, error } = await sbClient.from('products').select('*').limit(currentLimit);
  if (error) { console.error(error); return; }
  products = data;
  renderProducts(products);
}
function renderProducts(prods) {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = prods.map(p => `
    <div class="product-card" onclick="viewProduct(${p.id})">
      <img src="${p.main_image || 'https://picsum.photos/200/200'}" onerror="this.src='https://picsum.photos/200/200'">
      <div class="info"><div>${escapeHtml(p.name)}</div><div class="product-price">$${p.price}</div></div>
    </div>
  `).join('');
}
async function viewProduct(id) {
  const prod = products.find(p => p.id == id);
  if (!prod) return;
  if (confirm(`Add ${prod.name} - $${prod.price} to cart?`)) {
    cart.push({ id: prod.id, name: prod.name, price: prod.price, image: prod.main_image });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert('Added to cart');
  }
}
function loadMore() { currentLimit += 50; loadProducts(); }

// ========== CART ==========
function renderCart() {
  const container = document.getElementById('cartItems');
  if (!cart.length) { container.innerHTML = '<p>Cart empty</p>'; document.getElementById('cartTotal').innerHTML = ''; return; }
  let total = 0;
  container.innerHTML = cart.map((item, i) => {
    total += item.price;
    return `<div class="cart-item"><span>${escapeHtml(item.name)} - $${item.price}</span><button onclick="removeFromCart(${i})">Remove</button></div>`;
  }).join('');
  document.getElementById('cartTotal').innerHTML = `<strong>Total: $${total.toFixed(2)}</strong>`;
}
function removeFromCart(i) { cart.splice(i,1); localStorage.setItem('cart', JSON.stringify(cart)); renderCart(); updateCartCount(); }
async function checkout() {
  if (!currentUser) { alert('Please login first'); showPage('account'); return; }
  if (!cart.length) { alert('Cart empty'); return; }
  const tracking = 'MM' + Math.floor(Math.random()*1000000);
  const total = cart.reduce((s,i)=>s+i.price,0);
  const order = { tracking_code: tracking, user_id: currentUser.id, items: cart, total, status: 'Processing', created_at: new Date() };
  const { error } = await sbClient.from('orders').insert([order]);
  if (error) { alert('Order failed: '+error.message); return; }
  alert(`Order placed! Tracking: ${tracking}`);
  cart = []; localStorage.setItem('cart',JSON.stringify(cart)); updateCartCount(); renderCart();
  showPage('tracking');
  document.getElementById('trackCode').value = tracking;
  trackOrder();
}

// ========== TRACKING ==========
async function trackOrder() {
  const code = document.getElementById('trackCode').value.trim();
  if (!code) return alert('Enter tracking code');
  const { data, error } = await sbClient.from('orders').select('*').eq('tracking_code', code).single();
  if (error) { document.getElementById('trackInfo').innerHTML = '<p>Not found</p>'; return; }
  document.getElementById('trackInfo').innerHTML = `<strong>Status:</strong> ${data.status}<br><strong>Total:</strong> $${data.total}<br><strong>Items:</strong> ${data.items.map(i=>i.name).join(', ')}`;
  if (map) map.remove();
  map = L.map('map').setView([-17.825,31.033],6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  L.marker([-17.825,31.033]).addTo(map).bindPopup('Mmeli Global');
}
function initMap() {
  if (map) map.remove();
  map = L.map('map').setView([-17.825,31.033],6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

// ========== AUTH ==========
async function login() {
  const phone = document.getElementById('loginPhone').value;
  const password = document.getElementById('loginPassword').value;
  const { data, error } = await sbClient.auth.signInWithPassword({ phone, password });
  if (error) { alert(error.message); return; }
  currentUser = data.user;
  document.getElementById('authBox').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('userName').innerText = currentUser.phone;
  loadUserOrders();
}
async function register() {
  const name = document.getElementById('regName').value;
  const phone = document.getElementById('regPhone').value;
  const password = document.getElementById('regPassword').value;
  if (!name || !phone || !password) return alert('All fields required');
  const { data, error } = await sbClient.auth.signUp({ phone, password, options: { data: { full_name: name } } });
  if (error) { alert(error.message); return; }
  await sbClient.from('profiles').insert([{ id: data.user.id, name, phone, role: 'customer' }]);
  alert('Registered! Please login.');
}
async function logout() { await sbClient.auth.signOut(); currentUser = null; location.reload(); }
async function loadUserOrders() {
  const { data } = await sbClient.from('orders').select('*').eq('user_id', currentUser.id);
  const container = document.getElementById('userOrders');
  if (!data || !data.length) { container.innerHTML = '<p>No orders</p>'; return; }
  container.innerHTML = data.map(o => `<div><strong>${o.tracking_code}</strong> - ${o.status} - $${o.total}</div>`).join('');
}

// ========== ADMIN ==========
async function adminLogin() {
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
  if (error) { alert(error.message); return; }
  const { data: prof } = await sbClient.from('profiles').select('role').eq('id', data.user.id).single();
  if (prof?.role !== 'admin') { alert('Not admin'); await sbClient.auth.signOut(); return; }
  currentUser = data.user;
  document.getElementById('adminLoginBox').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
}
async function showProductsModal() {
  const { data } = await sbClient.from('products').select('*');
  const list = data.map(p => `<div><img src="${p.main_image}" width="50"> ${p.name} - $${p.price} <button onclick="deleteProduct(${p.id})">Delete</button></div>`).join('');
  document.getElementById('productsList').innerHTML = list;
  document.getElementById('productsModal').style.display = 'block';
}
async function deleteProduct(id) {
  if (confirm('Delete?')) { await sbClient.from('products').delete().eq('id', id); showProductsModal(); loadProducts(); }
}
function showBulkImport() { document.getElementById('bulkModal').style.display = 'block'; }
async function importProducts() {
  const file = document.getElementById('bulkFile').files[0];
  if (!file) return alert('Select file');
  const clearMode = document.querySelector('input[name="clear"]:checked').value;
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const workbook = XLSX.read(e.target.result, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      if (clearMode === 'all') await sbClient.from('products').delete().neq('id', 0);
      for (const row of rows) {
        const name = row.product_name || row.name || 'Unnamed';
        const price = parseFloat(row.price_usd || row.price || 0);
        const cat = row.category || row.cat || '';
        const subcat = row.subcategory || '';
        const main_image = row.main_image || row.image_url || '';
        const metadata = {};
        for (let k in row) {
          if (!['product_name','name','price_usd','price','category','cat','subcategory','main_image','image_url'].includes(k))
            metadata[k] = row[k];
        }
        await sbClient.from('products').upsert({ name, price, cat, subcat, main_image, metadata, created_at: new Date() }, { onConflict: 'name' });
      }
      document.getElementById('importStatus').innerHTML = '<span style="color:green;">Import done!</span>';
      loadProducts();
    } catch(err) { document.getElementById('importStatus').innerHTML = '<span style="color:red;">Error: '+err.message+'</span>'; }
  };
  reader.readAsArrayBuffer(file);
}

// ========== HELPERS ==========
function escapeHtml(str) { return str.replace(/[&<>]/g, function(m){ if(m==='&') return '&amp;'; if(m==='<') return '&lt;'; if(m==='>') return '&gt;'; return m; }); }

// ========== INIT ==========
updateCartCount();
showPage('home');
initMap();
