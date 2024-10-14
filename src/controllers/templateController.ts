import { Request, Response } from 'express';
import prisma from '../server';
import { uploadFileToFirebase, deleteFileFromFirebase } from '../services/fileService';
import { createTemplateSchema, updateTemplateSchema } from '../dto/template.dto';
import { z } from 'zod';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Create a new template
export async function createTemplate(req: AuthenticatedRequest, res: Response) {
  try {
    // Parse and validate request data using DTO schema
    const validatedData = createTemplateSchema.parse(JSON.parse(req.body.data));

    const {
      title, price, description, industryTypeId, templateTypeId,
      subCategoryId, softwareTypeId, version, isPaid, seoTags, credits, techDetails
    } = validatedData;

    const userId = req.user?.id;

    // Validate required fields
    if (!title || !price || !userId || !seoTags || !credits || !techDetails) {
      return res.status(400).json({ message: 'Title, price, user ID, SEO tags, credits, and tech details are required.' });
    }

    const uploadFiles = async (files: Express.Multer.File[], folder: string): Promise<string[]> => {
      return Promise.all(files.map(file => uploadFileToFirebase(file, folder)));
    };

    // Initialize empty arrays for the uploaded URLs
    let sliderImageUrls: string[] = [];
    let previewImageUrls: string[] = [];
    let sourceFileUrls: string[] = [];

    // Check if req.files is an array or an object with named fields
    if (Array.isArray(req.files)) {
      // If req.files is an array, you can't map the fields, so skip this step.
      console.log("Files uploaded without named fields");
    } else if (req.files) {
      // If req.files is an object, handle each file type
      if (req.files.sliderImages) {
        sliderImageUrls = await uploadFiles(req.files.sliderImages as Express.Multer.File[], 'sliderImages');
      }
      if (req.files.previewImages) {
        previewImageUrls = await uploadFiles(req.files.previewImages as Express.Multer.File[], 'previewImages');
      }
      if (req.files.sourceFiles) {
        sourceFileUrls = await uploadFiles(req.files.sourceFiles as Express.Multer.File[], 'sourceFiles');
      }
    }

    // Create a new template
    const newTemplate = await prisma.template.create({
      data: {
        title,
        price,
        description,
        industryTypeId,
        templateTypeId,
        softwareTypeId,
        subCategoryId,
        version,
        isPaid,
        seoTags,
        userId,
        credits: {
          create: credits.map((credit: any) => ({
            fonts: credit.fonts,
            images: credit.images,
            icons: credit.icons,
            illustrations: credit.illustrations,
          })),
        },
        techDetails,
      },
      include: {
        credits: true,
        sliderImages: true,
        previewImages: true,
        sourceFiles: true,
      },
    });

    // Link images in the related tables
    await Promise.all([
      ...sliderImageUrls.map(url => prisma.sliderImage.create({ data: { imageUrl: url, templateId: newTemplate.id } })),
      ...previewImageUrls.map(url => prisma.previewImage.create({ data: { imageUrl: url, templateId: newTemplate.id } })),
      ...sourceFileUrls.map(url => prisma.sourceFile.create({ data: { fileUrl: url, templateId: newTemplate.id } })),
    ]);

    return res.status(201).json({ message: 'Template created successfully', template: newTemplate });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      // Catch and handle validation errors
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    return res.status(500).json({ message: 'Failed to create template', error: error.message });
  }
}

// Delete a template and its associated files
export async function deleteTemplate(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) return res.status(404).json({ message: 'Template not found.' });

    // Delete files from Firebase
    const imageUrls = template.imageUrl?.split(',') || [];
    await Promise.all(imageUrls.map(url => deleteFileFromFirebase(url)));

    // Delete associated images and files
    await Promise.all([
      prisma.sliderImage.deleteMany({ where: { templateId: id } }),
      prisma.previewImage.deleteMany({ where: { templateId: id } }),
      prisma.sourceFile.deleteMany({ where: { templateId: id } }),
    ]);

    await prisma.template.delete({ where: { id } });

    return res.status(200).json({ message: 'Template deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete template', error: error.message });
  }
}

// Get all templates
export async function getTemplates(req: Request, res: Response) {
  try {
    const templates = await prisma.template.findMany({
      include: {
        credits: true,
        sliderImages: true,
        previewImages: true,
        sourceFiles: true,
      },
    });
    return res.status(200).json(templates);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch templates', error: error.message });
  }
}

// Get all templates by userID
export async function getAllTemplatesByUserId(req: Request, res: Response) {
  try {
    const templates = await prisma.template.findMany(
      {
        where: { userId: req.user?.id },
        include: {
          templateType:true,
          softwareType:true,
          industries:true,
          credits: true,
          sliderImages: true,
          previewImages: true,
          sourceFiles: true,
        },
      }
    )
    return res.status(200).json(templates);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to fetch templates by userID", error: error.message })
  }
}


// Get a single template by ID
export async function getTemplateById(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        credits: true,
        sliderImages: true,
        previewImages: true,
        sourceFiles: true,
      },
    });
    if (!template) return res.status(404).json({ message: 'Template not found.' });

    return res.status(200).json(template);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch template', error: error.message });
  }
}




// Update an existing template
export async function updateTemplate(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    // Find the existing template
    const existingTemplate = await prisma.template.findUnique({
      where: { id },
      include: {
        sliderImages: true,
        previewImages: true,
        sourceFiles: true,
        credits: true,
      },
    });
    if (!existingTemplate) {
      return res.status(404).json({ message: 'Template not found.' });
    }
    // Parse and validate request data using DTO schema
    const validatedData = updateTemplateSchema.parse(JSON.parse(req.body.data));

    const {
      title, price, description, industryTypeId, templateTypeId,
      softwareTypeId, version, isPaid, seoTags, credits, techDetails
    } = validatedData;

    // Validate user ownership of the template
    if (existingTemplate.userId !== req.user?.id) {
      return res.status(403).json({ message: 'You are not authorized to update this template.' });
    }

    const uploadFiles = async (files: Express.Multer.File[], folder: string): Promise<string[]> => {
      return Promise.all(files.map(file => uploadFileToFirebase(file, folder)));
    };

    // Initialize empty arrays for the uploaded URLs
    let sliderImageUrls: string[] = [];
    let previewImageUrls: string[] = [];
    let sourceFileUrls: string[] = [];

    // Check if req.files is an array or an object with named fields
    if (Array.isArray(req.files)) {
      console.log("Files uploaded without named fields");
    } else if (req.files) {
      if (req.files.sliderImages) {
        sliderImageUrls = await uploadFiles(req.files.sliderImages as Express.Multer.File[], 'sliderImages');
      }
      if (req.files.previewImages) {
        previewImageUrls = await uploadFiles(req.files.previewImages as Express.Multer.File[], 'previewImages');
      }
      if (req.files.sourceFiles) {
        sourceFileUrls = await uploadFiles(req.files.sourceFiles as Express.Multer.File[], 'sourceFiles');
      }
    }

    // Update the template
    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        title,
        price,
        description,
        industryTypeId,
        templateTypeId,
        softwareTypeId,
        version,
        isPaid,
        seoTags,
        techDetails,
        credits: {
          updateMany: credits?.map((credit: any, index: number) => ({
            where: { id: existingTemplate.credits[index].id },
            data: {
              fonts: credit.fonts,
              images: credit.images,
              icons: credit.icons,
              illustrations: credit.illustrations,
            },
          })),
        },
      },
      include: {
        credits: true,
      },
    });

    // Link the new images in the related tables (if any new images were uploaded)
    if (sliderImageUrls.length) {
      await prisma.sliderImage.deleteMany({ where: { templateId: id } });
      await Promise.all(sliderImageUrls.map(url => prisma.sliderImage.create({ data: { imageUrl: url, templateId: id } })));
    }

    if (previewImageUrls.length) {
      await prisma.previewImage.deleteMany({ where: { templateId: id } });
      await Promise.all(previewImageUrls.map(url => prisma.previewImage.create({ data: { imageUrl: url, templateId: id } })));
    }

    if (sourceFileUrls.length) {
      await prisma.sourceFile.deleteMany({ where: { templateId: id } });
      await Promise.all(sourceFileUrls.map(url => prisma.sourceFile.create({ data: { fileUrl: url, templateId: id } })));
    }

    return res.status(200).json({ message: 'Template updated successfully', template: updatedTemplate });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    return res.status(500).json({ message: 'Failed to update template', error: error.message });
  }
}