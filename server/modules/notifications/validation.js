const { z } = require('zod');

const notificationsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    unreadOnly: z.enum(['true', 'false']).optional()
  })
});

const markAsReadSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1)
  })
});

module.exports = {
  notificationsQuerySchema,
  markAsReadSchema
};
