import { z } from "zod";
import { normalizePkPhone } from "../lib/phone";

export const phoneSchema = z
  .string()
  .min(1, "Enter your mobile number")
  .refine((value) => normalizePkPhone(value) !== null, {
    message: "Enter a valid Pakistani mobile number, e.g. 03xx-xxxxxxx",
  });

export const otpSchema = z
  .string()
  .regex(/^\d{6}$/, "Enter the 6-digit code");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export const phoneFormSchema = z.object({
  phone: phoneSchema,
});

export type PhoneFormValues = z.infer<typeof phoneFormSchema>;

export const otpFormSchema = z.object({
  code: otpSchema,
});

export type OtpFormValues = z.infer<typeof otpFormSchema>;

export const passwordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordFormValues = z.infer<typeof passwordFormSchema>;