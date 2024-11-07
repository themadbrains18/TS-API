import { Request, Response } from 'express';
import prisma from '../server';

/**
 * Creates a new credit entry for a given template.
 * 
 * @param {Request} req - The request object containing the credit data (fonts, images, icons, illustrations) and template ID.
 * @param {Response} res - The response object to send back the result of the credit creation process.
 * @returns {Promise<Response>} - A response containing a success message and the created credit, or an error message.
 * 
 * - Validates that a template ID is provided in the request body.
 * - Creates a new credit entry in the database with the specified fonts, images, icons, illustrations, and template ID.
 * - Sends a success message along with the created credit if successful.
 * - Handles any errors that occur during the credit creation and returns an appropriate error message.
 */
export async function createCredit(req: Request, res: Response) {
    const { fonts, images, icons, illustrations, templateId } = req.body;

    if (!templateId) {
        return res.status(400).json({ message: 'Template ID is required' });
    }

    try {
        const newCredit = await prisma.credit.create({
            data: {
                fonts,
                images,
                icons,
                illustrations,
                templateId,
            },
        });
        return res.status(201).json({ message: 'Credit created successfully', credit: newCredit });
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to create credit', error: error.message });
    }
}




/**
 * Fetches all credits associated with a specific template.
 * 
 * @param {Request} req - The request object containing the template ID in the URL parameters.
 * @param {Response} res - The response object to send back the list of credits or an error message.
 * @returns {Promise<Response>} - A response containing the list of credits or an error message.
 * 
 * - Extracts the template ID from the request parameters.
 * - Retrieves all credit entries associated with the provided template ID from the database.
 * - Sends a success response with the list of credits if found.
 * - Handles any errors that occur during the fetching process and returns an error message.
 */
export async function getCredits(req: Request, res: Response) {
    const { templateId } = req.params;

    try {
        const credits = await prisma.credit.findMany({
            where: { templateId },
        });
        return res.status(200).json(credits);
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to fetch credits', error: error.message });
    }
}




/**
 * Updates an existing credit associated with a specific ID.
 * 
 * @param {Request} req - The request object containing the credit ID in the URL parameters and updated data in the request body.
 * @param {Response} res - The response object to send back the updated credit or an error message.
 * @returns {Promise<Response>} - A response containing the updated credit or an error message.
 * 
 * - Extracts the credit ID from the request parameters and the updated fields from the request body.
 * - Updates the specified credit entry in the database with the new values.
 * - Sends a success response with the updated credit if the operation is successful.
 * - Handles any errors that occur during the update process and returns an error message.
 */
export async function updateCredit(req: Request, res: Response) {
    const { id } = req.params;
    const { fonts, images, icons, illustrations } = req.body;

    try {
        const updatedCredit = await prisma.credit.update({
            where: { id },
            data: {
                fonts,
                images,
                icons,
                illustrations,
            },
        });
        return res.status(200).json({ message: 'Credit updated successfully', credit: updatedCredit });
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to update credit', error: error.message });
    }
}



/**
 * Deletes a credit associated with a specific ID.
 * 
 * @param {Request} req - The request object containing the credit ID in the URL parameters.
 * @param {Response} res - The response object to send back the success message or an error message.
 * @returns {Promise<Response>} - A response containing a success message or an error message.
 * 
 * - Extracts the credit ID from the request parameters.
 * - Deletes the credit entry from the database using the provided ID.
 * - Sends a success response when the credit is deleted successfully.
 * - Handles any errors that occur during the deletion process and returns an error message.
 */
export async function deleteCredit(req: Request, res: Response) {
    const { id } = req.params;

    try {
        await prisma.credit.delete({ where: { id } });
        return res.status(200).json({ message: 'Credit deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to delete credit', error: error.message });
    }
}
