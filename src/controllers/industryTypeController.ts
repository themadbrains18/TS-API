import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Creates a new industry type.
 * 
 * @param {Request} req - The request object containing the industry name in the request body.
 * @param {Response} res - The response object to send back the created industry type or an error message.
 * @returns {Promise<Response>} - A response containing the newly created industry type or an error message.
 * 
 * - Extracts the `name` of the industry type from the request body.
 * - Creates a new industry type in the database with the provided name.
 * - Sends the newly created industry type in the response.
 * - Handles any errors that occur during the creation process and returns an error message.
 */
export const createIndustryType = async (req: Request, res: Response) => {
  const { name } = req.body;

  try {
    const newIndustryType = await prisma.industryType.create({
      data: { name },
    });
    return res.status(201).json(newIndustryType);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create industry type", error });
  }
};



/**
 * Fetches all industry types from the database.
 * 
 * @param {Request} req - The request object (no parameters needed).
 * @param {Response} res - The response object to send back the list of industry types or an error message.
 * @returns {Promise<Response>} - A response containing the list of industry types or an error message.
 * 
 * - Retrieves all industry types from the database.
 * - Sends the list of industry types in the response in a `results` object.
 * - Handles any errors that occur during the retrieval process and returns an error message.
 */
export const getIndustryTypes = async (req: Request, res: Response) => {
  try {
    const industryTypes = await prisma.industryType.findMany({
      orderBy: {
        createdAt: 'asc',
      }
    });
    return res.status(200).json({ results: industryTypes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to retrieve industry types", error });
  }
};



/**
 * Fetches an industry type by its ID.
 * 
 * @param {Request} req - The request object containing the `id` parameter in the URL.
 * @param {Response} res - The response object to send back the industry type or an error message.
 * @returns {Promise<Response>} - A response containing the industry type or an error message.
 * 
 * - Retrieves a single industry type based on the `id` provided in the request parameters.
 * - If the industry type is found, it returns the industry type in the response.
 * - If no industry type is found, it returns a 404 status code with a "Industry type not found" message.
 * - Handles any errors that occur during the retrieval process and returns an error message.
 */
export const getIndustryTypeById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const industryType = await prisma.industryType.findUnique({
      where: { id },
    });

    if (!industryType) {
      return res.status(404).json({ message: "Industry type not found" });
    }

    return res.status(200).json(industryType);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to retrieve industry type", error });
  }
};



/**
 * Updates an existing industry type by its ID.
 * 
 * @param {Request} req - The request object containing the `id` parameter in the URL and the updated `name` in the request body.
 * @param {Response} res - The response object to send back the updated industry type or an error message.
 * @returns {Promise<Response>} - A response containing the updated industry type or an error message.
 * 
 * - Retrieves the industry type based on the `id` provided in the request parameters.
 * - Updates the `name` of the industry type with the value provided in the request body.
 * - Returns the updated industry type in the response if the update is successful.
 * - If no industry type is found with the provided `id`, it returns a 404 status code with an appropriate error message.
 * - Handles any errors that occur during the update process and returns an error message with a 500 status code.
 */
export const updateIndustryType = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const updatedIndustryType = await prisma.industryType.update({
      where: { id },
      data: { name },
    });
    return res.status(200).json(updatedIndustryType);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update industry type", error });
  }
};

/**
 * Deletes an industry type by its ID.
 * 
 * @param {Request} req - The request object containing the `id` parameter in the URL.
 * @param {Response} res - The response object to send a success message or an error message.
 * @returns {Promise<Response>} - A response indicating the success or failure of the deletion process.
 * 
 * - Retrieves the `id` of the industry type to be deleted from the request parameters.
 * - Deletes the industry type from the database using the provided `id`.
 * - If the deletion is successful, it returns a 204 status code indicating no content is returned.
 * - If an error occurs during the deletion process, a 500 status code with an error message is returned.
 */
export const deleteIndustryType = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.industryType.delete({
      where: { id },
    });
    return res.status(204).send(); // No content to send back
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete industry type", error });
  }
};
