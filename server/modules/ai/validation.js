const { z } = require('zod');

const chatQuerySchema = z.object({
  body: z.object({
    query: z.string().min(2)
  })
});

module.exports = {
  chatQuerySchema
};
