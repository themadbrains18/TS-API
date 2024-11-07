import { z } from 'zod';

/**
 * Create Template DTO (Data Transfer Object) Schema.
 * 
 * This schema is used to validate the incoming data when creating a new template. It ensures that the necessary fields are present and in the correct format before proceeding with the template creation process.
 * 
 * The schema includes the following fields:
 * 
 * - `title`: A required string that represents the title of the template.
 * - `price`: A required positive number indicating the price of the template.
 * - `description`: An optional string providing a description of the template.
 * - `industryTypeId`: An optional string representing the ID of the industry type the template belongs to.
 * - `templateTypeId`: An optional string representing the ID of the template type.
 * - `subCategoryId`: An optional string representing the ID of the subcategory the template belongs to.
 * - `softwareTypeId`: An optional string representing the ID of the software type for the template.
 * - `version`: An optional string for the version of the template.
 * - `isPaid`: An optional boolean indicating whether the template is paid.
 * - `seoTags`: A required array of strings representing SEO tags associated with the template.
 * - `credits`: A required array of objects that hold the credits for the template. Each credit can contain optional arrays of strings for fonts, images, icons, and illustrations.
 * - `techDetails`: A required array of strings representing technical details about the template.
 * 
 * The schema uses `zod`'s validation methods to ensure that the fields adhere to the specified rules:
 * - `min()` is used to ensure the minimum length of strings or arrays where applicable.
 * - `positive()` ensures that the `price` is a positive number.
 * - `optional()` allows fields to be omitted but ensures they follow the correct type when provided.
 * - `array()` and `string()` methods are used to validate that the values are arrays of strings.
 * 
 * This schema is used to validate the data before it is processed to create a new template in the system.
 */
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



/**
 * Update Template DTO (Data Transfer Object) Schema.
 * 
 * This schema is used to validate the incoming data when updating an existing template. It ensures that the fields provided for the update are valid and in the correct format, allowing partial updates where necessary.
 * 
 * The schema includes the following fields:
 * 
 * - `title`: An optional string representing the title of the template. If provided, it must have at least 1 character.
 * - `price`: An optional positive number indicating the price of the template. If provided, it must be a positive value.
 * - `description`: An optional string providing a description of the template.
 * - `industryTypeId`: An optional string representing the ID of the industry type the template belongs to.
 * - `templateTypeId`: An optional string representing the ID of the template type.
 * - `subCategoryId`: An optional string representing the ID of the subcategory the template belongs to.
 * - `softwareTypeId`: An optional string representing the ID of the software type for the template.
 * - `version`: An optional string for the version of the template.
 * - `isPaid`: An optional boolean indicating whether the template is paid.
 * - `seoTags`: An optional array of strings representing SEO tags associated with the template. If provided, at least one tag is required.
 * - `credits`: An optional array of objects that hold the credits for the template. Each credit can contain optional arrays of strings for fonts, images, icons, and illustrations.
 * - `techDetails`: An optional array of strings representing technical details about the template. If provided, at least one detail is required.
 * - `sliderImages`: An optional array of strings representing URLs for updated slider images.
 * - `previewImages`: An optional array of strings representing URLs for updated preview images.
 * - `sourceFiles`: An optional array of strings representing URLs for updated source files.
 * 
 * The schema uses `zod`'s validation methods to ensure that the fields adhere to the specified rules:
 * - `min()` is used to ensure the minimum length of strings or arrays where applicable.
 * - `positive()` ensures that the `price` is a positive number if provided.
 * - `optional()` allows fields to be omitted but ensures they follow the correct type when provided.
 * - `array()` and `string()` methods are used to validate that the values are arrays of strings.
 * 
 * This schema validates the data before it is processed to update an existing template in the system.
 */
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



/**
 * Get Template by ID DTO (Data Transfer Object) Schema.
 * 
 * This schema is used to validate the `id` parameter when fetching a template by its unique identifier. It ensures that the provided `id` is a valid UUID format before proceeding with the template retrieval process.
 * 
 * The schema includes the following field:
 * 
 * - `id`: A required string that must be a valid UUID format. If the `id` does not conform to this format, an error message will indicate that the provided ID is invalid.
 * 
 * The schema uses `zod`'s validation method:
 * - `uuid()` to ensure that the `id` follows the universally unique identifier (UUID) format.
 * 
 * This schema validates the `id` before the system processes the request to get the template by its ID.
 */
export const getTemplateByIdSchema = z.object({
  id: z.string().uuid({ message: 'Invalid Template ID format (must be UUID)' }),
});


/**
 * Get All Templates by User ID DTO (Data Transfer Object) Schema.
 * 
 * This schema is used to validate the `userId` parameter when retrieving all templates associated with a specific user. It ensures that the `userId` is present and not an empty string before proceeding with fetching the templates.
 * 
 * The schema includes the following field:
 * 
 * - `userId`: A required string representing the ID of the user. It must have at least 1 character, ensuring that a valid user ID is provided.
 * 
 * The schema uses `zod`'s validation methods:
 * - `min(1)` ensures that the `userId` has at least one character.
 * 
 * This schema validates the `userId` before the system processes the request to retrieve all templates associated with the specified user.
 */
export const getAllTemplatesByUserIdSchema = z.object({
  userId: z.string().min(1, { message: 'User ID is required' }),
});



/**
 * Delete Template DTO (Data Transfer Object) Schema.
 * 
 * This schema is used to validate the `id` parameter when deleting a template. It ensures that the `id` is provided and is not an empty string before proceeding with the template deletion process.
 * 
 * The schema includes the following field:
 * 
 * - `id`: A required string representing the ID of the template to be deleted. It must have at least 1 character, ensuring that a valid template ID is provided.
 * 
 * The schema uses `zod`'s validation methods:
 * - `min(1)` ensures that the `id` has at least one character, meaning the template ID cannot be an empty string.
 * 
 * This schema validates the `id` before the system processes the request to delete the specified template.
 */
export const deleteTemplateSchema = z.object({
  id: z.string().min(1, { message: 'Template ID is required' }),
});
