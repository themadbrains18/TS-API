// src/dto/template.dto.ts
import { z } from 'zod';

// ================================================================================================ //
// ---------------------------------- Create Template DTO ----------------------------------------- //
// ================================================================================================ //
export const createTemplateSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  price: z.number().positive({ message: 'Price must be a positive number' }),
  description: z.string().optional(),
  industryTypeId: z.string().optional(),
  templateTypeId: z.string().optional(),
  subCategoryId: z.string().optional(),
  softwareTypeId: z.string().optional(),
  version: z.string().optional(),
  isPaid: z.boolean().optional(),
  seoTags: z.array(z.string()).min(1, { message: 'At least one SEO tag is required' }),
  credits: z.array(
    z.object({
      fonts: z.array(z.string()).optional(),
      images: z.array(z.string()).optional(),
      icons: z.array(z.string()).optional(),
      illustrations: z.array(z.string()).optional(),
    })
  ),
  techDetails: z.array(z.string()).min(1, { message: 'At least one tech detail is required' }),
});

// ================================================================================================ //
// ---------------------------------- Update Template DTO ----------------------------------------- //
// ================================================================================================ //
export const updateTemplateSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).optional(),
  price: z.number().positive({ message: 'Price must be a positive number' }).optional(),
  description: z.string().optional(),
  industryTypeId: z.string().optional(),
  templateTypeId: z.string().optional(),
  subCategoryId: z.string().optional(),
  softwareTypeId: z.string().optional(),
  version: z.string().optional(),
  isPaid: z.boolean().optional(),
  seoTags: z.array(z.string()).min(1, { message: 'At least one SEO tag is required' }).optional(),
  credits: z.array(
    z.object({
      fonts: z.array(z.string()).optional(),
      images: z.array(z.string()).optional(),
      icons: z.array(z.string()).optional(),
      illustrations: z.array(z.string()).optional(),
    })
  ).optional(),
  techDetails: z.array(z.string()).min(1, { message: 'At least one tech detail is required' }).optional(),

  // Additional fields for updating images and files
  sliderImages: z.array(z.string()).optional(),  // New field for updated slider image URLs
  previewImages: z.array(z.string()).optional(), // New field for updated preview image URLs
  sourceFiles: z.array(z.string()).optional(),   // New field for updated source file URLs
});

// ================================================================================================ //
// ---------------------------------- Get Template by ID DTO -------------------------------------- //
// ================================================================================================ //
export const getTemplateByIdSchema = z.object({
  id: z.string().min(1, { message: 'Template ID is required' }),
});

// ================================================================================================ //
// ------------------------------- Get All Templates by User DTO --------------------------------- //
// ================================================================================================ //
export const getAllTemplatesByUserIdSchema = z.object({
  userId: z.string().min(1, { message: 'User ID is required' }),
});

// ================================================================================================ //
// ---------------------------------- Delete Template DTO ----------------------------------------- //
// ================================================================================================ //
export const deleteTemplateSchema = z.object({
  id: z.string().min(1, { message: 'Template ID is required' }),
});
