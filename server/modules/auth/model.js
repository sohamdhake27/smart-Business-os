const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../../shared/config/env');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'viewer'],
    default: 'admin'
  },
  businessName: { type: String, default: 'My Business' },
  businessType: {
    type: String,
    enum: ['general', 'shop', 'gym', 'clinic', 'restaurant', 'freelance', 'other'],
    default: 'general'
  },
  currency: { type: String, default: 'INR' },
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

UserSchema.index({ role: 1 });

UserSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

UserSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.generateToken = function generateToken() {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpire }
  );
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
