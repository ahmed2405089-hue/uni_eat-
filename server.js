require('dotenv').config();
const express     = require('express');
const http        = require('http');
const path        = require('path');
const morgan      = require('morgan');
const helmet      = require('helmet');
const cors        = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser  = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const { Server } = require('socket.io');

const connectDB     = require('./src/config/database');
const errorHandler  = require('./src/middleware/errorHandler');
const { optionalAuth } = require('./src/middleware/auth');
const ApiError      = require('./src/utils/ApiError');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

// ── Database ─────────────────────────────────────────
connectDB();

// ── Security headers ──────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
      styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      fontSrc:     ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
      imgSrc:      ["'self'", 'data:', 'https:'],
      connectSrc:  ["'self'", 'ws:', 'wss:'],
    },
  },
}));

app.use(cors({ origin: process.env.NODE_ENV === 'production' ? false : '*', credentials: true }));
app.use(mongoSanitize());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Body parsing ─────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ── Static files ─────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// ── View engine ───────────────────────────────────────
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// ── Template locals ───────────────────────────────────
app.use((req, res, next) => {
  res.locals.user    = null;
  res.locals.success = null;
  res.locals.error   = null;
  next();
});

app.use(optionalAuth);

// ── Page routes ───────────────────────────────────────
app.use('/', require('./src/routes/pages'));

// ── API routes ────────────────────────────────────────
app.use('/api/auth',        require('./src/routes/auth'));
app.use('/api/restaurants', require('./src/routes/restaurants'));
app.use('/api/orders',      require('./src/routes/orders'));
app.use('/api/users',       require('./src/routes/users'));
app.use('/api/admin',       require('./src/routes/admin'));

app.all('/api/*', (req, res, next) =>
  next(new ApiError(`Cannot find ${req.originalUrl}`, 404))
);

// ── Socket.io ─────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join',      (userId)  => socket.join(`user_${userId}`));
  socket.on('joinOwner', (ownerId) => socket.join(`owner_${ownerId}`));
});

// ── Global error handler ──────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n  UniEats is running → http://localhost:${PORT}`);
  console.log(`  Mode: ${process.env.NODE_ENV || 'development'}\n`);
});
