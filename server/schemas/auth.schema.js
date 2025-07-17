const { z } = require('zod');

const userValidationRules = {
  username: {
    min: 3,
    max: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  password: {
    min: 8,
    max: 128,
  },
  name: {
    min: 2,
    max: 50,
    pattern: /^[a-zA-Z\s]+$/,
  },
};

const signUpSchema = z.object({
  name: z.string()
    .min(userValidationRules.name.min, "Name must be at least 2 characters long")
    .max(userValidationRules.name.max, "Name cannot exceed 50 characters")
    .regex(userValidationRules.name.pattern, "Name can only contain letters and spaces"),
  username: z.string()
    .min(userValidationRules.username.min, "Username must be at least 3 characters long")
    .max(userValidationRules.username.max, "Username cannot exceed 20 characters")
    .regex(userValidationRules.username.pattern, "Username can only contain letters, numbers, and underscores"),
  password: z.string()
    .min(userValidationRules.password.min, "Password must be at least 8 characters long")
    .max(userValidationRules.password.max, "Password cannot exceed 128 characters"),
  email: z.string()
    .email("Must be a valid email address")
    .nonempty("Email is required"),
});

const signInSchema = z.object({
  username: z.string()
    .min(userValidationRules.username.min, "Username must be at least 3 characters long")
    .max(userValidationRules.username.max, "Username cannot exceed 20 characters"),
  password: z.string()
    .min(userValidationRules.password.min, "Password must be at least 8 characters long")
    .max(userValidationRules.password.max, "Password cannot exceed 128 characters"),
});

module.exports = {
  signUpSchema,
  signInSchema
};