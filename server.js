const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const OWNER_MAPPINGS_FILE = 'ownerMappings.json';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function getNextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

async function readJson(fileName, fallback) {
  try {
    const filePath = path.join(DATA_DIR, fileName);
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

async function writeJson(fileName, data) {
  const filePath = path.join(DATA_DIR, fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/restaurants/:id', async (req, res) => {
  const restaurants = await readJson('restaurants.json', []);
  const restaurant = restaurants.find(r => r.id === Number(req.params.id));
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
  res.json(restaurant);
});

app.get('/api/orders', async (req, res) => {
  const orders = await readJson('orders.json', []);
  const email = req.query.email;
  const restaurantId = req.query.restaurantId;
  let filtered = orders;

  if (email) {
    filtered = filtered.filter(order => order.email === email);
  }
  if (restaurantId) {
    filtered = filtered.filter(order => order.restaurantId === Number(restaurantId));
  }

  res.json(filtered);
});

app.get('/api/orders/:id', async (req, res) => {
  const orders = await readJson('orders.json', []);
  const order = orders.find(o => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.post('/api/orders', async (req, res) => {
  const { items, total, comment, email, status, restaurantId } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must include at least one item.' });
  }

  const orders = await readJson('orders.json', []);
  const order = {
    id: Date.now(),
    items,
    total: Number(total).toFixed(2),
    comment: comment || '',
    email: email || 'guest',
    status: status || 'Pending',
    restaurantId: restaurantId ? Number(restaurantId) : null,
    createdAt: new Date().toISOString()
  };

  orders.push(order);
  await writeJson('orders.json', orders);
  res.status(201).json(order);
});

app.patch('/api/orders/:id', async (req, res) => {
  const orders = await readJson('orders.json', []);
  const order = orders.find(o => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const { status, comment, total, items } = req.body;
  if (status) order.status = status;
  if (comment !== undefined) order.comment = comment;
  if (total !== undefined) order.total = Number(total).toFixed(2);
  if (Array.isArray(items) && items.length > 0) order.items = items;
  order.updatedAt = new Date().toISOString();

  await writeJson('orders.json', orders);
  res.json(order);
});

app.get('/api/users', async (req, res) => {
  const users = await readJson('users.json', []);
  const { role, email } = req.query;
  let filtered = users;
  if (role) filtered = filtered.filter(u => u.role === role);
  if (email) filtered = filtered.filter(u => u.email === email);
  res.json(filtered);
});

app.get('/api/users/:id', async (req, res) => {
  const users = await readJson('users.json', []);
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.put('/api/users/:id', async (req, res) => {
  const users = await readJson('users.json', []);
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, email, password, role } = req.body;
  if (email && users.some(u => u.email === email && u.id !== user.id)) {
    return res.status(409).json({ error: 'Another user with that email already exists.' });
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (password) user.password = password;
  if (role) user.role = role;
  user.updatedAt = new Date().toISOString();

  await writeJson('users.json', users);
  res.json(user);
});

app.delete('/api/users/:id', async (req, res) => {
  let users = await readJson('users.json', []);
  const userIndex = users.findIndex(u => u.id === Number(req.params.id));
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
  const [removed] = users.splice(userIndex, 1);
  await writeJson('users.json', users);
  res.json({ removed });
});

app.get('/api/restaurants', async (req, res) => {
  const restaurants = await readJson('restaurants.json', []);
  const search = (req.query.search || '').toLowerCase().trim();
  if (!search) return res.json(restaurants);

  const filtered = restaurants.filter(r => {
    const inName = r.name.toLowerCase().includes(search) || (r.description || '').toLowerCase().includes(search);
    const inItems = Array.isArray(r.categories) && r.categories.some(category =>
      category.items.some(item => item.name.toLowerCase().includes(search))
    );
    return inName || inItems;
  });

  res.json(filtered);
});

app.post('/api/restaurants', async (req, res) => {
  const { name, description, rating, deliveryTime, categories } = req.body;
  if (!name || !deliveryTime) {
    return res.status(400).json({ error: 'Restaurant name and delivery time are required.' });
  }

  const restaurants = await readJson('restaurants.json', []);
  if (restaurants.some(r => r.name.toLowerCase() === name.toLowerCase())) {
    return res.status(409).json({ error: 'A restaurant with that name already exists.' });
  }

  const restaurant = {
    id: getNextId(restaurants),
    name,
    description: description || '',
    rating: rating !== undefined ? Number(rating) : 0,
    deliveryTime,
    categories: Array.isArray(categories) ? categories : []
  };

  restaurants.push(restaurant);
  await writeJson('restaurants.json', restaurants);
  res.status(201).json(restaurant);
});

app.put('/api/restaurants/:id', async (req, res) => {
  const restaurants = await readJson('restaurants.json', []);
  const restaurant = restaurants.find(r => r.id === Number(req.params.id));
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

  const { name, description, rating, deliveryTime, categories } = req.body;
  if (name) restaurant.name = name;
  if (description !== undefined) restaurant.description = description;
  if (rating !== undefined) restaurant.rating = Number(rating);
  if (deliveryTime) restaurant.deliveryTime = deliveryTime;
  if (categories !== undefined) restaurant.categories = Array.isArray(categories) ? categories : restaurant.categories;
  restaurant.updatedAt = new Date().toISOString();

  await writeJson('restaurants.json', restaurants);
  res.json(restaurant);
});

app.delete('/api/restaurants/:id', async (req, res) => {
  let restaurants = await readJson('restaurants.json', []);
  const index = restaurants.findIndex(r => r.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Restaurant not found' });
  const [removed] = restaurants.splice(index, 1);
  await writeJson('restaurants.json', restaurants);
  res.json({ removed });
});

app.post('/api/restaurants/:id/items', async (req, res) => {
  const restaurants = await readJson('restaurants.json', []);
  const restaurant = restaurants.find(r => r.id === Number(req.params.id));
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

  const { category, name, price } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Item name and price are required.' });
  }

  const categoryName = category || 'Menu';
  let categoryObj = restaurant.categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
  if (!categoryObj) {
    categoryObj = { name: categoryName, items: [] };
    restaurant.categories.push(categoryObj);
  }

  if (categoryObj.items.some(item => item.name.toLowerCase() === name.toLowerCase())) {
    return res.status(409).json({ error: 'An item with that name already exists in this category.' });
  }

  categoryObj.items.push({ name, price: Number(price) });
  restaurant.updatedAt = new Date().toISOString();
  await writeJson('restaurants.json', restaurants);
  res.status(201).json(restaurant);
});

app.put('/api/restaurants/:id/items', async (req, res) => {
  const restaurants = await readJson('restaurants.json', []);
  const restaurant = restaurants.find(r => r.id === Number(req.params.id));
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

  const { category, originalName, name, price } = req.body;
  if (!category || !originalName || !name || price === undefined) {
    return res.status(400).json({ error: 'Category, originalName, name, and price are required.' });
  }

  const categoryObj = restaurant.categories.find(c => c.name.toLowerCase() === category.toLowerCase());
  if (!categoryObj) return res.status(404).json({ error: 'Category not found.' });

  const item = categoryObj.items.find(item => item.name.toLowerCase() === originalName.toLowerCase());
  if (!item) return res.status(404).json({ error: 'Item not found.' });

  item.name = name;
  item.price = Number(price);
  restaurant.updatedAt = new Date().toISOString();
  await writeJson('restaurants.json', restaurants);
  res.json(restaurant);
});

app.delete('/api/restaurants/:id/items', async (req, res) => {
  const restaurants = await readJson('restaurants.json', []);
  const restaurant = restaurants.find(r => r.id === Number(req.params.id));
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

  const { category, name } = req.body;
  if (!category || !name) {
    return res.status(400).json({ error: 'Category and item name are required.' });
  }

  const categoryObj = restaurant.categories.find(c => c.name.toLowerCase() === category.toLowerCase());
  if (!categoryObj) return res.status(404).json({ error: 'Category not found.' });

  const itemIndex = categoryObj.items.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
  if (itemIndex === -1) return res.status(404).json({ error: 'Item not found.' });

  categoryObj.items.splice(itemIndex, 1);
  restaurant.updatedAt = new Date().toISOString();
  await writeJson('restaurants.json', restaurants);
  res.json(restaurant);
});

app.get('/api/owner-mappings', async (req, res) => {
  const mappings = await readJson(OWNER_MAPPINGS_FILE, {});
  res.json(mappings);
});

app.post('/api/owner-mappings', async (req, res) => {
  const { email, restaurantIds } = req.body;
  if (!email || !Array.isArray(restaurantIds)) {
    return res.status(400).json({ error: 'Owner email and restaurantIds array are required.' });
  }

  const mappings = await readJson(OWNER_MAPPINGS_FILE, {});
  mappings[email.toLowerCase()] = restaurantIds.map(id => Number(id));
  await writeJson(OWNER_MAPPINGS_FILE, mappings);
  res.status(201).json({ email: email.toLowerCase(), restaurantIds: mappings[email.toLowerCase()] });
});

app.delete('/api/owner-mappings/:email', async (req, res) => {
  const mappings = await readJson(OWNER_MAPPINGS_FILE, {});
  const email = req.params.email.toLowerCase();
  if (!mappings[email]) {
    return res.status(404).json({ error: 'Owner mapping not found.' });
  }

  delete mappings[email];
  await writeJson(OWNER_MAPPINGS_FILE, mappings);
  res.json({ email, deleted: true });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const users = await readJson('users.json', []);
  if (users.some(u => u.email === email)) {
    return res.status(409).json({ error: 'A user with that email already exists.' });
  }

  const user = {
    id: Date.now(),
    name,
    email,
    password,
    role: role || 'student',
    createdAt: new Date().toISOString()
  };

  users.push(user);
  await writeJson('users.json', users);
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = await readJson('users.json', []);
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`UniEats backend running at http://localhost:${PORT}`);
});
