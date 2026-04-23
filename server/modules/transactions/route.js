const express = require('express');
const controller = require('./controller');
const { protect, authorize } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/middleware/validate');
const {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
  transactionParamsSchema,
  summarySchema
} = require('./validation');

const router = express.Router();

router.use(protect);
router.get('/summary', validate(summarySchema), controller.getSummary);
router.route('/')
  .get(validate(transactionQuerySchema), controller.getTransactions)
  .post(authorize('admin', 'staff'), validate(createTransactionSchema), controller.createTransaction);
router.route('/:id')
  .get(validate(transactionParamsSchema), controller.getTransaction)
  .put(authorize('admin', 'staff'), validate(updateTransactionSchema), controller.updateTransaction)
  .delete(authorize('admin'), validate(transactionParamsSchema), controller.deleteTransaction);

module.exports = router;
