import { z } from "zod";
import "dotenv/config"; // Ensures .env is loaded before validation

const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("5000").transform(Number),

  // Database
  DATABASE_URL: z.string({
    message: "DATABASE_URL is required — check your .env file",
  }),

  // Redis
  REDIS_URL: z.string({
    message: "REDIS_URL is required — Redis powers job queues and presence",
  }),

  // Auth
  JWT_SECRET: z
    .string({ message: "JWT_SECRET is required for signing tokens" })
    .min(32, "JWT_SECRET must be at least 32 characters long"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  REFRESH_TOKEN_SECRET: z
    .string({
      message: "REFRESH_TOKEN_SECRET is required",
    })
    .min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters long"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("30d"),

  // Paystack (for Ajo wallet funding and payouts)
  PAYSTACK_SECRET_KEY: z.string({
    message: "PAYSTACK_SECRET_KEY is required for payment processing",
  }),
  PAYSTACK_PUBLIC_KEY: z.string({
    message: "PAYSTACK_PUBLIC_KEY is required",
  }),
  PAYSTACK_WEBHOOK_SECRET: z.string({
    message:
      "PAYSTACK_WEBHOOK_SECRET is required to verify payment webhooks",
  }),

  // App
  APP_NAME: z.string().default("Ajo"),
  FRONTEND_URL: z.string().url().default("http://localhost:8081"),

  // Bull Queue (optional override, falls back to REDIS_URL)
  BULL_REDIS_URL: z.string().optional(),

  // Notifications (optional for now, required in production)
  FCM_SERVER_KEY: z.string().optional(),

//   TWILIO_ACCOUNT_SID: z.string({ message: "TWILIO_ACCOUNT_SID is required" }),
//   TWILIO_AUTH_TOKEN: z.string({ message: "TWILIO_AUTH_TOKEN is required" }),
//   TWILIO_PHONE_NUMBER: z.string({ message: "TWILIO_PHONE_NUMBER is required" }),

SMTP_HOST: z.string({ message: "SMTP_HOST is required" }),
  SMTP_PORT: z.string().transform(Number),
  SMTP_USER: z.string({ message: "SMTP_USER is required" }),
  SMTP_PASS: z.string({ message: "SMTP_PASS is required" }),
  SMTP_FROM: z.string().email().default("[EMAIL_ADDRESS]"),

});


// Parse and validate — throws a detailed error if anything is wrong
const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error("❌ Invalid environment variables:");
  // Format and log the specific errors from Zod nicely
  console.error(_parsed.error.format());
  
  // Kill the process. We don't want the app starting with broken config.
  process.exit(1); 
}

// Export the validated, typed variables!
export const env = _parsed.data;