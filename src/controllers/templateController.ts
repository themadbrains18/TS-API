import { Request, Response } from 'express';
import prisma from '../server';
import { uploadFileToFirebase, deleteFileFromFirebase } from '../services/fileService';
import { createTemplateSchema, updateTemplateSchema } from '../dto/template.dto';
import { z } from 'zod';
import { sendTemplateEmail } from '../services/nodeMailer';


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


    const {
      title, price, description, industry, templateTypeId,
      subCategoryId, softwareTypeId, version, isPaid, seoTags, credits, techDetails
    } = req.body;

    const userId = req.user?.id;

    // Validate required fields
    if (!title || !userId || !seoTags || !credits || !techDetails) {
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
        title,
        description,
        industryTypeId: industry,
        templateTypeId,
        softwareTypeId,
        subCategoryId,
        version,
        price: (price != "undefined" && isPaid === "true") ? Number(price) : 0,
        isPaid: (isPaid === "false" ? false : true),
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

    return res.status(201).json({ message: 'Template created successfully', template: newTemplate, });
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
// console.log(id,"==id");

  try {
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) return res.status(404).json({ message: 'Template not found.' });

    // Delete files from Firebase
    // const imageUrls = template.imageUrl?.split(',') || [];
    // await Promise.all(imageUrls.map(url => deleteFileFromFirebase(url)));

    // Delete associated images and files
    // await Promise.all([
    //   // prisma.sliderImage.deleteMany({ where: { templateId: JSON.stringify(id) } }),
    //   // prisma.previewImage.deleteMany({ where: { templateId: JSON.stringify(id) } }),
    //   // prisma.previewMobileImage.deleteMany({ where: { templateId: JSON.stringify(id) } }),
    //   // prisma.sourceFile.deleteMany({ where: { templateId: JSON.stringify(id) } }),
    // ]);
    await prisma.$transaction([
      // Delete related records in other models
      prisma.credit.deleteMany({ where: { templateId: id } }),
      prisma.sourceFile.deleteMany({ where: { templateId: id } }),
      prisma.sliderImage.deleteMany({ where: { templateId: id } }),
      prisma.previewImage.deleteMany({ where: { templateId: id } }),
      prisma.previewMobileImage.deleteMany({ where: { templateId: id } }),
      prisma.downloadHistory.deleteMany({ where: { templateId: id } }),

      // Delete the main template record
      prisma.template.delete({
        where: { id },
      }),
    ]);

    res.status(200).json({
      message: 'Template and related records deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete template', error: error.message });
  }
}

// Get templates with filters and pagination
export async function getTemplates(req: Request, res: Response) {

  try {
    const {
      industryTypeIds, // Can be string or array
      templateTypeId, // Can be string or array
      softwareTypeIds, // Can be string or array
      subCatId, // Single string
      isPaid,
      priceRanges, // Can be string or array
      search,
      page = 1,
      limit = 12,
    } = req.query;

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
      filters.templateTypeId = { in: handleArrayInput(templateTypeId) };
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

    // Prepare subCategory filter
    const subCategoryFilter: any = {};
    if (subCatId) {
      subCategoryFilter.subCategoryId = subCatId; // Use single value directly
    }

    // Fetch templates with filters, pagination, and relations
    const [templates, totalTemplates] = await Promise.all([
      prisma.template.findMany({
        where: {
          ...filters,
          ...(templateTypeId ? { templateTypeId: { in: handleArrayInput(templateTypeId) } } : {}),
          ...(subCatId ? subCategoryFilter : {}),

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
              id: true
            },
          },
        },
        skip, // Pagination offset
        take, // Limit per page
        orderBy: { createdAt: 'desc' }, // Order by creation date
      }),
      prisma.template.count({
        where: {
          ...filters,
          ...(templateTypeId ? { templateTypeId: { in: handleArrayInput(templateTypeId) } } : {}),
          ...(subCatId ? subCategoryFilter : {}),
        }
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
        title: true,
        version: true,
        price: true,
        // templateTypeId:true,
        templateType: true,
        id: true
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return res.json({ results: { templates: latestTemplates, message: "data fecht success" } });
  } catch (error) {
    console.error("Error fetching latest templates:", error);
    return res.status(500).json({ message: "Failed to fetch latest templates", error });
  }
};



// Fetch Latest Templates
export const featureTemplates = async (req: Request, res: Response) => {
  try {
    console.log("here");

    const featureTemplates = await prisma.template.findMany({
      select: {
        sliderImages: true,
        title: true,
        version: true,
        price: true,
        templateType: true,
        id: true,
        softwareType:true
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6  // Limit to 6 templates
    });

    return res.json({ results: { templates: featureTemplates, message: "data fecht success" } });
  } catch (error) {
    console.error("Error fetching feature templates:", error);
    return res.status(500).json({ message: "Failed to fetch feature Templates ", error });
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


export const templateDownloads = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, email, url } = req.body; // Expecting `userId` for logged-in users and `email` for unregistered users

  try {
    // Check if userId is provided for logged-in users
    const templateData: any = await prisma.template.findFirst({
      where: { id: id }
    })
    if (userId) {
      const user: any = await prisma.user.findUnique({
        where: { id: userId },
      });

      // Check if user has free downloads left
      if (user && user.freeDownloads > 0) {
        // Decrement the user's free downloads count
        await prisma.user.update({
          where: { id: userId },
          data: { freeDownloads: user.freeDownloads - 1 },
        });

        // Send email notification
        await sendTemplateEmail(user.email, url, templateData?.title, user?.name)

      } else {
        return res.status(403).json({ message: 'No free downloads available.' });
      }
    } else if (!userId && email) {
      // Logic for unregistered users (e.g., tracking downloads by email)
      // Send email notification

      const downloadsCount = await prisma.downloadHistory.count({
        where: { email: req.body.email }, // Assume email is passed in body
      });

      if (downloadsCount >= 3) {
        return res.status(403).json({ message: "Limit of 3 free downloads reached." });
      }
      await sendTemplateEmail(email, url, templateData?.title, email)
    }

    // Update the template's download count
    const template = await prisma.template.update({
      where: { id },
      data: { downloads: { increment: 1 } },
    });

    // Record download history based on whether userId or email is provided
    await prisma.downloadHistory.create({
      data: {
        templateId: id,
        userId: userId || null, // Use null if user is not logged in
        email: email || '',      // Ensure email is provided for unregistered users
        downloadedAt: new Date(),
      },
    });

    res.json({ message: 'Download recorded', results: template });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to record download', error });
  }
};
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

    let id = req.params.id || req.user?.id
    console.log(id, "==is");

    const templates = await prisma.template.findMany(
      {

        where: { userId: id },
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
    return res.status(200).json({ results: { data: templates } });
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
        softwareType: true,
        user: {
          select: {
            name: true,
            id: true
          }
        }
      },
    });
    // console.log(template,"==template");

    if (!template) return res.status(404).json({ message: 'Template not found.' });

    return res.status(200).json(template);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch template', error: error.message });
  }
}
// Get a single template by title
export async function getTemplateByTitle(req: Request, res: Response) {
  const query = typeof req.query.query === 'string' ? req.query.query : undefined;
  const subCategoryId = typeof req.query.subCategoryId === 'string' ? req.query.subCategoryId : undefined;

  // console.log(subCategoryId, "==jhkjhkjh", query);

  // Early return if query is empty
  if (!query) {
    return res.status(200).json({ templates: [] }); // Return an empty array if there is no query
  }

  try {
    const results = await prisma.template.findMany({
      where: {
        AND: [
          { title: { contains: query } }, // Apply title filter as query is valid
          subCategoryId ? { subCategoryId } : {}, // Apply subCategoryId filter if valid
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
      },
    });

    res.status(200).json({ templates: results });
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ message: 'Error searching templates' });
  }
}




export async function updateTemplate(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  
  console.log(req.body,"==req.body");
  
  // Parse the credits JSON in request body
  let creditData = JSON.parse(req.body.credits || '[]');
  

  try {
    // Start a transaction to ensure all updates are atomic
    const result = await prisma.$transaction(async (prisma) => {
      
      // Retrieve the existing template with all related entities
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
        throw new Error('Template not found.');
      }

      // Check user ownership
      if (existingTemplate.userId !== req.user?.id) {
        throw new Error('You are not authorized to update this template.');
      }

      const {
        title, price, description, industry, templateTypeId,
        softwareTypeId, version, isPaid, seoTags, techDetails
      } = req.body;

      // Update the template details
      const updatedTemplate = await prisma.template.update({
        where: { id },
        data: {
          title,
          description,
          industryTypeId: industry,
          templateTypeId,
          softwareTypeId,
          version,
          price: (price !== "undefined" && isPaid === "true") ? Number(price) : 0,
          isPaid: isPaid === "true",
          seoTags,
          techDetails,
          credits: {
            updateMany: creditData.length > 0
              ? creditData.map((credit: any, index: number) => ({
                  where: { id: existingTemplate.credits[index].id },
                  data: {
                    fonts: credit.fonts,
                    images: credit.images,
                    icons: credit.icons,
                    illustrations: credit.illustrations,
                  },
                }))
              : undefined,
          },
        },
        include: { credits: true },
      });

      // Function to handle file uploads
      const uploadFiles = async (files: Express.Multer.File[], folder: string): Promise<string[]> => {
        return Promise.all(files.map(file => uploadFileToFirebase(file, folder)));
      };

      // Arrays to store the uploaded URLs
      let sliderImageUrls: string[] = [];
      let previewImageUrls: string[] = [];
      let previewMobileImageUrls: string[] = [];
      let sourceFileUrls: string[] = [];

      console.log(req.files,"=req.files");
      
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
        if (req.files.previewMobileImages) {
          previewMobileImageUrls = await uploadFiles(req.files.previewMobileImages as Express.Multer.File[], 'previewMobileImages');
        }
        if (req.files.sourceFiles) {
          sourceFileUrls = await uploadFiles(req.files.sourceFiles as Express.Multer.File[], 'sourceFiles');
        }
      }

      // Conditionally delete and recreate images if new ones are uploaded
      if (sliderImageUrls.length) {
        await prisma.sliderImage.deleteMany({ where: { templateId: id } });
        await Promise.all(sliderImageUrls.map(url => prisma.sliderImage.create({ data: { imageUrl: url, templateId: id } })));
      }

      if (previewImageUrls.length) {
        await prisma.previewImage.deleteMany({ where: { templateId: id } });
        await Promise.all(previewImageUrls.map(url => prisma.previewImage.create({ data: { imageUrl: url, templateId: id } })));
      }

      if (previewMobileImageUrls.length) {
        await prisma.previewMobileImage.deleteMany({ where: { templateId: id } });
        await Promise.all(previewMobileImageUrls.map(url => prisma.previewMobileImage.create({ data: { imageUrl: url, templateId: id } })));
      }

      if (sourceFileUrls.length) {
        await prisma.sourceFile.deleteMany({ where: { templateId: id } });
        await Promise.all(sourceFileUrls.map(url => prisma.sourceFile.create({ data: { fileUrl: url, templateId: id } })));
      }

      return updatedTemplate;
    });

    // Send a success response with the updated template
    return res.status(200).json({ message: 'Template updated successfully', template: result });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update template', error: error.message });
  }
}
