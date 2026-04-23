#!/bin/bash

# ============================================================
#   Smart Business OS — Auto Setup Script
#   Run: bash setup.sh
#   Creates the full project with all files automatically
# ============================================================

set -e  # Exit on error

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_banner() {
  echo ""
  echo -e "${PURPLE}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${PURPLE}║        🚀  SMART BUSINESS OS — AUTO SETUP               ║${NC}"
  echo -e "${PURPLE}║        AI-Powered Business Dashboard                     ║${NC}"
  echo -e "${PURPLE}║        Full Stack: React + Node + MongoDB + Socket.io    ║${NC}"
  echo -e "${PURPLE}╚══════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_step() {
  echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ✅  $1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_file() {
  echo -e "  ${BLUE}📄  Creating: $1${NC}"
}

PROJECT_NAME="smart-business-os"
CURRENT_DIR_NAME="$(basename "$PWD")"

if [ "$CURRENT_DIR_NAME" = "$PROJECT_NAME" ]; then
  ROOT="."
else
  ROOT="$PROJECT_NAME"
fi

print_banner

echo -e "${YELLOW}📦  This script will create the full Smart Business OS project.${NC}"
echo -e "${YELLOW}⚙️   Prerequisites: Node.js 18+, MongoDB${NC}"
echo ""

# ============================================================
# CHECK NODE.JS
# ============================================================
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌  Node.js not found! Please install Node.js 18+ first.${NC}"
  echo "    Download: https://nodejs.org"
  exit 1
fi

NODE_VER=$(node -v)
echo -e "${GREEN}✅  Node.js found: $NODE_VER${NC}"

if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌  npm not found!${NC}"
  exit 1
fi

# ============================================================
# CREATE ROOT DIRECTORY
# ============================================================
print_step "Creating project structure"

if [ "$ROOT" != "." ] && [ -d "$ROOT" ]; then
  echo -e "${YELLOW}⚠️   Directory '$ROOT' already exists. Removing...${NC}"
  rm -rf "$ROOT"
fi

if [ "$ROOT" != "." ]; then
  mkdir -p "$ROOT"
  cd "$ROOT"
else
  echo -e "${YELLOW}âš ï¸   Using current directory as project root.${NC}"
fi

# ============================================================
# ============================================================
#   BACKEND — SERVER
# ============================================================
# ============================================================
print_step "Setting up Backend (Node.js + Express)"

mkdir -p server/{config,controllers,middleware,models,routes,services,utils}

# ---- server/package.json ----
print_file "server/package.json"
cat > server/package.json << 'PKGJSON'
{
  "name": "smart-business-os-server",
  "version": "1.0.0",
  "description": "Smart Business OS Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.3",
    "morgan": "^1.10.0",
    "socket.io": "^4.6.1",
    "xlsx": "^0.18.5",
    "pdfkit": "^0.14.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
PKGJSON

# ---- server/.env ----
print_file "server/.env"
cat > server/.env << 'ENVFILE'
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smart-business-os
JWT_SECRET=smart_business_os_super_secret_key_change_in_production_2024
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ENVFILE

# ---- server/utils/asyncHandler.js ----
print_file "server/utils/asyncHandler.js"
cat > server/utils/asyncHandler.js << 'ASYNCHANDLER'
/**
 * Async Handler - eliminates try/catch boilerplate
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
module.exports = asyncHandler;
ASYNCHANDLER

# ---- server/config/db.js ----
print_file "server/config/db.js"
cat > server/config/db.js << 'DBCONFIG'
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    mongoose.connection.on('error', err => console.error('❌ MongoDB error:', err));
    mongoose.connection.on('disconnected', () => console.warn('⚠️ MongoDB disconnected'));
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};
module.exports = connectDB;
DBCONFIG

# ---- server/config/socket.js ----
print_file "server/config/socket.js"
cat > server/config/socket.js << 'SOCKETCONFIG'
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication token required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User ${socket.userId} connected`);
    socket.join(`user_${socket.userId}`);
    socket.on('subscribe:dashboard', () => {
      socket.join(`dashboard_${socket.userId}`);
      socket.emit('dashboard:subscribed', { message: 'Subscribed to live dashboard' });
    });
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User ${socket.userId} disconnected: ${reason}`);
    });
  });

  return io;
};

const emitToUser = (userId, event, data) => {
  if (io) io.to(`user_${userId}`).emit(event, data);
};

const emitDashboardUpdate = (userId, data) => {
  if (io) io.to(`dashboard_${userId}`).emit('dashboard:update', data);
};

const getIO = () => io;

module.exports = { initSocket, emitToUser, emitDashboardUpdate, getIO };
SOCKETCONFIG

# ---- server/models/User.js ----
print_file "server/models/User.js"
cat > server/models/User.js << 'USERMODEL'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Please provide a name'],
    trim: true, minlength: 2, maxlength: 50
  },
  email: {
    type: String, required: [true, 'Please provide an email'],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String, required: [true, 'Please provide a password'],
    minlength: 6, select: false
  },
  businessName: { type: String, default: 'My Business' },
  businessType: {
    type: String,
    enum: ['general', 'shop', 'gym', 'clinic', 'restaurant', 'freelance', 'other'],
    default: 'general'
  },
  currency: { type: String, default: '₹' },
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'pro', 'enterprise'], default: 'free' },
    isActive: { type: Boolean, default: true }
  },
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  notifications: {
    email: { type: Boolean, default: true },
    highExpense: { type: Boolean, default: true },
    lowProfit: { type: Boolean, default: true }
  },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: Date.now }
}, { timestamps: true });

UserSchema.index({ email: 1 });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.generateToken = function() {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

module.exports = mongoose.model('User', UserSchema);
USERMODEL

# ---- server/models/Transaction.js ----
print_file "server/models/Transaction.js"
cat > server/models/Transaction.js << 'TXMODEL'
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['sale', 'expense'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  amount: { type: Number, required: true, min: 0 },
  category: {
    type: String, required: true,
    enum: [
      'rent', 'salary', 'marketing', 'utilities', 'supplies', 'equipment',
      'insurance', 'transport', 'food', 'maintenance', 'taxes', 'subscription',
      'miscellaneous', 'product_sale', 'service', 'consultation',
      'subscription_revenue', 'refund', 'other_income'
    ]
  },
  description: { type: String, trim: true, maxlength: 500 },
  date: { type: Date, default: Date.now, required: true, index: true },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque', 'other'],
    default: 'cash'
  },
  reference: { type: String, trim: true },
  tags: [{ type: String, trim: true }],
  isRecurring: { type: Boolean, default: false },
  status: { type: String, enum: ['completed', 'pending', 'cancelled'], default: 'completed' }
}, { timestamps: true });

TransactionSchema.index({ user: 1, date: -1 });
TransactionSchema.index({ user: 1, type: 1, date: -1 });
TransactionSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
TXMODEL

# ---- server/models/Notification.js ----
print_file "server/models/Notification.js"
cat > server/models/Notification.js << 'NOTIFMODEL'
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
  category: {
    type: String,
    enum: ['expense_alert', 'profit_alert', 'sales_milestone', 'system', 'ai_insight'],
    default: 'system'
  },
  isRead: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

NotificationSchema.index({ user: 1, isRead: 1 });
NotificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
NOTIFMODEL

# ---- server/middleware/authMiddleware.js ----
print_file "server/middleware/authMiddleware.js"
cat > server/middleware/authMiddleware.js << 'AUTHMW'
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

const requirePlan = (...plans) => (req, res, next) => {
  if (!plans.includes(req.user.subscription.plan)) {
    return res.status(403).json({
      success: false,
      message: `This feature requires ${plans.join(' or ')} plan`,
      upgrade: true
    });
  }
  next();
};

module.exports = { protect, requirePlan };
AUTHMW

# ---- server/middleware/errorHandler.js ----
print_file "server/middleware/errorHandler.js"
cat > server/middleware/errorHandler.js << 'ERRORHNDL'
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') console.error('❌ Error:', err);

  if (err.name === 'CastError') { message = `Resource not found: ${err.value}`; statusCode = 404; }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    statusCode = 400;
  }
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(v => v.message).join(', ');
    statusCode = 400;
  }
  if (err.name === 'JsonWebTokenError') { message = 'Invalid token'; statusCode = 401; }
  if (err.name === 'TokenExpiredError') { message = 'Token expired, please login again'; statusCode = 401; }

  res.status(statusCode).json({
    success: false, message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
module.exports = errorHandler;
ERRORHNDL

# ---- server/controllers/authController.js ----
print_file "server/controllers/authController.js"
cat > server/controllers/authController.js << 'AUTHCTRL'
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, businessName, businessType } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
  }
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

  const user = await User.create({
    name, email: email.toLowerCase(), password,
    businessName: businessName || 'My Business',
    businessType: businessType || 'general'
  });
  const token = user.generateToken();

  res.status(201).json({
    success: true, message: 'Account created successfully!', token,
    user: {
      id: user._id, name: user.name, email: user.email,
      businessName: user.businessName, businessType: user.businessType,
      currency: user.currency, theme: user.theme, subscription: user.subscription
    }
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  const token = user.generateToken();
  res.status(200).json({
    success: true, message: `Welcome back, ${user.name}!`, token,
    user: {
      id: user._id, name: user.name, email: user.email,
      businessName: user.businessName, businessType: user.businessType,
      currency: user.currency, theme: user.theme, subscription: user.subscription,
      lastLogin: user.lastLogin
    }
  });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, businessName, businessType, currency, theme, notifications } = req.body;
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { name, businessName, businessType, currency, theme, notifications },
    { new: true, runValidators: true }
  );
  res.status(200).json({ success: true, message: 'Profile updated!', user: updatedUser });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  user.password = newPassword;
  await user.save();
  res.status(200).json({ success: true, message: 'Password changed successfully' });
});
AUTHCTRL

# ---- server/controllers/transactionController.js ----
print_file "server/controllers/transactionController.js"
cat > server/controllers/transactionController.js << 'TXCTRL'
const Transaction = require('../models/Transaction');
const { emitDashboardUpdate } = require('../config/socket');
const asyncHandler = require('../utils/asyncHandler');
const { checkAndCreateNotifications } = require('./notificationController');

exports.getTransactions = asyncHandler(async (req, res) => {
  const { type, category, startDate, endDate, page = 1, limit = 20, search, sortBy = 'date', sortOrder = 'desc' } = req.query;

  const filter = { user: req.user.id };
  if (type && type !== 'all') filter.type = type;
  if (category) filter.category = category;
  if (search) filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }
  ];
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
    Transaction.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true, data: transactions,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
  });
});

exports.createTransaction = asyncHandler(async (req, res) => {
  req.body.user = req.user.id;
  const transaction = await Transaction.create(req.body);

  await checkAndCreateNotifications(req.user.id, transaction, req.app.get('io'));
  emitDashboardUpdate(req.user.id, {
    type: 'new_transaction', transaction,
    message: `New ${transaction.type} of ₹${transaction.amount} added`
  });

  res.status(201).json({ success: true, message: 'Transaction created!', data: transaction });
});

exports.getTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user.id });
  if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
  res.status(200).json({ success: true, data: transaction });
});

exports.updateTransaction = asyncHandler(async (req, res) => {
  let transaction = await Transaction.findOne({ _id: req.params.id, user: req.user.id });
  if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

  transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  emitDashboardUpdate(req.user.id, { type: 'updated_transaction', transaction });

  res.status(200).json({ success: true, message: 'Transaction updated!', data: transaction });
});

exports.deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user.id });
  if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
  await transaction.deleteOne();
  emitDashboardUpdate(req.user.id, { type: 'deleted_transaction', transactionId: req.params.id });
  res.status(200).json({ success: true, message: 'Transaction deleted' });
});

exports.getSummary = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week': startDate = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
    case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1); break;
    case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
    default: startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const summary = await Transaction.aggregate([
    { $match: { user: req.user._id, date: { $gte: startDate }, status: 'completed' } },
    { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 }, avg: { $avg: '$amount' } } }
  ]);

  const result = { totalSales: 0, salesCount: 0, totalExpenses: 0, expenseCount: 0, profit: 0, profitMargin: 0, period, startDate };
  summary.forEach(item => {
    if (item._id === 'sale') { result.totalSales = item.total; result.salesCount = item.count; }
    else if (item._id === 'expense') { result.totalExpenses = item.total; result.expenseCount = item.count; }
  });
  result.profit = result.totalSales - result.totalExpenses;
  result.profitMargin = result.totalSales > 0 ? ((result.profit / result.totalSales) * 100).toFixed(2) : 0;

  res.status(200).json({ success: true, data: result });
});
TXCTRL

# ---- server/controllers/notificationController.js ----
print_file "server/controllers/notificationController.js"
cat > server/controllers/notificationController.js << 'NOTIFCTRL'
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const { emitToUser } = require('../config/socket');

const checkAndCreateNotifications = async (userId, transaction, io) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  if (transaction.type === 'expense') {
    if (transaction.amount >= 10000) {
      const notif = await Notification.create({
        user: userId,
        title: 'High Expense Alert',
        message: `A large expense of ₹${transaction.amount.toLocaleString('en-IN')} was recorded under "${transaction.category}".`,
        type: 'warning', category: 'expense_alert',
        data: { transactionId: transaction._id, amount: transaction.amount }
      });
      emitToUser(userId, 'notification:new', notif);
    }

    const [monthlyExpenses, monthlySales] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: monthStart }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: 'sale', date: { $gte: monthStart }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalExpenses = monthlyExpenses[0]?.total || 0;
    const totalSales = monthlySales[0]?.total || 0;
    const profit = totalSales - totalExpenses;

    if (totalSales > 0 && profit < 0) {
      const existing = await Notification.findOne({ user: userId, category: 'profit_alert', createdAt: { $gte: monthStart } });
      if (!existing) {
        const notif = await Notification.create({
          user: userId,
          title: 'Negative Profit Warning',
          message: `Your business is running at a loss this month. Expenses exceed sales by ₹${Math.abs(profit).toLocaleString('en-IN')}.`,
          type: 'error', category: 'profit_alert',
          data: { profit, totalSales, totalExpenses }
        });
        emitToUser(userId, 'notification:new', notif);
      }
    }
  }
};

exports.getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const filter = { user: req.user.id };
  if (unreadOnly === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user.id, isRead: false })
  ]);

  res.status(200).json({ success: true, data: notifications, total, unreadCount });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  await Notification.updateMany({ _id: { $in: ids }, user: req.user.id }, { isRead: true });
  res.status(200).json({ success: true, message: 'Marked as read' });
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: 'All marked as read' });
});

exports.checkAndCreateNotifications = checkAndCreateNotifications;
NOTIFCTRL

# ---- server/controllers/analyticsController.js ----
print_file "server/controllers/analyticsController.js"
cat > server/controllers/analyticsController.js << 'ANALYTICSCTRL'
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');

exports.getChartData = asyncHandler(async (req, res) => {
  const { view = 'monthly', year } = req.query;
  const now = new Date();
  const targetYear = parseInt(year) || now.getFullYear();

  let matchStage, groupStage;

  if (view === 'daily') {
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    matchStage = { user: req.user._id, date: { $gte: thirtyDaysAgo }, status: 'completed' };
    groupStage = { _id: { type: '$type', day: { $dayOfMonth: '$date' }, month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } };
  } else if (view === 'weekly') {
    const twelveWeeksAgo = new Date(now - 84 * 24 * 60 * 60 * 1000);
    matchStage = { user: req.user._id, date: { $gte: twelveWeeksAgo }, status: 'completed' };
    groupStage = { _id: { type: '$type', week: { $week: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } };
  } else {
    matchStage = { user: req.user._id, date: { $gte: new Date(targetYear, 0, 1), $lte: new Date(targetYear, 11, 31) }, status: 'completed' };
    groupStage = { _id: { type: '$type', month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } };
  }

  const data = await Transaction.aggregate([
    { $match: matchStage }, { $group: groupStage },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const salesData = {}, expenseData = {};

  data.forEach(item => {
    let label;
    if (view === 'daily') label = `${item._id.day}/${item._id.month}`;
    else if (view === 'weekly') label = `W${item._id.week}`;
    else label = monthNames[(item._id.month - 1)];

    if (item._id.type === 'sale') salesData[label] = (salesData[label] || 0) + item.total;
    else expenseData[label] = (expenseData[label] || 0) + item.total;
  });

  const allLabels = [...new Set([...Object.keys(salesData), ...Object.keys(expenseData)])];

  res.status(200).json({
    success: true,
    data: {
      labels: allLabels,
      sales: allLabels.map(l => salesData[l] || 0),
      expenses: allLabels.map(l => expenseData[l] || 0),
      profit: allLabels.map(l => (salesData[l] || 0) - (expenseData[l] || 0))
    }
  });
});

exports.getCategoryBreakdown = asyncHandler(async (req, res) => {
  const { type = 'expense', period = 'month' } = req.query;
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week': startDate = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
    case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
    default: startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const data = await Transaction.aggregate([
    { $match: { user: req.user._id, type, date: { $gte: startDate }, status: 'completed' } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ]);

  const total = data.reduce((sum, item) => sum + item.total, 0);

  res.status(200).json({
    success: true,
    data: data.map(item => ({
      category: item._id, total: item.total, count: item.count,
      percentage: total > 0 ? ((item.total / total) * 100).toFixed(1) : 0
    })),
    total
  });
});

exports.getMonthlyReport = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const now = new Date();
  const targetYear = parseInt(year) || now.getFullYear();
  const targetMonth = parseInt(month) !== undefined ? parseInt(month) : now.getMonth();

  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
  const prevStart = new Date(targetYear, targetMonth - 1, 1);
  const prevEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const [current, previous] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate }, status: 'completed' } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: prevStart, $lte: prevEnd }, status: 'completed' } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ])
  ]);

  const parse = (arr) => {
    const r = { sales: 0, expenses: 0 };
    arr.forEach(i => { if (i._id === 'sale') r.sales = i.total; if (i._id === 'expense') r.expenses = i.total; });
    r.profit = r.sales - r.expenses;
    return r;
  };

  const curr = parse(current);
  const prev = parse(previous);
  const growth = (c, p) => p > 0 ? (((c - p) / p) * 100).toFixed(1) : 0;

  res.status(200).json({
    success: true,
    data: {
      period: { year: targetYear, month: targetMonth },
      current: curr, previous: prev,
      growth: { sales: growth(curr.sales, prev.sales), expenses: growth(curr.expenses, prev.expenses), profit: growth(curr.profit, prev.profit) }
    }
  });
});
ANALYTICSCTRL

# ---- server/services/aiService.js ----
print_file "server/services/aiService.js"
cat > server/services/aiService.js << 'AISERVICE'
const Transaction = require('../models/Transaction');

class AIService {
  async predictNextMonthSales(userId) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const data = await Transaction.aggregate([
      { $match: { user: userId, type: 'sale', date: { $gte: sixMonthsAgo }, status: 'completed' } },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    if (data.length < 2) return { prediction: null, confidence: 'low', message: 'Not enough data (need 2+ months)' };

    const n = data.length;
    const x = data.map((_, i) => i + 1);
    const y = data.map(d => d.total);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const prediction = Math.max(0, slope * (n + 1) + intercept);

    const yMean = sumY / n;
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    const confidence = r2 > 0.8 ? 'high' : r2 > 0.5 ? 'medium' : 'low';

    return {
      prediction: Math.round(prediction), confidence,
      trend: slope > 0 ? 'upward' : slope < 0 ? 'downward' : 'stable',
      r2: r2.toFixed(3), historicalData: data,
      message: `Predicted next month's sales: ₹${Math.round(prediction).toLocaleString('en-IN')}`
    };
  }

  async detectExpenseSpikes(userId) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const expenses = await Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: { $gte: threeMonthsAgo }, status: 'completed' } },
      { $group: { _id: { year: { $year: '$date' }, week: { $week: '$date' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]);

    if (expenses.length < 3) return { spikes: [], message: 'Insufficient data' };

    const values = expenses.map(e => e.total);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

    const spikes = expenses.filter(e => Math.abs((e.total - mean) / stdDev) > 1.5)
      .map(e => ({ week: e._id.week, year: e._id.year, amount: e.total, deviation: (((e.total - mean) / mean) * 100).toFixed(1) }));

    return { spikes, averageWeeklyExpense: Math.round(mean), message: spikes.length > 0 ? `Detected ${spikes.length} unusual expense spike(s)` : 'No unusual spikes detected' };
  }

  async generateInsights(userId) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [thisMonth, lastMonth, categoryData] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, date: { $gte: thisMonthStart }, status: 'completed' } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId, date: { $gte: lastMonthStart, $lte: lastMonthEnd }, status: 'completed' } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: thisMonthStart }, status: 'completed' } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } }, { $limit: 3 }
      ])
    ]);

    const parse = (arr) => {
      const r = { sales: 0, expenses: 0 };
      arr.forEach(i => { if (i._id === 'sale') r.sales = i.total; if (i._id === 'expense') r.expenses = i.total; });
      r.profit = r.sales - r.expenses; return r;
    };

    const curr = parse(thisMonth), prev = parse(lastMonth);
    const insights = [];

    if (prev.sales > 0) {
      const salesChange = ((curr.sales - prev.sales) / prev.sales * 100).toFixed(1);
      if (parseFloat(salesChange) > 10) insights.push({ type: 'success', icon: '📈', title: 'Sales Growing!', message: `Sales increased by ${salesChange}% vs last month!`, priority: 'high' });
      else if (parseFloat(salesChange) < -10) insights.push({ type: 'warning', icon: '📉', title: 'Sales Declining', message: `Sales dropped by ${Math.abs(salesChange)}%. Consider running promotions.`, priority: 'high' });
    }

    if (prev.expenses > 0) {
      const expChange = ((curr.expenses - prev.expenses) / prev.expenses * 100).toFixed(1);
      if (parseFloat(expChange) > 20) insights.push({ type: 'warning', icon: '⚠️', title: 'Expense Alert', message: `Expenses increased by ${expChange}% this month vs last month.`, priority: 'high' });
    }

    if (curr.sales > 0) {
      const margin = ((curr.profit / curr.sales) * 100).toFixed(1);
      if (parseFloat(margin) < 20) insights.push({ type: 'warning', icon: '💰', title: 'Low Profit Margin', message: `Current margin is ${margin}%. Consider reducing expenses.`, priority: 'medium' });
      else if (parseFloat(margin) > 50) insights.push({ type: 'success', icon: '🎯', title: 'Excellent Margins!', message: `Your profit margin is ${margin}%. Outstanding!`, priority: 'low' });
    }

    if (categoryData.length > 0) {
      const top = categoryData[0];
      insights.push({ type: 'info', icon: '📊', title: 'Top Expense Category', message: `"${top._id.replace(/_/g, ' ')}" is your highest expense at ₹${top.total.toLocaleString('en-IN')}.`, priority: 'medium' });
    }

    if (curr.profit < 0) insights.push({ type: 'error', icon: '🚨', title: 'Negative Cash Flow!', message: `Running at a loss of ₹${Math.abs(curr.profit).toLocaleString('en-IN')} this month. Act now!`, priority: 'critical' });

    return { insights: insights.sort((a, b) => ({ critical: 0, high: 1, medium: 2, low: 3 }[a.priority] - { critical: 0, high: 1, medium: 2, low: 3 }[b.priority])), summary: curr };
  }

  async processChatQuery(userId, query) {
    const lowerQuery = query.toLowerCase();
    const now = new Date();
    let response = '', data = null, intent = 'unknown';

    if (lowerQuery.includes('sales') || lowerQuery.includes('revenue')) {
      intent = 'sales_query';
      let startDate, label;
      if (lowerQuery.includes('today')) { startDate = new Date(now.setHours(0,0,0,0)); label = 'today'; }
      else if (lowerQuery.includes('week')) { startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); label = 'this week'; }
      else if (lowerQuery.includes('year')) { startDate = new Date(now.getFullYear(), 0, 1); label = 'this year'; }
      else { startDate = new Date(now.getFullYear(), now.getMonth(), 1); label = 'this month'; }

      const d = await Transaction.aggregate([
        { $match: { user: userId, type: 'sale', date: { $gte: startDate }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]);
      const total = d[0]?.total || 0, count = d[0]?.count || 0;
      response = `💰 Total sales ${label}: ₹${total.toLocaleString('en-IN')} across ${count} transaction${count !== 1 ? 's' : ''}.`;
      data = { total, count };
    } else if (lowerQuery.includes('expense') || lowerQuery.includes('spending')) {
      intent = 'expense_query';
      let startDate, label;
      if (lowerQuery.includes('week')) { startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); label = 'this week'; }
      else { startDate = new Date(now.getFullYear(), now.getMonth(), 1); label = 'this month'; }

      const d = await Transaction.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: startDate }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]);
      response = `💸 Total expenses ${label}: ₹${(d[0]?.total || 0).toLocaleString('en-IN')} across ${d[0]?.count || 0} entries.`;
    } else if (lowerQuery.includes('highest') || lowerQuery.includes('top') || lowerQuery.includes('category')) {
      intent = 'category_query';
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const catData = await Transaction.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: startDate }, status: 'completed' } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } }, { $limit: 3 }
      ]);
      if (catData.length > 0) {
        response = `📊 Highest expense: **${catData[0]._id.replace(/_/g, ' ')}** at ₹${catData[0].total.toLocaleString('en-IN')}\n\nTop 3:\n${catData.map((c, i) => `${i+1}. ${c._id.replace(/_/g,' ')}: ₹${c.total.toLocaleString('en-IN')}`).join('\n')}`;
        data = catData;
      } else response = '📊 No expense data this month.';
    } else if (lowerQuery.includes('profit') || lowerQuery.includes('margin')) {
      intent = 'profit_query';
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const d = await Transaction.aggregate([
        { $match: { user: userId, date: { $gte: startDate }, status: 'completed' } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } }
      ]);
      let sales = 0, expenses = 0;
      d.forEach(i => { if (i._id === 'sale') sales = i.total; if (i._id === 'expense') expenses = i.total; });
      const profit = sales - expenses;
      const margin = sales > 0 ? ((profit / sales) * 100).toFixed(1) : 0;
      response = `${profit >= 0 ? '✅' : '🚨'} This month:\n📈 Sales: ₹${sales.toLocaleString('en-IN')}\n📉 Expenses: ₹${expenses.toLocaleString('en-IN')}\n💰 Profit: ₹${profit.toLocaleString('en-IN')}\n📊 Margin: ${margin}%`;
    } else if (lowerQuery.includes('recent') || lowerQuery.includes('latest')) {
      intent = 'recent_query';
      const recent = await Transaction.find({ user: userId }).sort({ date: -1 }).limit(5).select('type title amount category date');
      response = recent.length > 0
        ? `📋 Last ${recent.length} transactions:\n\n${recent.map(t => `${t.type === 'sale' ? '💚' : '🔴'} ${t.title} — ₹${t.amount.toLocaleString('en-IN')}`).join('\n')}`
        : '📋 No transactions found.';
      data = recent;
    } else if (lowerQuery.includes('help')) {
      response = `🤖 I can help with:\n• "Show weekly sales"\n• "What are my expenses?"\n• "Highest expense category"\n• "What is my profit?"\n• "Show recent transactions"`;
    } else {
      response = `🤖 Try: "Show weekly sales", "My profit this month", "Top expense category", or type "help".`;
    }

    return { intent, response, data, timestamp: new Date() };
  }
}

module.exports = new AIService();
AISERVICE

# ---- server/controllers/aiController.js ----
print_file "server/controllers/aiController.js"
cat > server/controllers/aiController.js << 'AICTRL'
const aiService = require('../services/aiService');
const asyncHandler = require('../utils/asyncHandler');

exports.getInsights = asyncHandler(async (req, res) => {
  const insights = await aiService.generateInsights(req.user._id);
  res.status(200).json({ success: true, data: insights });
});

exports.getPrediction = asyncHandler(async (req, res) => {
  const prediction = await aiService.predictNextMonthSales(req.user._id);
  res.status(200).json({ success: true, data: prediction });
});

exports.getExpenseSpikes = asyncHandler(async (req, res) => {
  const spikes = await aiService.detectExpenseSpikes(req.user._id);
  res.status(200).json({ success: true, data: spikes });
});

exports.chatQuery = asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query?.trim()) return res.status(400).json({ success: false, message: 'Query is required' });
  const response = await aiService.processChatQuery(req.user._id, query.trim());
  res.status(200).json({ success: true, data: response });
});
AICTRL

# ---- server/routes/*.js ----
print_file "server/routes/authRoutes.js"
cat > server/routes/authRoutes.js << 'AUTHROUTES'
const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
AUTHROUTES

print_file "server/routes/transactionRoutes.js"
cat > server/routes/transactionRoutes.js << 'TXROUTES'
const express = require('express');
const router = express.Router();
const { getTransactions, createTransaction, getTransaction, updateTransaction, deleteTransaction, getSummary } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/summary', getSummary);
router.route('/').get(getTransactions).post(createTransaction);
router.route('/:id').get(getTransaction).put(updateTransaction).delete(deleteTransaction);

module.exports = router;
TXROUTES

print_file "server/routes/analyticsRoutes.js"
cat > server/routes/analyticsRoutes.js << 'ANALYTICSROUTES'
const express = require('express');
const router = express.Router();
const { getChartData, getCategoryBreakdown, getMonthlyReport } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/chart-data', getChartData);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/monthly-report', getMonthlyReport);

module.exports = router;
ANALYTICSROUTES

print_file "server/routes/aiRoutes.js"
cat > server/routes/aiRoutes.js << 'AIROUTES'
const express = require('express');
const router = express.Router();
const { getInsights, getPrediction, getExpenseSpikes, chatQuery } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/insights', getInsights);
router.get('/prediction', getPrediction);
router.get('/expense-spikes', getExpenseSpikes);
router.post('/chat', chatQuery);

module.exports = router;
AIROUTES

print_file "server/routes/notificationRoutes.js"
cat > server/routes/notificationRoutes.js << 'NOTIFROUETS'
const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getNotifications);
router.put('/mark-read', markAsRead);
router.put('/read-all', markAllAsRead);

module.exports = router;
NOTIFROUETS

# ---- server/server.js ----
print_file "server/server.js"
cat > server/server.js << 'SERVERMAIN'
/**
 * Smart Business OS — Main Server
 */
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = initSocket(server);
app.set('io', io);

// Security
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Body parser & sanitize
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(compression());

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'Smart Business OS is running 🚀', timestamp: new Date() }));

app.use(errorHandler);
app.use('*', (req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log('');
      console.log('🚀 ═══════════════════════════════════════');
      console.log(`🚀  Smart Business OS Server Running`);
      console.log(`🚀  Port     : ${PORT}`);
      console.log(`🚀  Mode     : ${process.env.NODE_ENV}`);
      console.log(`🚀  API      : http://localhost:${PORT}/api`);
      console.log('🚀 ═══════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
module.exports = { app, io };
SERVERMAIN

# ============================================================
# ============================================================
#   FRONTEND — CLIENT (React + Vite)
# ============================================================
# ============================================================
print_step "Setting up Frontend (React + Vite + TailwindCSS)"

mkdir -p client/src/{components/{layout,dashboard,ai,transactions,common},context,hooks,pages,services,utils,styles}
mkdir -p client/public

# ---- client/index.html ----
print_file "client/index.html"
cat > client/index.html << 'INDEXHTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Smart Business OS</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
INDEXHTML

# ---- client/package.json ----
print_file "client/package.json"
cat > client/package.json << 'CLIENTPKG'
{
  "name": "smart-business-os-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "date-fns": "^2.30.0",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.7.1",
    "lucide-react": "^0.294.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hot-toast": "^2.4.1",
    "react-router-dom": "^6.20.1",
    "recharts": "^2.10.1",
    "socket.io-client": "^4.6.1",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "vite": "^5.0.2"
  }
}
CLIENTPKG

# ---- client/vite.config.js ----
print_file "client/vite.config.js"
cat > client/vite.config.js << 'VITECONFIG'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true }
    }
  },
  build: { outDir: 'dist', sourcemap: false }
});
VITECONFIG

# ---- client/tailwind.config.js ----
print_file "client/tailwind.config.js"
cat > client/tailwind.config.js << 'TAILWINDCFG'
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: { extend: { fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] } } },
  plugins: []
};
TAILWINDCFG

# ---- client/postcss.config.js ----
print_file "client/postcss.config.js"
cat > client/postcss.config.js << 'POSTCSSCFG'
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} }
};
POSTCSSCFG

# ---- client/.env ----
print_file "client/.env"
cat > client/.env << 'CLIENTENV'
VITE_API_URL=http://localhost:5000/api
CLIENTENV

# ---- client/src/styles/globals.css ----
print_file "client/src/styles/globals.css"
cat > client/src/styles/globals.css << 'GLOBALCSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --bg-sidebar: #0f172a;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --accent: #6366f1;
  --accent-light: #e0e7ff;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
  --shadow-lg: 0 10px 40px rgba(0,0,0,0.12);
  --toast-bg: #ffffff;
  --toast-color: #0f172a;
  --radius: 16px;
}

.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --bg-sidebar: #020617;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border: #334155;
  --border-light: #1e293b;
  --accent: #818cf8;
  --accent-light: #1e1b4b;
  --success: #34d399;
  --danger: #f87171;
  --warning: #fbbf24;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.3);
  --toast-bg: #1e293b;
  --toast-color: #f1f5f9;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  transition: background-color 0.3s ease, color 0.3s ease;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

.card {
  background: var(--bg-card);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease;
}
.card:hover { box-shadow: var(--shadow-md); }

.btn-primary {
  @apply px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4px 15px rgba(99,102,241,0.3);
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 25px rgba(99,102,241,0.4); }
.btn-primary:disabled { opacity: 0.6; transform: none; cursor: not-allowed; }

.btn-secondary {
  @apply px-6 py-3 rounded-xl font-semibold transition-all duration-200;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}
.btn-secondary:hover { background: var(--border); }

.input-field {
  @apply w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200;
  background: var(--bg-primary);
  border: 1.5px solid var(--border);
  color: var(--text-primary);
}
.input-field:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
.input-field::placeholder { color: var(--text-muted); }
select.input-field { appearance: auto; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
@keyframes spin { to { transform: rotate(360deg); } }

.animate-fadeInUp { animation: fadeInUp 0.4s ease forwards; }
.animate-slideInRight { animation: slideInRight 0.3s ease forwards; }

.gradient-text {
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

.stat-gradient-blue { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-gradient-green { background: linear-gradient(135deg, #11998e, #38ef7d); }
.stat-gradient-orange { background: linear-gradient(135deg, #f7971e, #ffd200); }
.stat-gradient-red { background: linear-gradient(135deg, #ff416c, #ff4b2b); }
.stat-gradient-purple { background: linear-gradient(135deg, #a18cd1, #fbc2eb); }

.sidebar { background: var(--bg-sidebar); }
GLOBALCSS

# ---- client/src/services/api.js ----
print_file "client/src/services/api.js"
cat > client/src/services/api.js << 'APISERVICE'
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/auth')) window.location.href = '/auth';
    } else if (error.response?.status !== 404) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;
APISERVICE

# ---- client/src/utils/formatters.js ----
print_file "client/src/utils/formatters.js"
cat > client/src/utils/formatters.js << 'FORMATTERS'
export const formatCurrency = (amount, currency = '₹') => {
  const num = Number(amount) || 0;
  if (num >= 10000000) return `${currency}${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `${currency}${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `${currency}${(num / 1000).toFixed(1)}K`;
  return `${currency}${num.toLocaleString('en-IN')}`;
};

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const getPercentageChange = (current, previous) => {
  if (!previous) return 0;
  return ((current - previous) / previous * 100).toFixed(1);
};
FORMATTERS

# ---- Context files ----
print_file "client/src/context/AuthContext.jsx"
cat > client/src/context/AuthContext.jsx << 'AUTHCTX'
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
          setIsAuthenticated(true);
        } catch {
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user); setIsAuthenticated(true);
    toast.success(data.message || 'Welcome back!');
    return data;
  };

  const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user); setIsAuthenticated(true);
    toast.success('Account created! 🎉');
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null); setIsAuthenticated(false);
    toast.success('Logged out!');
  };

  const updateUser = (u) => setUser(prev => ({ ...prev, ...u }));

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
AUTHCTX

print_file "client/src/context/ThemeContext.jsx"
cat > client/src/context/ThemeContext.jsx << 'THEMECTX'
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
THEMECTX

print_file "client/src/context/SocketContext.jsx"
cat > client/src/context/SocketContext.jsx << 'SOCKETCTX'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!isAuthenticated || !token) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      return;
    }

    socketRef.current = io(
      (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', ''),
      { auth: { token }, transports: ['websocket', 'polling'], reconnection: true, reconnectionAttempts: 5 }
    );

    const socket = socketRef.current;
    socket.on('connect', () => { setIsConnected(true); socket.emit('subscribe:dashboard'); });
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('notification:new', (notification) => {
      const icons = { warning: '⚠️', error: '🚨', success: '✅', info: 'ℹ️' };
      toast(notification.message, { icon: icons[notification.type] || 'ℹ️', duration: 6000 });
    });

    return () => { if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; setIsConnected(false); } };
  }, [isAuthenticated]);

  const emit = (event, data) => socketRef.current?.emit(event, data);
  const on = (event, callback) => {
    socketRef.current?.on(event, callback);
    return () => socketRef.current?.off(event, callback);
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, emit, on }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
SOCKETCTX

# ---- Common components ----
print_file "client/src/components/common/ProtectedRoute.jsx"
cat > client/src/components/common/ProtectedRoute.jsx << 'PROTECTEDROUTE'
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full animate-spin mx-auto mb-4"
            style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--accent)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Loading Smart Business OS...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
};

export default ProtectedRoute;
PROTECTEDROUTE

# ---- Layout files ----
print_file "client/src/components/layout/Layout.jsx"
cat > client/src/components/layout/Layout.jsx << 'LAYOUTCOMP'
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default Layout;
LAYOUTCOMP

print_file "client/src/components/layout/Sidebar.jsx"
cat > client/src/components/layout/Sidebar.jsx << 'SIDEBARCOMP'
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, BarChart3, Bot, FileText, Settings, LogOut, Zap, X, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: TrendingUp },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'AI' },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/auth'); };

  return (
    <aside className={`fixed left-0 top-0 h-full w-64 z-30 flex flex-col transition-transform duration-300 sidebar ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">Smart Business OS</h1>
            <p className="text-xs" style={{ color: '#94a3b8' }}>v1.0</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white"><X size={20} /></button>
      </div>

      <div className="px-4 py-4 mx-4 mt-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg,#6366f1,#ec4899)' }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
            <p className="text-xs truncate" style={{ color: '#94a3b8' }}>{user?.businessName}</p>
          </div>
          {user?.subscription?.plan !== 'free' && <Crown size={14} className="text-yellow-400" />}
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-3" style={{ color: '#64748b' }}>Menu</p>
        {NAV.map(({ path, label, icon: Icon, badge }) => (
          <NavLink key={path} to={path} onClick={onClose}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.2))', borderLeft: '3px solid #6366f1' } : {}}>
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {badge && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}>{badge}</span>}
          </NavLink>
        ))}
      </nav>

      {user?.subscription?.plan === 'free' && (
        <div className="mx-4 mb-4 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <p className="text-xs text-white font-semibold mb-1">🚀 Upgrade to Pro</p>
          <p className="text-xs" style={{ color: '#94a3b8' }}>Unlock AI predictions & more</p>
        </div>
      )}

      <div className="px-4 pb-4">
        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={18} /><span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
SIDEBARCOMP

print_file "client/src/components/layout/Navbar.jsx"
cat > client/src/components/layout/Navbar.jsx << 'NAVBARCOMP'
import React, { useState, useEffect } from 'react';
import { Bell, Sun, Moon, Menu, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';

const PAGE_TITLES = { '/dashboard': 'Dashboard', '/transactions': 'Transactions', '/analytics': 'Analytics', '/ai-assistant': 'AI Assistant', '/reports': 'Reports', '/settings': 'Settings' };

const Navbar = ({ onMenuClick }) => {
  const { toggleTheme, isDark } = useTheme();
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const currentPage = PAGE_TITLES[location.pathname] || 'Dashboard';

  useEffect(() => {
    api.get('/notifications?limit=5').then(res => {
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    }).catch(() => {});
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
          <Menu size={20} />
        </button>
        <div>
          <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{currentPage}</h2>
          <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: isConnected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
          {isConnected
            ? <><Wifi size={12} style={{ color: '#10b981' }} /><span style={{ color: '#10b981' }}>Live</span></>
            : <><WifiOff size={12} style={{ color: '#ef4444' }} /><span style={{ color: '#ef4444' }}>Offline</span></>}
        </div>

        <button onClick={toggleTheme} className="p-2 rounded-xl transition-all hover:scale-110"
          style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button onClick={() => { setShowNotif(!showNotif); if (unreadCount > 0) markAllRead(); }}
            className="p-2 rounded-xl relative" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-xs flex items-center justify-center rounded-full text-white font-bold"
                style={{ background: '#ef4444', fontSize: '10px' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-12 w-80 rounded-2xl border shadow-xl z-50"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="px-4 py-3 border-b flex justify-between" style={{ borderColor: 'var(--border)' }}>
                <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</span>
                <button className="text-xs" style={{ color: 'var(--accent)' }} onClick={markAllRead}>Mark all read</button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No notifications yet</div>
                ) : notifications.map(n => (
                  <div key={n._id} className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-light)', opacity: n.isRead ? 0.6 : 1 }}>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ background: 'linear-gradient(135deg,#6366f1,#ec4899)' }}>
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
NAVBARCOMP

# ---- Dashboard components ----
print_file "client/src/components/dashboard/SalesChart.jsx"
cat > client/src/components/dashboard/SalesChart.jsx << 'SALESCHART'
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 shadow-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{p.dataKey}</span>
          </div>
          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>₹{Number(p.value).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  );
};

const SalesChart = ({ data, loading }) => {
  const { isDark } = useTheme();
  const axisColor = isDark ? '#64748b' : '#94a3b8';

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--accent)' }} />
    </div>
  );

  if (!data || !data.labels?.length) return (
    <div className="h-64 flex flex-col items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
      <span className="text-4xl">📊</span>
      <p className="text-sm">No chart data yet. Add some transactions!</p>
    </div>
  );

  const chartData = data.labels.map((label, i) => ({
    label, sales: data.sales?.[i] || 0, expenses: data.expenses?.[i] || 0, profit: data.profit?.[i] || 0
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
            <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
            <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
          <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>} />
          <Area type="monotone" dataKey="sales" stroke="#6366f1" fill="url(#sg)" strokeWidth={2.5} dot={false} />
          <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#eg)" strokeWidth={2.5} dot={false} />
          <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#pg)" strokeWidth={2.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
export default SalesChart;
SALESCHART

print_file "client/src/components/dashboard/ExpenseChart.jsx"
cat > client/src/components/dashboard/ExpenseChart.jsx << 'EXPENSECHART'
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../../services/api';

const COLORS = ['#6366f1','#ef4444','#f59e0b','#10b981','#8b5cf6','#ec4899','#06b6d4','#84cc16'];
const RADIAN = Math.PI / 180;

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>{`${(percent * 100).toFixed(0)}%`}</text>;
};

const ExpenseChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/category-breakdown?type=expense&period=month')
      .then(res => setData(res.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-48 flex items-center justify-center"><div className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid var(--border)', borderTop: '2px solid var(--accent)' }} /></div>;
  if (data.length === 0) return <div className="h-48 flex flex-col items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}><span className="text-3xl">🍩</span><p className="text-sm">No expense data this month</p></div>;

  const chartData = data.map(d => ({ name: d.category.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()), value: d.total }));

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" labelLine={false} label={renderLabel}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']} />
          <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
export default ExpenseChart;
EXPENSECHART

print_file "client/src/components/dashboard/RecentActivity.jsx"
cat > client/src/components/dashboard/RecentActivity.jsx << 'RECENTACTIVITY'
import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

const RecentActivity = ({ transactions, loading, currency }) => (
  <div className="card p-6">
    <div className="flex items-center justify-between mb-5">
      <div>
        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Latest transactions</p>
      </div>
      <Link to="/transactions" className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>View All →</Link>
    </div>
    {loading ? (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-xl" style={{ background: 'var(--border)' }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 rounded-md w-2/3" style={{ background: 'var(--border)' }} />
              <div className="h-2.5 rounded-md w-1/3" style={{ background: 'var(--border)' }} />
            </div>
            <div className="h-4 w-16 rounded-md" style={{ background: 'var(--border)' }} />
          </div>
        ))}
      </div>
    ) : transactions.length === 0 ? (
      <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
        <p className="text-3xl mb-2">📭</p>No transactions yet
      </div>
    ) : (
      <div className="space-y-3">
        {transactions.map(tx => (
          <div key={tx._id} className="flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-slate-800/50">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: tx.type === 'sale' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
              {tx.type === 'sale' ? <ArrowUpRight size={16} style={{ color: '#10b981' }} /> : <ArrowDownRight size={16} style={{ color: '#ef4444' }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{tx.title}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{tx.category?.replace(/_/g,' ')} · {formatDate(tx.date)}</p>
            </div>
            <span className="text-sm font-bold flex-shrink-0" style={{ color: tx.type === 'sale' ? '#10b981' : '#ef4444' }}>
              {tx.type === 'sale' ? '+' : '-'}{currency}{tx.amount?.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);
export default RecentActivity;
RECENTACTIVITY

print_file "client/src/components/ai/AIInsights.jsx"
cat > client/src/components/ai/AIInsights.jsx << 'AIINSIGHTS'
import React from 'react';
import { Sparkles } from 'lucide-react';

const PRIORITY_COLORS = { critical: '#ef4444', high: '#f59e0b', medium: '#6366f1', low: '#10b981' };

const AIInsights = ({ insights, loading }) => (
  <div className="card p-6">
    <div className="flex items-center gap-2 mb-5">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
        <Sparkles size={16} className="text-white" />
      </div>
      <div>
        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>AI Insights</h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Smart recommendations</p>
      </div>
    </div>
    {loading ? (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-3 rounded-xl animate-pulse" style={{ background: 'var(--bg-primary)' }}>
            <div className="h-3 w-3/4 rounded mb-2" style={{ background: 'var(--border)' }} />
            <div className="h-2.5 w-full rounded" style={{ background: 'var(--border)' }} />
          </div>
        ))}
      </div>
    ) : insights.length === 0 ? (
      <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
        <p className="text-3xl mb-2">🤖</p>Add more transactions to get AI insights
      </div>
    ) : (
      <div className="space-y-3">
        {insights.slice(0, 4).map((insight, i) => (
          <div key={i} className="p-3 rounded-xl flex gap-3 items-start"
            style={{ background: 'var(--bg-primary)', borderLeft: `3px solid ${PRIORITY_COLORS[insight.priority] || '#6366f1'}` }}>
            <span className="text-lg flex-shrink-0">{insight.icon}</span>
            <div>
              <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{insight.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{insight.message}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
export default AIInsights;
AIINSIGHTS

# ---- Pages ----
print_file "client/src/pages/Auth.jsx"
cat > client/src/pages/Auth.jsx << 'AUTHPAGE'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Zap, TrendingUp, Shield, Bot } from 'lucide-react';
import toast from 'react-hot-toast';

const BUSINESS_TYPES = ['general', 'shop', 'gym', 'clinic', 'restaurant', 'freelance'];

const AuthPage = () => {
  const [mode, setMode] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '', businessType: 'general' });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    if (mode === 'register' && !form.name) return toast.error('Name is required');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form);
      navigate('/dashboard');
    } catch {} finally { setLoading(false); }
  };

  const fillDemo = () => { setForm({ ...form, email: 'demo@business.com', password: 'demo1234' }); setMode('login'); toast('Demo credentials filled!', { icon: '🎯' }); };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16" style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b,#0f172a)' }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <Zap size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Smart Business OS</h1>
            <p className="text-sm text-indigo-300">AI-Powered Business Dashboard</p>
          </div>
        </div>
        <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
          Run Your Business
          <span className="block" style={{ background: 'linear-gradient(135deg,#6366f1,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Smarter & Faster
          </span>
        </h2>
        <p className="text-indigo-200 text-lg mb-8">Track sales, manage expenses, get AI insights — all in one place.</p>
        {[{ icon: TrendingUp, text: 'Real-time sales & expense tracking' }, { icon: Bot, text: 'AI-powered business insights' }, { icon: Shield, text: 'Secure multi-user access' }].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.2)' }}>
              <Icon size={16} className="text-indigo-400" />
            </div>
            <p className="text-indigo-200 text-sm">{text}</p>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-3 mt-8">
          {[{ label: 'Businesses', value: '2,400+' }, { label: 'Transactions', value: '1M+' }, { label: 'AI Insights', value: '50K+' }].map(s => (
            <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-indigo-300">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Smart Business OS</span>
          </div>

          <div className="card p-8">
            <div className="flex rounded-xl p-1 mb-6" style={{ background: 'var(--bg-primary)' }}>
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => setMode(m)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all"
                  style={mode === m ? { background: 'var(--bg-card)', color: 'var(--accent)', boxShadow: 'var(--shadow-sm)' } : { color: 'var(--text-muted)' }}>
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{mode === 'login' ? 'Welcome back!' : 'Create your account'}</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{mode === 'login' ? 'Sign in to your dashboard' : 'Start managing your business smarter'}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
                  <input type="text" name="name" className="input-field" placeholder="John Doe" value={form.name} onChange={handleChange} required />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email Address *</label>
                <input type="email" name="email" className="input-field" placeholder="you@business.com" value={form.email} onChange={handleChange} required />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password *</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} name="password" className="input-field pr-10" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {mode === 'register' && (
                <>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Business Name</label>
                    <input type="text" name="businessName" className="input-field" placeholder="My Business" value={form.businessName} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Business Type</label>
                    <select name="businessType" className="input-field" value={form.businessType} onChange={handleChange}>
                      {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                </>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Please wait...</span></> : mode === 'login' ? 'Sign In →' : 'Create Account →'}
              </button>
              {mode === 'login' && (
                <button type="button" onClick={fillDemo} className="w-full py-3 rounded-xl text-sm font-medium border transition-all" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  🎯 Try Demo Account
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AuthPage;
AUTHPAGE

print_file "client/src/pages/Dashboard.jsx"
cat > client/src/pages/Dashboard.jsx << 'DASHBOARDPAGE'
import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, RefreshCw, Plus } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import SalesChart from '../components/dashboard/SalesChart';
import ExpenseChart from '../components/dashboard/ExpenseChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import AIInsights from '../components/ai/AIInsights';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, gradient, loading }) => (
  <div className={`card p-6 text-white border-0 ${gradient}`}>
    <div className="flex items-start justify-between mb-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
        <Icon size={20} className="text-white" />
      </div>
    </div>
    {loading ? (
      <div className="space-y-2">
        <div className="h-7 w-24 rounded-lg bg-white/20 animate-pulse" />
        <div className="h-4 w-16 rounded-lg bg-white/20 animate-pulse" />
      </div>
    ) : (
      <><p className="text-2xl font-bold mb-1">{value}</p><p className="text-sm opacity-80">{title}</p></>
    )}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { on } = useSocket();
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('monthly');
  const [period, setPeriod] = useState('month');

  const fetchData = useCallback(async () => {
    try {
      const [s, c, t, i] = await Promise.all([
        api.get(`/transactions/summary?period=${period}`),
        api.get(`/analytics/chart-data?view=${chartView}`),
        api.get('/transactions?limit=5&sortBy=date&sortOrder=desc'),
        api.get('/ai/insights')
      ]);
      setSummary(s.data.data);
      setChartData(c.data.data);
      setRecentTx(t.data.data);
      setInsights(i.data.data);
    } catch {} finally { setLoading(false); }
  }, [period, chartView]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const cleanup = on('dashboard:update', () => { toast.success('📊 Dashboard updated!', { duration: 3000 }); fetchData(); });
    return cleanup;
  }, [on, fetchData]);

  const currency = user?.currency || '₹';

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{user?.businessName || 'Business'} Dashboard</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            {['week','month','quarter','year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className="px-3 py-2 text-xs font-medium capitalize transition-all"
                style={period === p ? { background: 'var(--accent)', color: 'white' } : { background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="p-2 rounded-xl transition-all hover:rotate-180 duration-300"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            <RefreshCw size={16} />
          </button>
          <Link to="/transactions" className="btn-primary flex items-center gap-2 py-2.5 text-sm">
            <Plus size={16} /> Add Entry
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={`Total Sales (${period})`} value={formatCurrency(summary?.totalSales || 0, currency)} icon={TrendingUp} gradient="stat-gradient-blue" loading={loading} />
        <StatCard title="Total Expenses" value={formatCurrency(summary?.totalExpenses || 0, currency)} icon={TrendingDown} gradient="stat-gradient-red" loading={loading} />
        <StatCard title="Net Profit" value={formatCurrency(summary?.profit || 0, currency)} icon={DollarSign} gradient={summary?.profit >= 0 ? "stat-gradient-green" : "stat-gradient-red"} loading={loading} />
        <StatCard title="Profit Margin" value={`${summary?.profitMargin || 0}%`} icon={Target} gradient="stat-gradient-purple" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div><h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Sales vs Expenses</h3><p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Financial overview</p></div>
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {['daily','weekly','monthly'].map(v => (
                <button key={v} onClick={() => setChartView(v)} className="px-3 py-1.5 text-xs font-medium capitalize transition-all"
                  style={chartView === v ? { background: 'var(--accent)', color: 'white' } : { background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <SalesChart data={chartData} loading={loading} />
        </div>
        <div className="card p-6">
          <div className="mb-6"><h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Expenses by Category</h3><p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>This month</p></div>
          <ExpenseChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity transactions={recentTx} loading={loading} currency={currency} />
        <AIInsights insights={insights?.insights || []} loading={loading} />
      </div>
    </div>
  );
};
export default Dashboard;
DASHBOARDPAGE

print_file "client/src/pages/Transactions.jsx"
cat > client/src/pages/Transactions.jsx << 'TXPAGE'
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X, Edit2, Trash2, Check } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const CATEGORIES = {
  expense: ['rent','salary','marketing','utilities','supplies','equipment','insurance','transport','food','maintenance','taxes','subscription','miscellaneous'],
  sale: ['product_sale','service','consultation','subscription_revenue','refund','other_income']
};
const INITIAL_FORM = { type: 'expense', title: '', amount: '', category: 'miscellaneous', description: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'cash', status: 'completed' };

const TransactionForm = ({ form, setForm, onSubmit, onClose, editMode, loading }) => {
  const cats = CATEGORIES[form.type] || [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{editMode ? 'Edit' : 'Add'} Transaction</h3>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="flex rounded-xl p-1" style={{ background: 'var(--bg-primary)' }}>
            {['sale','expense'].map(t => (
              <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t, category: CATEGORIES[t][0] }))}
                className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
                style={form.type === t ? { background: t === 'sale' ? '#10b981' : '#ef4444', color: 'white' } : { color: 'var(--text-muted)' }}>
                {t === 'sale' ? '💚 Sale' : '🔴 Expense'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Title *</label>
              <input type="text" className="input-field" placeholder="e.g. Monthly Rent" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Amount *</label>
              <input type="number" className="input-field" placeholder="0.00" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Date *</label>
              <input type="date" className="input-field" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Category *</label>
              <select className="input-field" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {cats.map(c => <option key={c} value={c}>{c.replace(/_/g,' ').replace(/\b\w/g, ch => ch.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Payment</label>
              <select className="input-field" value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                {['cash','card','upi','bank_transfer','cheque','other'].map(m => <option key={m} value={m}>{m.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
              <textarea className="input-field resize-none" rows={2} placeholder="Optional notes..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
              {editMode ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [filters, setFilters] = useState({ type: 'all', search: '', startDate: '', endDate: '', page: 1 });
  const currency = user?.currency || '₹';

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, limit: 15, sortBy: 'date', sortOrder: 'desc' });
      [...params.entries()].forEach(([k, v]) => { if (!v || v === 'all') params.delete(k); });
      const { data } = await api.get(`/transactions?${params}`);
      setTransactions(data.data);
      setPagination(data.pagination);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleSubmit = async e => {
    e.preventDefault(); setFormLoading(true);
    try {
      if (editId) { await api.put(`/transactions/${editId}`, form); toast.success('Updated!'); }
      else { await api.post('/transactions', form); toast.success('Added!'); }
      setShowForm(false); setEditId(null); setForm(INITIAL_FORM); fetchTransactions();
    } finally { setFormLoading(false); }
  };

  const handleEdit = tx => {
    setForm({ type: tx.type, title: tx.title, amount: tx.amount, category: tx.category, description: tx.description || '', date: new Date(tx.date).toISOString().split('T')[0], paymentMethod: tx.paymentMethod || 'cash', status: tx.status || 'completed' });
    setEditId(tx._id); setShowForm(true);
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this transaction?')) return;
    await api.delete(`/transactions/${id}`); toast.success('Deleted!'); fetchTransactions();
  };

  const totals = transactions.reduce((acc, tx) => { if (tx.type === 'sale') acc.sales += tx.amount; else acc.expenses += tx.amount; return acc; }, { sales: 0, expenses: 0 });

  return (
    <div className="space-y-6 animate-fadeInUp">
      {showForm && <TransactionForm form={form} setForm={setForm} onSubmit={handleSubmit} onClose={() => { setShowForm(false); setEditId(null); setForm(INITIAL_FORM); }} editMode={!!editId} loading={formLoading} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Transactions</h1><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage all sales & expenses</p></div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Transaction</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Sales', value: totals.sales, color: '#10b981' }, { label: 'Expenses', value: totals.expenses, color: '#ef4444' }, { label: 'Net', value: totals.sales - totals.expenses, color: totals.sales - totals.expenses >= 0 ? '#10b981' : '#ef4444' }].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-lg font-bold" style={{ color: s.color }}>{currency}{Math.abs(s.value).toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input type="text" className="input-field pl-9 py-2 text-sm" placeholder="Search transactions..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))} />
        </div>
        <select className="input-field py-2 text-sm w-auto" value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value, page: 1 }))}>
          <option value="all">All Types</option><option value="sale">Sales</option><option value="expense">Expenses</option>
        </select>
        <input type="date" className="input-field py-2 text-sm w-auto" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} />
        <input type="date" className="input-field py-2 text-sm w-auto" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} />
        <button onClick={() => setFilters({ type: 'all', search: '', startDate: '', endDate: '', page: 1 })} className="btn-secondary py-2 text-sm flex items-center gap-1"><X size={14} /> Clear</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
                {['Date','Title','Category','Type','Amount','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b" style={{ borderColor: 'var(--border-light)' }}>
                  {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3.5 rounded animate-pulse" style={{ background: 'var(--border)', width: j === 1 ? '80%' : '60%' }} /></td>)}
                </tr>
              )) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}><p className="text-4xl mb-2">📭</p><p>No transactions found. Add your first one!</p></td></tr>
              ) : transactions.map(tx => (
                <tr key={tx._id} className="border-b hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors" style={{ borderColor: 'var(--border-light)' }}>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(tx.date)}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold truncate max-w-[140px]" style={{ color: 'var(--text-primary)' }}>{tx.title}</p>
                    {tx.description && <p className="text-xs truncate max-w-[140px]" style={{ color: 'var(--text-muted)' }}>{tx.description}</p>}
                  </td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>{tx.category?.replace(/_/g,' ')}</span></td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold px-2 py-1 rounded-lg" style={tx.type === 'sale' ? { background: 'rgba(16,185,129,0.1)', color: '#10b981' } : { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{tx.type}</span></td>
                  <td className="px-4 py-3 font-bold" style={{ color: tx.type === 'sale' ? '#10b981' : '#ef4444' }}>{tx.type === 'sale' ? '+' : '-'}{currency}{tx.amount?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(tx)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"><Edit2 size={14} style={{ color: '#3b82f6' }} /></button>
                      <button onClick={() => handleDelete(tx._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={14} style={{ color: '#ef4444' }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.pages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {pagination.page} of {pagination.pages} ({pagination.total} total)</p>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">← Prev</button>
              <button disabled={filters.page >= pagination.pages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Transactions;
TXPAGE

print_file "client/src/pages/AIAssistant.jsx"
cat > client/src/pages/AIAssistant.jsx << 'AIPAGE'
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, TrendingUp, BarChart3, DollarSign, HelpCircle, Mic } from 'lucide-react';
import api from '../services/api';

const QUICK_PROMPTS = [
  { icon: TrendingUp, text: 'Show my weekly sales' },
  { icon: BarChart3, text: 'Which category has highest expense?' },
  { icon: DollarSign, text: 'What is my profit this month?' },
  { icon: HelpCircle, text: 'Show recent transactions' }
];

const Message = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={isUser ? { background: 'linear-gradient(135deg,#6366f1,#ec4899)' } : { background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-indigo-400" />}
      </div>
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
        style={isUser ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' } : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
        {msg.content.split('\n').map((line, i) => (
          <React.Fragment key={i}>{line}<br /></React.Fragment>
        ))}
        <p className="text-xs mt-1.5 opacity-60">{new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
};

const AIAssistant = () => {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: '🤖 Hello! I\'m your AI Business Assistant.\n\nI can help you analyze your business data. Try:\n• "Show my weekly sales"\n• "What is my profit?"\n• "Highest expense category"\n\nType "help" for all commands!',
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { api.get('/ai/prediction').then(res => setPrediction(res.data.data)).catch(() => {}); }, []);

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput(''); setLoading(true);
    try {
      const { data } = await api.post('/ai/chat', { query: text.trim() });
      setMessages(prev => [...prev, { role: 'assistant', content: data.data.response, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Sorry, I encountered an error. Please try again.', timestamp: new Date() }]);
    } finally { setLoading(false); inputRef.current?.focus(); }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) { alert('Voice input requires Chrome browser!'); return; }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onresult = e => { const t = e.results[0][0].transcript; setInput(t); sendMessage(t); };
    recognition.start();
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-fadeInUp" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Assistant</h1><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Powered by business intelligence engine</p></div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.1)' }}>
          <Sparkles size={14} style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>AI Online</span>
        </div>
      </div>

      {prediction?.prediction && (
        <div className="card p-4 flex items-center gap-4 border-l-4" style={{ borderLeftColor: '#6366f1' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <TrendingUp size={20} style={{ color: '#6366f1' }} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>AI PREDICTION — Next Month</p>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{prediction.message}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Confidence: {prediction.confidence} · Trend: {prediction.trend}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map(({ icon: Icon, text }) => (
          <button key={text} onClick={() => sendMessage(text)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:shadow-md"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <Icon size={13} />{text}
          </button>
        ))}
      </div>

      <div className="flex-1 card p-4 overflow-y-auto space-y-4" style={{ minHeight: 300 }}>
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
              <Bot size={14} className="text-indigo-400" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex gap-1 items-center h-5">
                {[0, 0.15, 0.3].map((delay, i) => <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: `${delay}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="card p-3 flex gap-3 items-center">
        <button onClick={handleVoiceInput} className="p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20"><Mic size={18} style={{ color: 'var(--accent)' }} /></button>
        <input ref={inputRef} type="text" className="flex-1 outline-none bg-transparent text-sm" style={{ color: 'var(--text-primary)' }}
          placeholder='Ask anything... e.g. "Show my monthly profit"' value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="p-2.5 rounded-xl text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
export default AIAssistant;
AIPAGE

print_file "client/src/pages/Analytics.jsx"
cat > client/src/pages/Analytics.jsx << 'ANALYTICSPAGE'
import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import api from '../services/api';
import SalesChart from '../components/dashboard/SalesChart';
import ExpenseChart from '../components/dashboard/ExpenseChart';

const Analytics = () => {
  const [chartData, setChartData] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [view, setView] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [c, m] = await Promise.all([
          api.get(`/analytics/chart-data?view=${view}`),
          api.get('/analytics/monthly-report')
        ]);
        setChartData(c.data.data);
        setMonthlyReport(m.data.data);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [view]);

  const r = monthlyReport?.current;
  const g = monthlyReport?.growth;

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div><h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics</h1><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Deep dive into your business performance</p></div>

      {monthlyReport && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'This Month Sales', value: `₹${(r?.sales || 0).toLocaleString('en-IN')}`, change: g?.sales, color: '#6366f1' },
            { label: 'This Month Expenses', value: `₹${(r?.expenses || 0).toLocaleString('en-IN')}`, change: g?.expenses, color: '#ef4444' },
            { label: 'Net Profit', value: `₹${(r?.profit || 0).toLocaleString('en-IN')}`, change: g?.profit, color: r?.profit >= 0 ? '#10b981' : '#ef4444' },
            { label: 'Profit Margin', value: `${r?.sales > 0 ? ((r?.profit / r?.sales) * 100).toFixed(1) : 0}%`, color: '#8b5cf6' }
          ].map(s => (
            <div key={s.label} className="card p-5">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              <p className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</p>
              {s.change !== undefined && (
                <p className="text-xs" style={{ color: parseFloat(s.change) >= 0 ? '#10b981' : '#ef4444' }}>
                  {parseFloat(s.change) >= 0 ? '↑' : '↓'} {Math.abs(s.change)}% vs last month
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div><h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Revenue Trends</h3><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sales, expenses & profit over time</p></div>
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {['daily','weekly','monthly'].map(v => (
                <button key={v} onClick={() => setView(v)} className="px-3 py-1.5 text-xs font-medium capitalize transition-all"
                  style={view === v ? { background: 'var(--accent)', color: 'white' } : { background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <SalesChart data={chartData} loading={loading} />
        </div>
        <div className="card p-6">
          <div className="mb-6"><h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Expense Breakdown</h3><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Category distribution</p></div>
          <ExpenseChart />
        </div>
      </div>
    </div>
  );
};
export default Analytics;
ANALYTICSPAGE

print_file "client/src/pages/Reports.jsx"
cat > client/src/pages/Reports.jsx << 'REPORTSPAGE'
import React, { useState } from 'react';
import { FileText, FileSpreadsheet } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatDate } from '../utils/formatters';

const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState({ pdf: false, excel: false });
  const [config, setConfig] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: 'all'
  });

  const fetchData = async () => {
    const params = new URLSearchParams({ startDate: config.startDate, endDate: config.endDate, limit: 1000, ...(config.type !== 'all' && { type: config.type }) });
    const { data } = await api.get(`/transactions?${params}`);
    return data.data;
  };

  const exportPDF = async () => {
    setLoading(p => ({ ...p, pdf: true }));
    try {
      const transactions = await fetchData();
      const doc = new jsPDF();
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, 220, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.text('Smart Business OS', 14, 16);
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.text(`Report — ${user?.businessName}`, 14, 26);
      doc.setFontSize(9);
      doc.text(`Period: ${config.startDate} to ${config.endDate}`, 14, 34);

      const sales = transactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0);
      const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('Financial Summary', 14, 55);
      autoTable(doc, {
        startY: 60,
        head: [['Metric', 'Value']],
        body: [
          ['Total Sales', `₹${sales.toLocaleString('en-IN')}`],
          ['Total Expenses', `₹${expenses.toLocaleString('en-IN')}`],
          ['Net Profit', `₹${(sales - expenses).toLocaleString('en-IN')}`],
          ['Profit Margin', `${sales > 0 ? ((sales - expenses) / sales * 100).toFixed(1) : 0}%`],
          ['Total Transactions', `${transactions.length}`]
        ],
        headStyles: { fillColor: [99, 102, 241] }
      });
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('Transaction Details', 14, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Date', 'Title', 'Category', 'Type', 'Amount']],
        body: transactions.map(t => [formatDate(t.date), t.title, t.category.replace(/_/g,' '), t.type, `${t.type === 'sale' ? '+' : '-'}₹${t.amount.toLocaleString('en-IN')}`]),
        headStyles: { fillColor: [99, 102, 241] }, styles: { fontSize: 8 }
      });
      doc.save(`smart-business-report-${config.startDate}.pdf`);
      toast.success('PDF downloaded! 📄');
    } finally { setLoading(p => ({ ...p, pdf: false })); }
  };

  const exportExcel = async () => {
    setLoading(p => ({ ...p, excel: true }));
    try {
      const transactions = await fetchData();
      const wb = XLSX.utils.book_new();
      const sales = transactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0);
      const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const summaryWS = XLSX.utils.aoa_to_sheet([
        ['Smart Business OS — Report'], [`Business: ${user?.businessName}`], [`Period: ${config.startDate} to ${config.endDate}`], [],
        ['Total Sales', sales], ['Total Expenses', expenses], ['Net Profit', sales - expenses], ['Profit Margin %', sales > 0 ? ((sales - expenses) / sales * 100).toFixed(1) : 0]
      ]);
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
      const txWS = XLSX.utils.aoa_to_sheet([
        ['Date', 'Title', 'Type', 'Category', 'Amount', 'Payment'],
        ...transactions.map(t => [formatDate(t.date), t.title, t.type, t.category.replace(/_/g,' '), t.type === 'sale' ? t.amount : -t.amount, t.paymentMethod])
      ]);
      XLSX.utils.book_append_sheet(wb, txWS, 'Transactions');
      XLSX.writeFile(wb, `smart-business-report-${config.startDate}.xlsx`);
      toast.success('Excel downloaded! 📊');
    } finally { setLoading(p => ({ ...p, excel: false })); }
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div><h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reports & Export</h1><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Download your business data as PDF or Excel</p></div>
      <div className="card p-6 max-w-2xl">
        <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Report Configuration</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div><label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Start Date</label><input type="date" className="input-field" value={config.startDate} onChange={e => setConfig(p => ({ ...p, startDate: e.target.value }))} /></div>
          <div><label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>End Date</label><input type="date" className="input-field" value={config.endDate} onChange={e => setConfig(p => ({ ...p, endDate: e.target.value }))} /></div>
          <div><label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Type</label>
            <select className="input-field" value={config.type} onChange={e => setConfig(p => ({ ...p, type: e.target.value }))}>
              <option value="all">All</option><option value="sale">Sales</option><option value="expense">Expenses</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={exportPDF} disabled={loading.pdf} className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-md" style={{ borderColor: '#ef4444', background: 'rgba(239,68,68,0.05)' }}>
            {loading.pdf ? <div className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <FileText size={24} style={{ color: '#ef4444' }} />}
            <div className="text-left"><p className="font-bold text-sm" style={{ color: '#ef4444' }}>Download PDF</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Formatted report</p></div>
          </button>
          <button onClick={exportExcel} disabled={loading.excel} className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-md" style={{ borderColor: '#10b981', background: 'rgba(16,185,129,0.05)' }}>
            {loading.excel ? <div className="w-5 h-5 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" /> : <FileSpreadsheet size={24} style={{ color: '#10b981' }} />}
            <div className="text-left"><p className="font-bold text-sm" style={{ color: '#10b981' }}>Download Excel</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Spreadsheet data</p></div>
          </button>
        </div>
      </div>
    </div>
  );
};
export default Reports;
REPORTSPAGE

print_file "client/src/pages/Settings.jsx"
cat > client/src/pages/Settings.jsx << 'SETTINGSPAGE'
import React, { useState } from 'react';
import { Save, User, Bell, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', businessName: user?.businessName || '', businessType: user?.businessType || 'general', currency: user?.currency || '₹' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleProfile = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated!');
    } finally { setLoading(false); }
  };

  const handlePassword = async e => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('Passwords do not match');
    if (passForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fadeInUp max-w-2xl">
      <div><h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage your account and preferences</p></div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5"><User size={18} style={{ color: 'var(--accent)' }} /><h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Profile Settings</h2></div>
        <form onSubmit={handleProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name</label><input type="text" className="input-field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Business Name</label><input type="text" className="input-field" value={form.businessName} onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))} /></div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Business Type</label>
              <select className="input-field" value={form.businessType} onChange={e => setForm(p => ({ ...p, businessType: e.target.value }))}>
                {['general','shop','gym','clinic','restaurant','freelance','other'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Currency</label>
              <select className="input-field" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
                <option value="₹">₹ Indian Rupee</option><option value="$">$ US Dollar</option><option value="€">€ Euro</option><option value="£">£ British Pound</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Save Profile
          </button>
        </form>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5"><Bell size={18} style={{ color: 'var(--accent)' }} /><h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Appearance</h2></div>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
          <div><p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Dark Mode</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Toggle between light and dark theme</p></div>
          <button onClick={toggleTheme} className="relative w-12 h-6 rounded-full transition-all duration-300" style={{ background: theme === 'dark' ? '#6366f1' : '#cbd5e1' }}>
            <div className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300" style={{ left: theme === 'dark' ? '26px' : '4px' }} />
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5"><Shield size={18} style={{ color: 'var(--accent)' }} /><h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Change Password</h2></div>
        <form onSubmit={handlePassword} className="space-y-4">
          {['currentPassword','newPassword','confirmPassword'].map(field => (
            <div key={field}>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
              </label>
              <input type="password" className="input-field" placeholder="••••••" value={passForm[field]} onChange={e => setPassForm(p => ({ ...p, [field]: e.target.value }))} required />
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield size={16} />}
            Change Password
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Subscription Plan</h2>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Current Plan: <span className="capitalize" style={{ color: 'var(--accent)' }}>{user?.subscription?.plan || 'Free'}</span></p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Upgrade to unlock AI predictions & advanced analytics</p>
          </div>
          <button className="btn-primary py-2 text-sm">Upgrade 🚀</button>
        </div>
      </div>
    </div>
  );
};
export default Settings;
SETTINGSPAGE

# ---- App.jsx ----
print_file "client/src/App.jsx"
cat > client/src/App.jsx << 'APPJSX'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import AIAssistant from './pages/AIAssistant';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AuthPage from './pages/Auth';
import ProtectedRoute from './components/common/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: 'var(--toast-bg)', color: 'var(--toast-color)', borderRadius: '12px', fontSize: '14px' } }} />
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/ai-assistant" element={<AIAssistant />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
export default App;
APPJSX

# ---- main.jsx ----
print_file "client/src/main.jsx"
cat > client/src/main.jsx << 'MAINJSX'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
MAINJSX

# ============================================================
# ROOT FILES
# ============================================================
print_step "Creating root config files"

print_file ".gitignore"
cat > .gitignore << 'GITIGNORE'
node_modules/
dist/
.env
*.log
.DS_Store
.vscode/
uploads/
GITIGNORE

print_file "README.md"
cat > README.md << 'README'
# 🚀 Smart Business OS

> AI-Powered Business Dashboard with Real-Time Tracking

## ✨ Features
- 📊 Live Business Dashboard (Sales, Expenses, Profit)
- 💰 Transaction Management (Add, Edit, Delete with Categories)
- 📡 Real-Time Updates (Socket.io)
- 🧠 AI Insights Engine (Trend Detection, Anomaly Alerts)
- 🤖 AI Chat Assistant (Natural Language Queries)
- 📈 Advanced Analytics (Charts: Daily/Weekly/Monthly)
- 📂 Export (PDF + Excel Reports)
- 🔐 JWT Authentication (Multi-user)
- 🌙 Dark/Light Mode
- 📱 Responsive Design

## 🛠 Tech Stack
- **Frontend**: React 18 + Vite + TailwindCSS + Recharts
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Real-Time**: Socket.io
- **Auth**: JWT

## ⚡ Quick Start

### 1. Backend Setup
```bash
cd server
npm install
# Edit .env (set your MONGODB_URI if needed)
npm run dev
