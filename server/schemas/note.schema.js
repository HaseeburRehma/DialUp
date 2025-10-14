const { z } = require('zod');

const noteSchema = z.object({
  text: z.string()
    .min(3, "Note must be at least 3 characters long")
    .max(5000, "Note cannot exceed 5000 characters"),
  audioUrls: z.array(z.string()).optional(),
  callerName: z.string().min(1, "Caller Name is required"),
  callerEmail: z.string().email("Invalid caller email"),
  callerLocation: z.string().min(1, "Caller Location is required"),
  callerAddress: z.string().min(1, "Caller Address is required"),
  callReason: z.string().min(1, "Reason for Call is required"),
});

const notePatchSchema = z.object({
  text: z.string().min(3).optional(),
  audioUrls: z.array(z.string()).optional(),
  callerName: z.string().optional(),
  callerEmail: z.string().email().optional(),
  callerLocation: z.string().optional(),
  callerAddress: z.string().optional(),
  callReason: z.string().optional(),
});

module.exports = {
  noteSchema,
  notePatchSchema
};