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
    console.log("hererer", req.body);
    // const validatedData = createTemplateSchema.parse(JSON.parse(req.body.data));

    let creditqwqs = JSON.parse(req.body.credits)
    console.log(creditqwqs,"==creditqwqs");
    
    
    const {
      name, dollarPrice, description, industryType, templateType,
      templateSubCategory, softwareType, version, isPaid, seoTags, credits, techDetails
    } = req.body;

    const userId = req.user?.id;

    // Validate required fields
    if (!name ||  !userId || !seoTags || !credits || !techDetails) {
      return res.status(400).json({ message: 'Title, price, user ID, SEO tags, credits, and tech details are required.' });
    }

    const uploadFiles = async (files: Express.Multer.File[], folder: string): Promise<string[]> => {
      return Promise.all(files.map(file => uploadFileToFirebase(file, folder)));
    };

    // Initialize empty arrays for the uploaded URLs
    let sliderImageUrls: string[] = [];
    let previewImageUrls: string[] = [];
    let previewMobileImageUrls: string[] = [];
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
      if (req.files.previewMobileImages) {
        previewMobileImageUrls = await uploadFiles(req.files.previewMobileImages as Express.Multer.File[], 'previewMobileImages');
      }
      if (req.files.sourceFiles) {
        sourceFileUrls = await uploadFiles(req.files.sourceFiles as Express.Multer.File[], 'sourceFiles');
      }
    }

    // Create a new template
    const newTemplate = await prisma.template.create({
      data: {
        title:name,
        price:dollarPrice!=="undefined" ?Number(dollarPrice):0,
        description,
        industryTypeId:industryType[0].id,
        templateTypeId:templateType,
        softwareTypeId:softwareType,
        subCategoryId:templateSubCategory,
        version,
        isPaid:Boolean(isPaid),
        seoTags,
        userId,
        credits: {
          create: creditqwqs.map((credit: any) => ({
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
        previewMobileImages: true,
        sourceFiles: true,
      },
    });

    // Link images in the related tables
    await Promise.all([
      ...sliderImageUrls.map(url => prisma.sliderImage.create({ data: { imageUrl: url, templateId: newTemplate.id } })),
      ...previewImageUrls.map(url => prisma.previewImage.create({ data: { imageUrl: url, templateId: newTemplate.id } })),
      ...previewMobileImageUrls.map(url => prisma.previewMobileImage.create({ data: { imageUrl: url, templateId: newTemplate.id } })),
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
      prisma.previewMobileImage.deleteMany({ where: { templateId: id } }),
      prisma.sourceFile.deleteMany({ where: { templateId: id } }),
    ]);

    await prisma.template.delete({ where: { id } });

    return res.status(200).json({ message: 'Template deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete template', error: error.message });
  }
}

// Get templates with filters and pagination
export async function getTemplates(req: Request, res: Response) {
  // console.log(req.query,"=req query");

  try {
    const {
      industryTypeIds, // Can be string or array
      templateTypeId, // Can be string or array
      softwareTypeIds, // Can be string or array
      subcategoryIds, // Can be string or array
      isPaid,
      priceRanges, // Can be string or array
      search,
      page = 1,
      limit = 12,
    } = req.query;


    // console.log(priceRanges,"==price ranges");


    // Initialize filters object
    const filters: any = {};

    // Utility function to handle string or array inputs
    const handleArrayInput = (input: any) => {
      if (Array.isArray(input)) return input;
      if (typeof input === 'string') return input.split(',');
      return [];
    };

    // Handle industry filter (multiple industries)
    if (industryTypeIds) {
      filters.industryTypeId = { in: handleArrayInput(industryTypeIds) };
    }

    // Handle template type filter (multiple types)
    if (templateTypeId) {
      filters.templateTypeId = templateTypeId;
    }
    // Handle subcategory filter (multiple subcategories)
    if (subcategoryIds) {
      filters.subcategoryId = { in: handleArrayInput(subcategoryIds) };
    }

    // Handle software type filter (multiple software types)
    if (softwareTypeIds) {
      filters.softwareTypeId = { in: handleArrayInput(softwareTypeIds) };
    }

    // Handle isPaid filter (boolean)
    if (isPaid) {
      filters.isPaid = isPaid === 'true'; // Convert to boolean
    }

    // Handle price range filter
    if (priceRanges) {
      const ranges = handleArrayInput(priceRanges);
      const priceConditions = ranges.map((range: string) => {
        const [minPrice, maxPrice] = range.split('-').map((p) => parseFloat(p));
        return { gte: minPrice, lte: maxPrice }; // Add range condition
      });

      // Combine multiple price conditions with OR logic
      filters.OR = priceConditions.map((rangeCondition) => ({
        price: rangeCondition,
      }));
    }

    // Handle search query
    if (search) {
      filters.title = { contains: search as string };
    }

    // Pagination logic
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Fetch templates with filters, pagination, and relations
    const [templates, totalTemplates] = await Promise.all([
      prisma.template.findMany({
        where: {
          ...filters,
          subCategory: {
            templateTypeId: templateTypeId, // Ensure subcategory matches template type
          }
        },
        include: {
          credits: true,
          sliderImages: true,
          previewImages: true,
          previewMobileImages: true,
          sourceFiles: true,
          templateType: true,
          softwareType: true,
          subCategory: true,
          user: {
            select: {
              name: true,
            },
          },
        },
        skip, // Pagination offset
        take, // Limit per page
        orderBy: { createdAt: 'desc' }, // Order by creation date
      }),
      prisma.template.count({
        where: filters, // Count total templates matching filters
      }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalTemplates / take);

    // Send the response
    return res.status(200).json({
      data: templates,
      pagination: {
        totalTemplates,
        totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch templates', error: error.message });
  }
}


// Fetch Latest Templates
export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const latestTemplates = await prisma.template.findMany({
// include:{
//   templateType:true
// }
      select: {
        title:true,
        version:true,
        price:true,
        // templateTypeId:true,
        templateType:true,
        id:true
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return res.json({results:{ templates: latestTemplates, message:"data fecht success" }});
  } catch (error) {
    console.error("Error fetching latest templates:", error);
    return res.status(500).json({ message: "Failed to fetch latest templates", error });
  }
};
export const getLatestTemplates = async (req: Request, res: Response) => {
  try {
    const latestTemplates = await prisma.template.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        credits: true,
        sliderImages: true,
        previewImages: true,
        sourceFiles: true,
        previewMobileImages: true,
      },
    });

    return res.json({ templates: latestTemplates });
  } catch (error) {
    console.error("Error fetching latest templates:", error);
    return res.status(500).json({ message: "Failed to fetch latest templates", error });
  }
};

// Record template download
export const templateDownloads = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const template = await prisma.template.update({
      where: { id },
      data: { downloads: { increment: 1 } },
    });
    res.json({ message: 'Download recorded', template });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record download', error });
  }
}

// Fetch Popular Templates
export const getPopularTemplates = async (req: Request, res: Response) => {
  try {
    const popularTemplates = await prisma.template.findMany({
      orderBy: {
        downloads: 'desc',
      },
      take: 10,
      include: {
        credits: true,
        sliderImages: true,
        previewImages: true,
        sourceFiles: true,
        previewMobileImages: true,
      },
    });

    return res.json({ templates: popularTemplates });
  } catch (error) {
    console.error("Error fetching popular templates:", error);
    return res.status(500).json({ message: "Failed to fetch popular templates", error });
  }
};


// Get all templates by userID
export async function getAllTemplatesByUserId(req: Request, res: Response) {
  try {
    const templates = await prisma.template.findMany(
      {
        where: { userId: req.user?.id },
        include: {
          templateType: true,
          softwareType: true,
          industries: true,
          credits: true,
          sliderImages: true,
          previewImages: true,
          previewMobileImages: true,
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
        previewMobileImages: true,
        sourceFiles: true,
        templateType: true,
        subCategory: true,
        user: true,
        softwareType: true
      },
    });
    // console.log(template,"==template");

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
        previewMobileImages: true,
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
    let previewMobileImageUrls: string[] = [];
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
      if (req.files.previewImagesMobile) {
        previewMobileImageUrls = await uploadFiles(req.files.previewMobileImages as Express.Multer.File[], 'previewMobileImages');
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
    if (previewMobileImageUrls.length) {
      await prisma.previewImage.deleteMany({ where: { templateId: id } });
      await Promise.all(previewMobileImageUrls.map(url => prisma.previewMobileImage.create({ data: { imageUrl: url, templateId: id } })));
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