// src/controllers/templateTypeController.ts
import { Request, Response } from 'express';
import prisma from '../server';

/**
 * Creates a new TemplateType.
 * 
 * @param {Request} req - The request object containing `name` in the body.
 * @param {Response} res - The response object to send the newly created template type or an error message.
 * @returns {Promise<Response>} - A response indicating the success or failure of the template type creation.
 * 
 * - Retrieves the `name` from the request body.
 * - Creates a new template type in the database with the provided `name`.
 * - If the creation is successful, it returns the newly created template type with a 201 status code.
 * - If an error occurs during the creation process, a 500 status code with an error message is returned.
 */
  export const createTemplateType = async (req: Request, res: Response) => {
    const { name } = req.body;
    try {
      const newTemplateType = await prisma.templateType.create({
        data: { name },
      });
      return res.status(201).json(newTemplateType);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to create TemplateType', error });
    }
  };



/**
 * Retrieves all TemplateTypes along with their associated subCategories and templates.
 * 
 * @param {Request} req - The request object (not used in this function).
 * @param {Response} res - The response object to send the retrieved template types or an error message.
 * @returns {Promise<Response>} - A response containing the list of template types or an error message.
 * 
 * - Fetches all template types from the database using `prisma.templateType.findMany`.
 * - Includes associated `subCategories` and a selection of `id` and `title` from related `templates`.
 * - If the operation is successful, it returns the template types in a 200 response.
 * - If an error occurs, it returns a 500 response with an error message.
 */
export const getTemplateTypes = async (req: Request, res: Response) => {
  try {
    const templateTypes = await prisma.templateType.findMany({
      include: {
        subCategories: true, 
        templates: {
          select: {
            id: true,  
            title: true 
          }
        }
      },
    });
    
    return res.status(200).json({results:templateTypes});
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve TemplateTypes', error });
  }
};


/**
 * Retrieves a TemplateType by its ID.
 * 
 * @param {Request} req - The request object containing the `id` of the template type in the URL parameters.
 * @param {Response} res - The response object to send the retrieved template type or an error message.
 * @returns {Promise<Response>} - A response containing the template type or an error message.
 * 
 * - Extracts the `id` parameter from the request.
 * - Fetches the template type from the database using `prisma.templateType.findUnique`.
 * - If the template type is found, it returns the template type data with a 200 status code.
 * - If the template type is not found, it returns a 404 response with a message indicating it's not found.
 * - If an error occurs during the process, it returns a 500 response with an error message.
 */
export const getTemplateTypeById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const templateType = await prisma.templateType.findUnique({
      where: { id },
    });
    if (!templateType) {
      return res.status(404).json({ message: 'TemplateType not found' });
    }
    return res.status(200).json(templateType);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve TemplateType', error });
  }
};



/**
 * Updates a TemplateType by its ID.
 * 
 * @param {Request} req - The request object containing the `id` of the template type in the URL parameters and the new `name` in the request body.
 * @param {Response} res - The response object to send the updated template type or an error message.
 * @returns {Promise<Response>} - A response indicating the success or failure of the template type update.
 * 
 * - Extracts the `id` from the request parameters and the `name` from the request body.
 * - Attempts to update the template type with the new `name` using `prisma.templateType.update`.
 * - If the update is successful, it returns the updated template type with a 200 status code.
 * - If an error occurs during the update process, it returns a 500 response with an error message.
 */
export const updateTemplateType = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const updatedTemplateType = await prisma.templateType.update({
      where: { id },
      data: { name },
    });
    return res.status(200).json(updatedTemplateType);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update TemplateType', error });
  }
};



/**
 * Deletes a TemplateType by its ID.
 * 
 * @param {Request} req - The request object containing the `id` of the template type in the URL parameters.
 * @param {Response} res - The response object to send the success or error message.
 * @returns {Promise<Response>} - A response indicating the success or failure of the template type deletion.
 * 
 * - Extracts the `id` from the request parameters.
 * - Attempts to delete the template type with the specified `id` using `prisma.templateType.delete`.
 * - If the deletion is successful, it returns a 204 status code, indicating that the resource was deleted, with no content to return.
 * - If an error occurs during the deletion process, it returns a 500 response with an error message.
 */

export const deleteTemplateType = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.templateType.delete({
      where: { id },
    });
    return res.status(204).send(); // No content to return
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete TemplateType', error });
  }
};
