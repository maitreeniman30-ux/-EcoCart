// EcoCart - simple SPA logic using localStorage
// Added: admin edit/delete for products, checkout with Cash on Delivery and Online (demo) payment
/* ---------- Utilities ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const formatPrice = (n) => parseFloat(n).toFixed(2);
const uid = () => Math.random().toString(36).slice(2,9);

/* ---------- Initial Data ---------- */
const seedProducts = () => ([
  {
    id: 'p1',
    name: 'Reusable Cotton Bag',
    category: 'Reusable Bags',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1603354351875-8546a6a7f2c3?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=3b2b7a4b0de7b1b0d7b2b6f8a6a2a94f',
    eco: 'Reduces plastic waste by replacing single-use bags',
    plasticSaved: 5,
    co2Saved: 0.12
  },
  {
    id: 'p2',
    name: 'Bamboo Toothbrush (Set of 2)',
    category: 'Personal Care',
    price: 7.50,
    image: 'https://images.unsplash.com/photo-1556228720-3b0a4ac2f4a1?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=b7e1d6f8b1f5c2e3b4d5e6f7a8b9c0d1',
    eco: 'Biodegradable handle replaces plastic toothbrushes',
    plasticSaved: 0.5,
    co2Saved: 0.02
  },
  {
    id: 'p3',
    name: 'Bamboo Cutlery Set',
    category: 'Kitchen Essentials',
    price: 12.00,
    image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f2d0a?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=3f2f7b9b5d4a6c7f8e9d0b1c2a3f4e5d',
    eco: 'Avoids single-use plastic cutlery',
    plasticSaved: 3,
    co2Saved: 0.08
  },
  {
    id: 'p4',
    name: 'Bamboo Serving Board',
    category: 'Home & Decor',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=53d3bdf4f8c2a7b8c9d0e3f4a1b2c3d4',
    eco: 'Sustainably sourced bamboo for home use',
    plasticSaved: 0,
    co2Saved: 0.3
  },
  {
    id: 'p5',
    name: 'Organic Bar Soap',
    category: 'Personal Care',
    price: 5.50,
    image: 'https://images.unsplash.com/photo-1592265581410-5b8b8b8b8b8b?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=e1b2c3d4f5a6b7c8d9e0f1a2b3c4d5e6',
    eco: 'Plastic-free packaging and natural ingredients',
    plasticSaved: 0,
    co2Saved: 0.05
  }
]);

/* ---------- Storage helpers ---------- */
const read = (k) => JSON.parse(localStorage.getItem(k) || 'null');
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ---------- App State Init ---------- */
function ensureData(){
  if(!read('ecocart_products')){
    write('ecocart_products', seedProducts());
  }
  if(!read('ecocart_users')){
    write('ecocart_users', []); // users: {login, name, email, password}
  }
  if(!read('ecocart_cart')){
    write('ecocart_cart', []); // cart items {productId, qty}
  }
  if(!read('ecocart_orders')){
    write('ecocart_orders', []); // orders
  }
  if(!read('ecocart_reviews')){
    write('ecocart_reviews', []); // reviews
  }
  if(!read('ecocart_contacts')){
    write('ecocart_contacts', []);
  }
  // for admin edit state
  if(!read('ecocart_admin_state')){
    write('ecocart_admin_state', {editingProductId: null});
  }
}
ensureData();

/* ---------- Rendering ---------- */
function renderCategoryFilters(){
  const products = read('ecocart_products') || [];
  const categories = [...new Set(products.map(p => p.category))];
  const container = $('#category-filters');
  container.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.textContent = 'All';
  allBtn.className = 'cat-btn';
  allBtn.onclick = () => renderProducts();
  container.appendChild(allBtn);
  categories.forEach(c=>{
    const b = document.createElement('button');
    b.textContent = c;
    b.className = 'cat-btn';
    b.onclick = () => renderProducts(c);
    container.appendChild(b);
  });
}

function renderProducts(filter){
  const products = read('ecocart_products') || [];
  const grid = $('#products-grid');
  const list = filter ? products.filter(p=>p.category===filter) : products;
  grid.innerHTML = '';
  list.forEach(p=>{
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <h4>${p.name}</h4>
      <p class="muted">${p.category} · $${formatPrice(p.price)}</p>
      <p>${p.eco}</p>
      <div class="product-actions">
        <span>$${formatPrice(p.price)}</span>
        <button data-id="${p.id}" class="btn add-to-cart">Add to Cart</button>
      </div>
    `;
    grid.appendChild(card);
  });
  $$('.add-to-cart').forEach(b=>{
    b.onclick = (e)=>{
      addToCart(e.target.dataset.id);
    };
  });
}

function renderCart(){
  const cart = read('ecocart_cart') || [];
  const products = read('ecocart_products') || [];
  const listEl = $('#cart-list');
  listEl.innerHTML = '';
  if(cart.length===0){
    listEl.innerHTML = '<p>Your cart is empty.</p>';
    $('#cart-total').textContent = '0.00';
    $('#cart-count').textContent = 0;
    return;
  }
  let total = 0;
  cart.forEach(item=>{
    const prod = products.find(p=>p.id===item.productId);
    const li = document.createElement('div');
    li.className = 'cart-item';
    li.innerHTML = `
      <div style="display:flex;gap:1rem;align-items:center;margin-bottom:.5rem">
        <img src="${prod.image}" style="width:80px;height:60px;object-fit:cover;border-radius:6px" />
        <div>
          <strong>${prod.name}</strong><br/>
          <small>${prod.eco}</small>
        </div>
      </div>
      <div style="display:flex;gap:.5rem;align-items:center;margin-bottom:1rem">
        <button class="qty-dec" data-id="${item.productId}">-</button>
        <span>${item.qty}</span>
        <button class="qty-inc" data-id="${item.productId}">+</button>
        <span style="margin-left:1rem">$${formatPrice(prod.price * item.qty)}</span>
      </div>
    `;
    listEl.appendChild(li);
    total += prod.price * item.qty;
  });
  $('#cart-total').textContent = formatPrice(total);
  $('#cart-count').textContent = cart.reduce((s,i)=>s+i.qty,0);
  // quantity buttons
  $$('.qty-inc').forEach(b=>b.onclick = ()=>{
    changeQty(b.dataset.id, 1);
  });
  $$('.qty-dec').forEach(b=>b.onclick = ()=>{
    changeQty(b.dataset.id, -1);
  });
}

function renderImpact(){
  const orders = read('ecocart_orders') || [];
  const plastic = orders.reduce((sum,ord)=>{
    return sum + (ord.items.reduce((s,it)=>{
      return s + (it.plasticSaved || 0) * it.qty;
    },0));
  },0);
  const co2 = orders.reduce((sum,ord)=>{
    return sum + (ord.items.reduce((s,it)=>{
      return s + (it.co2Saved || 0) * it.qty;
    },0));
  },0);
  $('#impact-plastic').textContent = Math.round(plastic);
  $('#impact-co2').textContent = co2.toFixed(2);
  $('#impact-orders').textContent = orders.length;
}

function renderBlog(){
  const posts = [
    {id:'b1',title:'Why Eco-Friendly Products Matter',excerpt:'Small choices add up. Choosing reusable items reduces waste and conserves resources.'},
    {id:'b2',title:'5 Easy Ways to Live Sustainably',excerpt:'Simple daily habits: reuse, reduce, compost, and choose natural materials.'},
    {id:'b3',title:'Plastic vs Bamboo Products',excerpt:'Compare lifecycle and disposal: bamboo is often biodegradable and sustainably sourced.'}
  ];
  const container = $('#blog-list');
  container.innerHTML = '';
  posts.forEach(p=>{
    const el = document.createElement('div');
    el.className = 'blog-card';
    el.innerHTML = `<h4>${p.title}</h4><p>${p.excerpt}</p><a href="#">Read more</a>`;
    container.appendChild(el);
  });
}

function renderReviews(){
  const reviews = read('ecocart_reviews') || [];
  const container = $('#reviews-list');
  container.innerHTML = '';
  if(reviews.length===0){ container.innerHTML = '<p>No reviews yet.</p>'; return; }
  reviews.forEach(r=>{
    const el = document.createElement('div');
    el.className = 'review';
    el.innerHTML = `<strong>${r.title}</strong><p>${r.body}</p><small>by ${r.by || 'Anonymous'}</small>`;
    container.appendChild(el);
  });
}

/* ---------- Admin: products list render + edit/delete ---------- */
function renderAdminProducts(){
  const products = read('ecocart_products') || [];
  const tbody = $('#admin-products-table tbody');
  tbody.innerHTML = '';
  products.forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>$${formatPrice(p.price)}</td>
      <td>${p.eco}</td>
      <td>
        <button class="btn admin-edit" data-id="${p.id}">Edit</button>
        <button class="btn admin-delete" data-id="${p.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  $$('.admin-delete').forEach(b=>{
    b.onclick = ()=> {
      const id = b.dataset.id;
      if(confirm('Delete product?')) {
        deleteProduct(id);
      }
    };
  });
  $$('.admin-edit').forEach(b=>{
    b.onclick = ()=> {
      const id = b.dataset.id;
      startEditProduct(id);
    };
  });
}

/* ---------- Cart Actions ---------- */
function addToCart(productId){
  const cart = read('ecocart_cart') || [];
  const existing = cart.find(c=>c.productId===productId);
  if(existing){ existing.qty += 1; }
  else cart.push({productId,qty:1});
  write('ecocart_cart', cart);
  renderCart();
  alert('Added to cart');
}

function changeQty(productId, delta){
  let cart = read('ecocart_cart') || [];
  const idx = cart.findIndex(c=>c.productId===productId);
  if(idx===-1) return;
  cart[idx].qty += delta;
  if(cart[idx].qty <= 0) cart.splice(idx,1);
  write('ecocart_cart', cart);
  renderCart();
}

/* ---------- Checkout (Cash on Delivery & Online Demo) ---------- */
function openPaymentModal(){
  $('#payment-modal').classList.remove('hidden');
  $('#online-payment-form').classList.add('hidden');
}
function closePaymentModal(){
  $('#payment-modal').classList.add('hidden');
  $('#online-payment-form').classList.add('hidden');
}

function checkoutCash() {
  // Record order as unpaid (Cash on Delivery)
  const current = read('ecocart_currentUser');
  const cart = read('ecocart_cart') || [];
  if(cart.length===0){ alert('Cart is empty'); closePaymentModal(); return; }
  if(!current){
    alert('Please login or register to checkout.');
    showAuthModal('login');
    return;
  }
  const products = read('ecocart_products') || [];
  const orderItems = cart.map(item=>{
    const p = products.find(x=>x.id===item.productId);
    return {
      productId: p.id,
      name: p.name,
      qty: item.qty,
      price: p.price,
      plasticSaved: p.plasticSaved || 0,
      co2Saved: p.co2Saved || 0
    };
  });
  const total = orderItems.reduce((s,it)=>s + it.price * it.qty, 0);
  const order = {
    id: 'ord_' + uid(),
    userLogin: current.login,
    userEmail: current.email,
    items: orderItems,
    total,
    date: new Date().toISOString(),
    paymentMethod: 'Cash on Delivery',
    paid: false
  };
  const orders = read('ecocart_orders') || [];
  orders.push(order);
  write('ecocart_orders', orders);
  write('ecocart_cart', []);
  renderCart();
  renderImpact();
  renderAdminOrders();
  closePaymentModal();
  alert('Order placed with Cash on Delivery.');
}

function startOnlinePaymentDemo(){
  // show online payment inputs
  $('#online-payment-form').classList.remove('hidden');
}

function checkoutOnlineDemo(){
  // Demo online payment: validate inputs minimally then record paid order
  const cardName = $('#card-name').value.trim();
  const cardNumber = $('#card-number').value.trim();
  if(!cardName || !cardNumber){ alert('Enter card name and number (demo).'); return; }
  const current = read('ecocart_currentUser');
  const cart = read('ecocart_cart') || [];
  if(cart.length===0){ alert('Cart is empty'); closePaymentModal(); return; }
  if(!current){
    alert('Please login or register to checkout.');
    showAuthModal('login');
    return;
  }
  const products = read('ecocart_products') || [];
  const orderItems = cart.map(item=>{
    const p = products.find(x=>x.id===item.productId);
    return {
      productId: p.id,
      name: p.name,
      qty: item.qty,
      price: p.price,
      plasticSaved: p.plasticSaved || 0,
      co2Saved: p.co2Saved || 0
    };
  });
  const total = orderItems.reduce((s,it)=>s + it.price * it.qty, 0);
  const order = {
    id: 'ord_' + uid(),
    userLogin: current.login,
    userEmail: current.email,
    items: orderItems,
    total,
    date: new Date().toISOString(),
    paymentMethod: 'Online (Demo)',
    paid: true
  };
  const orders = read('ecocart_orders') || [];
  orders.push(order);
  write('ecocart_orders', orders);
  write('ecocart_cart', []);
  renderCart();
  renderImpact();
  renderAdminOrders();
  closePaymentModal();
  // clear demo card inputs
  $('#card-name').value = '';
  $('#card-number').value = '';
  $('#card-exp').value = '';
  $('#card-cvc').value = '';
  alert('Payment successful (demo). Order placed.');
}

/* ---------- Auth ---------- */
function showAuthModal(tab='login'){
  $('#auth-modal').classList.remove('hidden');
  if(tab==='login'){ $('#form-login').classList.remove('hidden'); $('#form-register').classList.add('hidden'); }
  else { $('#form-login').classList.add('hidden'); $('#form-register').classList.remove('hidden'); }
}
function hideAuthModal(){ $('#auth-modal').classList.add('hidden'); }

function doRegister(){
  const name = $('#reg-name').value.trim();
  const login = $('#reg-login').value.trim();
  const email = $('#reg-email').value.trim();
  const password = $('#reg-password').value;
  if(!login || !email || !password){ alert('Fill all fields'); return; }
  const users = read('ecocart_users') || [];
  if(users.find(u=>u.login===login || u.email===email)){ alert('User exists with same login or email'); return; }
  users.push({login, name, email, password});
  write('ecocart_users', users);
  write('ecocart_currentUser', {login, name, email});
  hideAuthModal();
  $('#btn-login').textContent = `Hi, ${login}`;
  alert('Registered and logged in as ' + login);
}

function doLogin(){
  const email = $('#login-email').value.trim();
  const password = $('#login-password').value;
  const users = read('ecocart_users') || [];
  const u = users.find(x=>x.email===email && x.password===password);
  if(!u){ alert('Invalid credentials'); return; }
  write('ecocart_currentUser', {login: u.login, name: u.name, email: u.email});
  hideAuthModal();
  $('#btn-login').textContent = `Hi, ${u.login}`;
  alert('Logged in as ' + u.login);
}

/* ---------- Admin ---------- */
function adminLogin(){
  const id = $('#admin-id').value.trim();
  const pass = $('#admin-pass').value;
  if(id === 'Maitree29' && pass === '001'){
    $('#admin-login').classList.add('hidden');
    $('#admin-dashboard').classList.remove('hidden');
    renderAdminOrders();
    renderAdminProducts();
  } else {
    alert('Invalid admin credentials');
  }
}

function renderAdminOrders(){
  const orders = read('ecocart_orders') || [];
  const tbody = $('#admin-orders-table tbody');
  tbody.innerHTML = '';
  orders.forEach(o=>{
    const itemsSummary = o.items.map(it=>`${it.name} x${it.qty}`).join('; ');
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${o.id}</td><td>${o.userLogin}</td><td>${o.userEmail}</td><td>${itemsSummary}</td><td>$${formatPrice(o.total)}</td><td>${o.paymentMethod || ''}</td><td>${o.paid ? 'Yes' : 'No'}</td><td>${(new Date(o.date)).toLocaleString()}</td>`;
    tbody.appendChild(tr);
  });
}

/* ---------- Admin Add/Edit/Delete Product ---------- */
function addProductFromAdmin(){
  const name = $('#prod-name').value.trim();
  const category = $('#prod-category').value.trim() || 'Misc';
  const price = parseFloat($('#prod-price').value) || 0;
  const image = $('#prod-image').value.trim() || 'https://via.placeholder.com/400x300';
  const eco = $('#prod-eco').value.trim() || '';
  const plasticSaved = parseFloat($('#prod-plastic').value) || 0;
  const co2Saved = parseFloat($('#prod-co2').value) || 0;
  if(!name){ alert('Provide product name'); return; }
  const products = read('ecocart_products') || [];
  const id = 'p' + uid();
  const p = {id,name,category,price,image,eco,plasticSaved,co2Saved};
  products.push(p);
  write('ecocart_products', products);
  renderCategoryFilters();
  renderProducts();
  renderAdminProducts();
  clearProductForm();
  alert('Product added');
}

function deleteProduct(id){
  let products = read('ecocart_products') || [];
  products = products.filter(p=>p.id !== id);
  write('ecocart_products', products);
  renderCategoryFilters();
  renderProducts();
  renderAdminProducts();
  alert('Product deleted');
}

function startEditProduct(id){
  const products = read('ecocart_products') || [];
  const p = products.find(x=>x.id === id);
  if(!p) return alert('Product not found');
  // fill form
  $('#prod-name').value = p.name;
  $('#prod-category').value = p.category;
  $('#prod-price').value = p.price;
  $('#prod-image').value = p.image;
  $('#prod-eco').value = p.eco;
  $('#prod-plastic').value = p.plasticSaved || 0;
  $('#prod-co2').value = p.co2Saved || 0;
  // set editing state
  const st = read('ecocart_admin_state') || {};
  st.editingProductId = p.id;
  write('ecocart_admin_state', st);
  // toggle buttons
  $('#btn-add-product').classList.add('hidden');
  $('#btn-update-product').classList.remove('hidden');
  $('#btn-cancel-edit').classList.remove('hidden');
  $('#prod-form-title').textContent = 'Edit Product';
}

function updateProductFromAdmin(){
  const st = read('ecocart_admin_state') || {};
  const editingId = st.editingProductId;
  if(!editingId) return alert('No product selected for edit');
  const products = read('ecocart_products') || [];
  const idx = products.findIndex(p=>p.id === editingId);
  if(idx === -1) return alert('Product not found');
  const name = $('#prod-name').value.trim();
  const category = $('#prod-category').value.trim() || 'Misc';
  const price = parseFloat($('#prod-price').value) || 0;
  const image = $('#prod-image').value.trim() || 'https://via.placeholder.com/400x300';
  const eco = $('#prod-eco').value.trim() || '';
  const plasticSaved = parseFloat($('#prod-plastic').value) || 0;
  const co2Saved = parseFloat($('#prod-co2').value) || 0;
  products[idx] = { ...products[idx], name, category, price, image, eco, plasticSaved, co2Saved };
  write('ecocart_products', products);
  // clear editing state
  st.editingProductId = null;
  write('ecocart_admin_state', st);
  // toggle buttons
  $('#btn-add-product').classList.remove('hidden');
  $('#btn-update-product').classList.add('hidden');
  $('#btn-cancel-edit').classList.add('hidden');
  $('#prod-form-title').textContent = 'Add Product';
  clearProductForm();
  renderCategoryFilters();
  renderProducts();
  renderAdminProducts();
  alert('Product updated');
}

function cancelEdit(){
  const st = read('ecocart_admin_state') || {};
  st.editingProductId = null;
  write('ecocart_admin_state', st);
  $('#btn-add-product').classList.remove('hidden');
  $('#btn-update-product').classList.add('hidden');
  $('#btn-cancel-edit').classList.add('hidden');
  $('#prod-form-title').textContent = 'Add Product';
  clearProductForm();
}

function clearProductForm(){
  $('#prod-name').value = '';
  $('#prod-category').value = '';
  $('#prod-price').value = '';
  $('#prod-image').value = '';
  $('#prod-eco').value = '';
  $('#prod-plastic').value = '';
  $('#prod-co2').value = '';
}

/* ---------- Reviews ---------- */
function submitReview(){
  const title = $('#review-title').value.trim();
  const body = $('#review-body').value.trim();
  const current = read('ecocart_currentUser') || {};
  if(!title || !body){ alert('Fill title and review'); return; }
  const reviews = read('ecocart_reviews') || [];
  reviews.unshift({id:uid(), title, body, by: current.login || current.name || 'Guest', date: new Date().toISOString()});
  write('ecocart_reviews', reviews);
  renderReviews();
  $('#review-title').value=''; $('#review-body').value='';
}

/* ---------- Contact ---------- */
function submitContact(e){
  e.preventDefault();
  const name = $('#contact-name').value.trim();
  const email = $('#contact-email').value.trim();
  const message = $('#contact-message').value.trim();
  if(!name || !email || !message){ alert('All fields required'); return; }
  const contacts = read('ecocart_contacts') || [];
  contacts.push({id:uid(), name, email, message, date: new Date().toISOString()});
  write('ecocart_contacts', contacts);
  alert('Thanks! Message sent.');
  $('#contact-form').reset();
}

/* ---------- Init & Event Binding ---------- */
function init(){
  renderCategoryFilters();
  renderProducts();
  renderCart();
  renderImpact();
  renderBlog();
  renderReviews();

  // nav actions
  $('#cta-shop').onclick = ()=>{ location.hash = '#products'; window.scrollTo(0, document.querySelector('#products').offsetTop - 60) };
  $('#cta-explore').onclick = ()=>{ location.hash = '#products'; window.scrollTo(0, document.querySelector('#products').offsetTop - 60) };
  $('#btn-cart').onclick = ()=>{
    document.querySelectorAll('.section').forEach(s=>s.classList.add('hidden'));
    $('#cart').classList.remove('hidden');
  };

  $('#btn-checkout').onclick = ()=> {
    // open payment modal to choose COD or Online
    openPaymentModal();
  };

  // payment modal handlers
  $('#payment-close').onclick = closePaymentModal;
  $('#pay-cod').onclick = checkoutCash;
  $('#pay-online').onclick = startOnlinePaymentDemo;
  $('#btn-pay-now').onclick = checkoutOnlineDemo;
  $('#btn-pay-cancel').onclick = closePaymentModal;

  // auth modal
  $('#btn-login').onclick = ()=>showAuthModal('login');
  $('#auth-close').onclick = hideAuthModal;
  $('#show-register').onclick = (e)=>{ e.preventDefault(); showAuthModal('register'); }
  $('#show-login').onclick = (e)=>{ e.preventDefault(); showAuthModal('login'); }
  $('#btn-do-register').onclick = doRegister;
  $('#btn-do-login').onclick = doLogin;

  // admin
  $('#btn-admin-login').onclick = adminLogin;
  $('#btn-add-product').onclick = addProductFromAdmin;
  $('#btn-update-product').onclick = updateProductFromAdmin;
  $('#btn-cancel-edit').onclick = cancelEdit;

  // reviews
  $('#btn-submit-review').onclick = submitReview;

  // contact
  $('#contact-form').onsubmit = submitContact;

  // cart count update on load
  renderCart();

  // admin section anchor show/hide
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',(e)=>{
      const target = a.getAttribute('href').slice(1);
      if(!target) return;
      document.querySelectorAll('.section').forEach(s=>s.classList.add('hidden'));
      const el = document.getElementById(target);
      if(el) el.classList.remove('hidden');
      // special handling for admin anchor
      if(target === 'admin'){ $('#admin-login').classList.remove('hidden'); $('#admin-dashboard').classList.add('hidden'); }
      e.preventDefault();
    });
  });

  // display Home by default
  document.querySelectorAll('.section').forEach(s=>s.classList.add('hidden'));
  document.getElementById('home').classList.remove('hidden');

  // update UI if logged in
  const current = read('ecocart_currentUser');
  if(current){
    $('#btn-login').textContent = `Hi, ${current.login}`;
  }
}

window.addEventListener('load', init);
