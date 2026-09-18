import { z } from "zod";

export const step1PersonalSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Enter a valid email").or(z.literal("")),
  phone: z.string().min(10, "Phone number is required"),
  city: z.string().min(1, "Please select your city"),
  profilePhoto: z.string().min(1, "Profile photo is required"),
});

export const step2SkillsSchema = z.object({
  skills: z.array(z.string()).min(1, "Please select at least one skill / service"),
});

export const step3ExperienceSchema = z.object({
  experienceYears: z.string().min(1, "Please select your years of experience"),
  bio: z.string().min(10, "Short bio must be at least 10 characters"),
  certificateFile: z.string().optional(),
  certificateName: z.string().optional(),
});

export const step4ServiceAreasSchema = z.object({
  serviceAreas: z.array(z.string()).min(1, "Please select at least one service area"),
  coverageRadius: z.string().min(1, "Coverage radius is required"),
  primaryAddress: z.string().min(3, "Please enter your workshop or base location"),
});

export const step5DocumentsSchema = z.object({
  cnicFront: z.string().min(1, "CNIC front side photo is required"),
  cnicBack: z.string().min(1, "CNIC back side photo is required"),
  cnicNumber: z.string().optional(),
});
