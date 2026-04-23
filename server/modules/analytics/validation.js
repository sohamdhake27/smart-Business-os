const { z } = require('zod');

const chartDataSchema = z.object({
  query: z.object({
    view: z.enum(['daily', 'weekly', 'monthly']).optional(),
    year: z.coerce.number().optional()
  })
});

const categoryBreakdownSchema = z.object({
  query: z.object({
    type: z.enum(['sale', 'expense']).optional(),
    period: z.enum(['week', 'month', 'year']).optional()
  })
});

const monthlyReportSchema = z.object({
  query: z.object({
    year: z.coerce.number().optional(),
    month: z.coerce.number().min(0).max(11).optional()
  })
});

module.exports = {
  chartDataSchema,
  categoryBreakdownSchema,
  monthlyReportSchema
};
