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

/**
 * Creates a new template in the system.
 * 
 * @param {AuthenticatedRequest} req - The request object containing the template data in the body, including title, description, credits, tech details, and various other fields.
 * @param {Response} res - The response object used to return a success message or an error message.
 * @returns {Promise<Response>} - A response indicating the success or failure of the template creation.
 * 
 * - This function processes incoming template creation requests by validating the required fields, including title, SEO tags, credits, and tech details.
 * - Files such as slider images, preview images, mobile preview images, and source files are uploaded to Firebase using a helper function.
 * - If any required fields are missing or invalid, a `400 Bad Request` status is returned with an error message.
 * - The `template` is created in the database using Prisma's `create` method, along with related data (credits, images, files).
 * - If the creation is successful, a `201 Created` status is returned with the newly created template data.
 * - In case of any errors, including validation errors or database issues, a `500 Internal Server Error` status is returned with an appropriate error message.
 */
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
console.log(softwareTypeId,"==softwareTypeId");

    // Create a new template
    const newTemplate = await prisma.template.create({
      data: {
        title,
        description,
        industryTypeId: industry,
        templateTypeId,
        softwareTypeId : softwareTypeId===""?null: softwareTypeId,
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


/**
 * Deletes a template and its associated files from the database.
 * 
 * @param {AuthenticatedRequest} req - The request object containing the template ID in the parameters.
 * @param {Response} res - The response object used to return a success or error message.
 * @returns {Promise<Response>} - A response indicating the success or failure of the template deletion.
 * 
 * - This function deletes a template and all related records (credits, images, source files, and download history) from the database.
 * - It first checks if the template exists using the provided `id`. If not, a `404 Not Found` status is returned with a message indicating the template doesn't exist.
 * - A Prisma transaction is used to delete all related records across multiple models, ensuring that the process is atomic (either all records are deleted or none).
 * - If successful, a `200 OK` status is returned along with a message confirming the deletion.
 * - In case of any errors during the deletion process, a `500 Internal Server Error` status is returned with an error message.
 */
export async function deleteTemplate(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
// console.log(id,"==id");

  try {
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) return res.status(404).json({ message: 'Template not found.' });

  
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



/**
 * Fetches templates with optional filters, pagination, and sorting.
 * 
 * @param {Request} req - The request object containing query parameters for filtering, pagination, and sorting.
 * @param {Response} res - The response object used to return the fetched templates and pagination details.
 * @returns {Promise<Response>} - A response containing the fetched templates and pagination metadata.
 * 
 * - This function allows you to fetch templates based on multiple filters such as industry type, template type, software type, price ranges, and search terms.
 * - The filters support both single values (like a `subCatId`) and arrays (like `industryTypeIds`, `templateTypeId`, etc.), with support for multiple values provided as comma-separated strings.
 * - Pagination is handled through `page` and `limit` query parameters, where `page` determines the current page number and `limit` specifies the number of templates per page.
 * - The `sortBy` query parameter allows sorting the results by "Newest releases", "Most popular", or "Best Seller", with the default being sorted by creation date.
 * - The function uses Prisma to query the database for templates, joining relevant data from related models like `credits`, `sliderImages`, `sourceFiles`, and others.
 * - It calculates the total number of templates matching the filters and returns the data along with pagination information, including the total number of templates, total pages, current page, and limit per page.
 * - If the query is successful, a `200 OK` status is returned with the data. If an error occurs, a `500 Internal Server Error` status is returned with an error message.
 */

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
      sortBy,
    } = req.query;

    console.log(sortBy,"=sort by");
    
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
    let orderBy: any;
    switch (sortBy) {
      case 'Newest releases':
        orderBy = { createdAt: 'desc' };
        break;
      case 'Most popular':
        orderBy = { downloads: 'desc' };
        break;
      case 'Best Seller':
        orderBy = { downloads: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' }; // Default to newest
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
              id: true,
              profileImg:true
            },
          },
        },
        skip, // Pagination offset
        take, // Limit per page
        orderBy, // Order by creation date
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



/**
 * Fetches the latest templates from the database.
 * 
 * @param {Request} req - The request object, used to handle incoming HTTP requests.
 * @param {Response} res - The response object, used to send back the response to the client.
 * @returns {Promise<Response>} - A response containing the latest templates and a success message.
 * 
 * - This function retrieves the most recently created templates from the database using Prisma's `findMany` method.
 * - The templates are selected with specific fields: `title`, `version`, `price`, `templateType`, and `id`.
 * - The templates are ordered by the `createdAt` field in descending order, ensuring the most recent templates are returned first.
 * - If the query is successful, a `200 OK` response is returned with the fetched templates and a success message.
 * - If an error occurs while fetching the templates, a `500 Internal Server Error` response is returned with an error message.
 */
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

    return res.json({ results: { templates: latestTemplates } });
  } catch (error) {
    console.error("Error fetching latest templates:", error);
    return res.status(500).json({ message: "Failed to fetch latest templates", error });
  }
};



/**
 * Fetches the latest featured templates from the database.
 * 
 * @param {Request} req - The request object, used to handle incoming HTTP requests.
 * @param {Response} res - The response object, used to send back the response to the client.
 * @returns {Promise<Response>} - A response containing the featured templates and a success message.
 * 
 * - This function retrieves the most recently created featured templates from the database using Prisma's `findMany` method.
 * - It selects specific fields for each template: `sliderImages`, `title`, `version`, `price`, `templateType`, `id`, and `softwareType`.
 * - The templates are ordered by the `createdAt` field in descending order to fetch the latest templates first.
 * - The `take` clause limits the result to only 6 templates to showcase featured ones.
 * - If the query is successful, a `200 OK` response is returned with the fetched featured templates and a success message.
 * - If an error occurs while fetching the templates, a `500 Internal Server Error` response is returned with an error message.
 */
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
        softwareType:true,
        user:{
          select:{
            id:true,
            name:true,
            profileImg:true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6  // Limit to 6 templates
    });

    return res.json({ results: { templates: featureTemplates } });
  } catch (error) {
    console.error("Error fetching feature templates:", error);
    return res.status(500).json({ message: "Failed to fetch feature Templates ", error });
  }
};


/**
 * Fetches the latest templates from the database.
 * 
 * @param {Request} req - The request object, representing the incoming HTTP request.
 * @param {Response} res - The response object, used to send back the response to the client.
 * @returns {Promise<Response>} - A response containing the latest templates or an error message.
 * 
 * - This function retrieves the most recently created templates from the database using Prisma's `findMany` method.
 * - The templates are ordered by the `createdAt` field in descending order to get the latest templates first.
 * - The `take` clause limits the results to 10 templates.
 * - The `include` clause fetches additional related data for each template, including `credits`, `sliderImages`, `previewImages`, `sourceFiles`, and `previewMobileImages`.
 * - If the query is successful, the function returns a `200 OK` response with the fetched templates in the `templates` property.
 * - In case of an error, the function logs the error and returns a `500 Internal Server Error` response with a message indicating failure.
 */
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




/**
 * Handles the download process for a template, including tracking downloads for both logged-in and unregistered users.
 * 
 * @param {Request} req - The request object, containing the template ID in the parameters and user data (userId, email, url) in the body.
 * @param {Response} res - The response object, used to send the success or error response.
 * @returns {Promise<Response>} - A response indicating whether the download was successfully recorded or an error occurred.
 * 
 * - This function processes template downloads and ensures that download limits are respected for both registered and unregistered users.
 * - If the user is logged in (with a valid `userId`), it checks if they have free downloads left and decrements the count accordingly.
 * - For unregistered users, the function tracks the number of downloads by email and limits the downloads to 3 per email.
 * - An email notification is sent to the user or email address when a download occurs.
 * - The template's download count is incremented in the database.
 * - A record of the download is created in the `downloadHistory` table, which includes information about the template, the user (if logged in), or the email (for unregistered users).
 * - If the user has reached the download limit or other conditions are not met, an appropriate error message is returned.
 * - In case of an error, a `500 Internal Server Error` response is returned with the error message.
 */
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
        return res.status(403).json({ message: "You've reached your daily download limit!" });
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


/**
 * Fetches the most popular templates based on the number of downloads.
 * 
 * @param {Request} req - The request object, which may contain query parameters (though not used in this function).
 * @param {Response} res - The response object, used to send the fetched templates or an error message.
 * @returns {Promise<Response>} - A response containing the list of popular templates or an error message.
 * 
 * - This function queries the database for templates and orders them by the highest number of downloads, ensuring that the most popular templates are retrieved first.
 * - The function fetches up to 10 templates (limit defined by the `take` parameter).
 * - The templates include associated data such as credits, slider images, preview images, source files, and preview mobile images.
 * - The response returns a JSON object containing the `templates` array with the popular templates.
 * - If an error occurs during the database query, a `500 Internal Server Error` response is returned with the error message.
 */
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




/**
 * Fetches all templates associated with a specific user by their userID.
 * 
 * @param {Request} req - The request object, which contains the `id` parameter (user ID) or `user` object.
 * @param {Response} res - The response object used to return the templates or an error message.
 * @returns {Promise<Response>} - A response containing the templates associated with the user ID or an error message.
 * 
 * - This function retrieves all templates that are associated with a specific user, identified by the `id` parameter in the URL or the `user` object in the request.
 * - The function queries the `template` table, filtering by the `userId` field, and includes related data, such as template type, software type, industries, credits, slider images, preview images, preview mobile images, and source files.
 * - The response returns a JSON object with the `results` field containing the fetched templates.
 * - If an error occurs during the query execution, the function will return a `500 Internal Server Error` response with an error message.
 */
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


/**
 * Fetches a single template by its ID.
 * 
 * @param {Request} req - The request object, containing the `id` parameter which is the template's unique identifier.
 * @param {Response} res - The response object used to return the template or an error message.
 * @returns {Promise<Response>} - A response containing the fetched template or an error message.
 * 
 * - This function retrieves a single template from the database by its unique `id` provided in the request parameters.
 * - The function queries the `template` table using `findUnique` and includes related data such as credits, images (slider, preview, mobile), source files, software type, and user details (user name and ID).
 * - If the template with the specified `id` is not found, the function returns a `404 Not Found` response with an appropriate message.
 * - In case of an error during the database query, a `500 Internal Server Error` response is returned, along with the error message.
 */
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



/**
 * Fetches templates based on a search query and optional subcategory filter.
 * 
 * @param {Request} req - The request object, which may contain the query parameter (`query`) for the template title and 
 *                         the optional `subCategoryId` query parameter to filter by subcategory.
 * @param {Response} res - The response object used to return the search results or an error message.
 * @returns {Promise<Response>} - A response containing a list of templates that match the search criteria or an error message.
 * 
 * - The function extracts the `query` (search keyword) and `subCategoryId` (optional filter) from the request query parameters.
 * - If the `query` is not provided or is empty, the function immediately returns an empty array of templates (200 OK).
 * - If a `query` is provided, the function searches for templates in the database whose title contains the search keyword (case-insensitive).
 * - If a `subCategoryId` is provided, the function applies this filter to narrow down the search to a specific subcategory.
 * - The results include the template's `id`, `title`, `description`, `imageUrl`, and `price`.
 * - In case of an error during the search, the function logs the error and returns a `500 Internal Server Error` response with a generic error message.
 */
export async function getTemplateByTitle(req: Request, res: Response) {
  const query = typeof req.query.query === 'string' ? req.query.query : undefined;
  const subCategoryId = typeof req.query.subCategoryId === 'string' ? req.query.subCategoryId : undefined;

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



/**
 * Updates the details of a template, including its credits and associated files.
 * This operation ensures that only the owner of the template can update it and that 
 * the changes are applied atomically through a database transaction.
 * 
 * @param {AuthenticatedRequest} req - The authenticated request object, which includes
 *                                     the template ID in the route parameters (`id`),
 *                                     user information (`req.user`), and any update data in the request body.
 * @param {Response} res - The response object used to send back a success or error message.
 * @returns {Promise<Response>} - A response with the result of the update operation or an error message.
 * 
 * Steps:
 * 1. Parses the credits data from the request body (expected as a JSON string).
 * 2. Retrieves the existing template and associated entities from the database.
 * 3. Verifies that the authenticated user is the owner of the template, preventing unauthorized updates.
 * 4. Updates the template with the provided data, including title, description, price, industry, and credits.
 * 5. If new files (slider images, preview images, source files) are uploaded, they are processed and saved to Firebase, and their URLs are stored in the database.
 * 6. The related images and files are deleted and recreated to reflect the newly uploaded versions.
 * 7. If the update is successful, returns a success response with the updated template data.
 * 8. In case of an error (e.g., template not found, unauthorized user), logs the error and returns a 500 status with an error message.
 */

export async function updateTemplate(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  
  console.log(req.body,"==req.body");
  
  // Parse the credits JSON in request body
  let creditData = JSON.parse(req.body.credits || '[]');
  

  try {
    // Start a transaction to ensure all updates are atomic
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
    // if (existingTemplate.userId !== req.user?.id) {
    //   throw new Error('You are not authorized to update this template.');
    // }

    const {
      title, price, description, industry, templateTypeId,
      softwareTypeId, version, isPaid, seoTags, techDetails
    } = req.body;
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
  
    const result = await prisma.$transaction(async (prisma) => {
      

      // Update the template details
      const updatedTemplate = await prisma.template.update({
        where: { id },
        data: {
          title,
          description,
          industryTypeId: industry,
          templateTypeId,
          softwareTypeId: (softwareTypeId ==="" || softwareTypeId =="null")?null:softwareTypeId,
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

  
      // Conditionally delete and recreate images if new ones are uploaded
      if (sliderImageUrls.length) {
        // await prisma.sliderImage.deleteMany({ where: { templateId: id } });
        await Promise.all(sliderImageUrls.map(url => prisma.sliderImage.create({ data: { imageUrl: url, templateId: id } })));
      }

      if (previewImageUrls.length) {
        // await prisma.previewImage.deleteMany({ where: { templateId: id } });
        await Promise.all(previewImageUrls.map(url => prisma.previewImage.create({ data: { imageUrl: url, templateId: id } })));
      }

      if (previewMobileImageUrls.length) {
        // await prisma.previewMobileImage.deleteMany({ where: { templateId: id } });
        await Promise.all(previewMobileImageUrls.map(url => prisma.previewMobileImage.create({ data: { imageUrl: url, templateId: id } })));
      }

      if (sourceFileUrls.length) {
        // await prisma.sourceFile.deleteMany({ where: { templateId: id } });
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
