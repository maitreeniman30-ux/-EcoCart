// simple lowdb JSON DB wrapper
const { Low, JSONFile } = require('lowdb');
const { join } = require('path');
const { nanoid } = require('nanoid');

const file = join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

async function init() {
  await db.read();
  db.data = db.data || { users: [], products: [], orders: [], contacts: [], reviews: [] };

  // seed admin user if not exists
  if (!db.data.users.find(u => u.login === 'Maitree29')) {
    const bcrypt = require('bcryptjs');
    const passHash = bcrypt.hashSync('001', 8);
    db.data.users.push({ id: nanoid(), login: 'Maitree29', name: 'Admin', email: 'admin@ecocart.local', password: passHash, role: 'admin' });
  }

  // seed some products if empty
  if (!db.data.products || db.data.products.length === 0) {
    const seed = [
      {
        id: 'p1',
        name: 'Reusable Cotton Bag',
        category: 'Reusable Bags',
        price: 9.99,
        image: 'https://images.unsplash.com/photo-1603354351875-8546a6a7f2c
