const { z } = require('zod');

const roleSchema = z.enum(['admin', 'staff', 'viewer']);

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(6),
    businessName: z.string().min(2).max(100).optional(),
    businessType: z.enum(['general', 'shop', 'gym', 'clinic', 'restaurant', 'freelance', 'other']).optional(),
    role: roleSchema.optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6)
  })
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    businessName: z.string().min(2).max(100).optional(),
    businessType: z.enum(['general', 'shop', 'gym', 'clinic', 'restaurant', 'freelance', 'other']).optional(),
    currency: z.string().min(3).max(5).optional(),
    theme: z.enum(['light', 'dark']).optional(),
    role: roleSchema.optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      highExpense: z.boolean().optional(),
      lowProfit: z.boolean().optional()
    }).optional()
  })
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6)
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema
};
