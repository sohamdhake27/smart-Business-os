const { z } = require('zod');
const { TRANSACTION_CATEGORIES } = require('./model');

const transactionBody = z.object({
  type: z.enum(['sale', 'expense']),
  title: z.string().min(2).max(100),
  amount: z.coerce.number().positive(),
  category: z.enum(TRANSACTION_CATEGORIES),
  description: z.string().max(500).optional().or(z.literal('')),
  date: z.coerce.date().optional(),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'cheque', 'other']).optional(),
  reference: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
  status: z.enum(['completed', 'pending', 'cancelled']).optional()
});

const transactionQuerySchema = z.object({
  query: z.object({
    type: z.enum(['sale', 'expense', 'all']).optional(),
    category: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['date', 'amount', 'title', 'category', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
});

const transactionParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

const createTransactionSchema = z.object({ body: transactionBody });
const updateTransactionSchema = z.object({
  params: transactionParamsSchema.shape.params,
  body: transactionBody.partial()
});

const summarySchema = z.object({
  query: z.object({
    period: z.enum(['week', 'month', 'quarter', 'year']).optional()
  })
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
  transactionParamsSchema,
  summarySchema
};
