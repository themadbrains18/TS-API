import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Creates a new software type.
 * 
 * @param {Request} req - The request object containing `name` and `templateTypeId` in the body.
 * @param {Response} res - The response object to send the newly created software type or an error message.
 * @returns {Promise<Response>} - A response indicating the success or failure of the software type creation.
 * 
 * - Retrieves the `name` and `templateTypeId` from the request body.
 * - Creates a new software type in the database with the provided `name` and `templateTypeId`.
 * - If the creation is successful, it returns the newly created software type with a 201 status code.
 * - If an error occurs during the creation process, a 500 status code with an error message is returned.
 */
export const createSoftwareType = async (req: Request, res: Response) => {
  const { name, templateTypeId } = req.body;

  try {
    const newSoftwareType = await prisma.softwareType.create({
      data: {
        name,
        templateTypeId,
      },
    });
    return res.status(201).json(newSoftwareType);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create software type", error });
  }
};



/**
 * Retrieves all software types.
 * 
 * @param {Request} req - The request object (no body or parameters needed for this endpoint).
 * @param {Response} res - The response object to send the list of software types or an error message.
 * @returns {Promise<Response>} - A response containing the list of all software types or an error message.
 * 
 * - Fetches all software types from the database.
 * - If the operation is successful, it returns the list of software types with a 200 status code.
 * - If an error occurs during the retrieval process, a 500 status code with an error message is returned.
 */
export const getSoftwareTypes = async (req: Request, res: Response) => {
  try {
    const softwareTypes = await prisma.softwareType.findMany();
    return res.status(200).json({results:softwareTypes});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to retrieve software types", error });
  }
};




/**
 * Retrieves software types by template type ID.
 * 
 * @param {Request} req - The request object, containing the `id` parameter in the URL.
 * @param {Response} res - The response object to send the software types or an error message.
 * @returns {Promise<Response>} - A response containing the software types matching the provided ID or an error message.
 * 
 * - The `id` from the URL parameters is used to fetch software types by the associated `templateTypeId`.
 * - If no software type is found with the given `id`, a 404 status code with a "Software type not found" message is returned.
 * - If an error occurs during the retrieval process, a 500 status code with an error message is returned.
 */
export const getSoftwareTypeById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const softwareType = await prisma.softwareType.findMany({
      where: { templateTypeId: id },
    });

    if (!softwareType) {
      return res.status(404).json({ message: "Software type not found" });
    }

    return res.status(200).json(softwareType);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to retrieve software type", error });
  }
};




/**
 * Updates a software type by its ID.
 * 
 * @param {Request} req - The request object, containing the `id` parameter in the URL and the updated `name` and `templateTypeId` in the request body.
 * @param {Response} res - The response object to send the updated software type or an error message.
 * @returns {Promise<Response>} - A response containing the updated software type or an error message.
 * 
 * - The `id` from the URL parameters is used to find and update the corresponding software type.
 * - The `name` and `templateTypeId` are the new values provided in the request body.
 * - If the software type with the provided `id` is successfully updated, the updated software type is returned.
 * - If an error occurs during the update process, a 500 status code with an error message is returned.
 */
export const updateSoftwareType = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, templateTypeId } = req.body;

  try {
    const updatedSoftwareType = await prisma.softwareType.update({
      where: { id },
      data: {
        name,
        templateTypeId,
      },
    });
    return res.status(200).json(updatedSoftwareType);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update software type", error });
  }
};



/**
 * Deletes a software type by its ID.
 * 
 * @param {Request} req - The request object, containing the `id` parameter in the URL.
 * @param {Response} res - The response object to confirm the deletion or return an error message.
 * @returns {Promise<Response>} - A response confirming successful deletion or an error message.
 * 
 * - The `id` from the URL parameters is used to find and delete the corresponding software type.
 * - If the software type is successfully deleted, a 204 status code is returned, indicating that the resource was deleted and no content is returned.
 * - If an error occurs during the deletion process, a 500 status code with an error message is returned.
 */
export const deleteSoftwareType = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.softwareType.delete({
      where: { id },
    });
    return res.status(204).send(); // No content to send back
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete software type", error });
  }
};
