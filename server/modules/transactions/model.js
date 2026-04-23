const mongoose = require('mongoose');

const TRANSACTION_CATEGORIES = [
  'rent', 'salary', 'marketing', 'utilities', 'supplies', 'equipment',
  'insurance', 'transport', 'food', 'maintenance', 'taxes', 'subscription',
  'miscellaneous', 'product_sale', 'service', 'consultation',
  'subscription_revenue', 'refund', 'other_income'
];

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['sale', 'expense'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, enum: TRANSACTION_CATEGORIES },
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

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
module.exports.TRANSACTION_CATEGORIES = TRANSACTION_CATEGORIES;
