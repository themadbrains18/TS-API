"use strict";
// import { Request, Response } from 'express';
// import prisma from '../server';
// /**
//  * Creates a new technical detail.
//  * 
//  * @param {Request} req - The request object containing the technical detail data in the body.
//  * @param {Response} res - The response object to return a success message or an error message.
//  * @returns {Promise<Response>} - A response indicating the success or failure of the technical detail creation.
//  * 
//  * - This function creates a new technical detail in the database using Prisma's `create` method, where the technical name and template ID are passed in the request body.
//  * - If the `templateId` is not provided in the request body, a `400 Bad Request` status is returned with a message indicating that the `templateId` is required.
//  * - If the creation is successful, a `201 Created` status is returned along with the newly created technical detail.
//  * - If an error occurs during the creation process, a `500 Internal Server Error` status is returned with an error message.
//  */
// export async function createTechnicalDetail(req: Request, res: Response) {
//   const { techName, templateId } = req.body;
//   if (!templateId) {
//     return res.status(400).json({ message: 'Template ID is required' });
//   }
//   try {
//     const newDetail = await prisma.technicalDetail.create({
//       data: {
//         techName,
//         templateId,
//       },
//     });
//     return res.status(201).json({ message: 'Technical Detail created successfully', detail: newDetail });
//   } catch (error:any) {
//     return res.status(500).json({ message: 'Failed to create technical detail', error: error.message });
//   }
// }
// /**
//  * Fetches all technical details for a specific template.
//  * 
//  * @param {Request} req - The request object containing the `templateId` in the request parameters.
//  * @param {Response} res - The response object to return the fetched technical details or an error message.
//  * @returns {Promise<Response>} - A response containing either the fetched technical details or an error message.
//  * 
//  * - This function retrieves all technical details associated with a specific `templateId` from the database using Prisma's `findMany` method.
//  * - The `templateId` is extracted from the request parameters.
//  * - If technical details are found, they are returned with a `200 OK` status and the details in the response body.
//  * - If an error occurs during the fetch process, a `500 Internal Server Error` status is returned with an error message.
//  */
// export async function getTechnicalDetails(req: Request, res: Response) {
//   const { templateId } = req.params;
//   try {
//     const details = await prisma.technicalDetail.findMany({
//       where: { templateId },
//     });
//     return res.status(200).json(details);
//   } catch (error:any) {
//     return res.status(500).json({ message: 'Failed to fetch technical details', error: error.message });
//   }
// }
// /**
//  * Updates an existing technical detail for a given ID.
//  * 
//  * @param {Request} req - The request object containing the `id` in the request parameters and the updated `techName` in the request body.
//  * @param {Response} res - The response object to return the updated technical detail or an error message.
//  * @returns {Promise<Response>} - A response containing either the updated technical detail or an error message.
//  * 
//  * - This function updates an existing technical detail in the database for the provided `id` using Prisma's `update` method.
//  * - The `id` is extracted from the request parameters, and the `techName` to be updated is taken from the request body.
//  * - If the update is successful, the updated detail is returned with a `200 OK` status and the updated detail in the response body.
//  * - If an error occurs during the update process, a `500 Internal Server Error` status is returned with an error message.
//  */
// export async function updateTechnicalDetail(req: Request, res: Response) {
//   const { id } = req.params;
//   const { techName } = req.body;
//   try {
//     const updatedDetail = await prisma.technicalDetail.update({
//       where: { id },
//       data: { techName },
//     });
//     return res.status(200).json({ message: 'Technical Detail updated successfully', detail: updatedDetail });
//   } catch (error: any) {
//     return res.status(500).json({ message: 'Failed to update technical detail', error: error.message });
//   }
// }
// /**
//  * Deletes a technical detail by its ID.
//  * 
//  * @param {Request} req - The request object containing the `id` of the technical detail to be deleted in the request parameters.
//  * @param {Response} res - The response object to return a success message or an error message.
//  * @returns {Promise<Response>} - A response containing either a success message or an error message.
//  * 
//  * - This function deletes an existing technical detail from the database using Prisma's `delete` method.
//  * - The `id` is extracted from the request parameters (`req.params`), which represents the technical detail to be deleted.
//  * - If the deletion is successful, a `200 OK` status is returned with a success message.
//  * - If an error occurs during the deletion process (e.g., the technical detail doesn't exist or database issues), a `500 Internal Server Error` status is returned with an error message.
//  */
// export async function deleteTechnicalDetail(req: Request, res: Response) {
//   const { id } = req.params;
//   try {
//     await prisma.technicalDetail.delete({ where: { id } });
//     return res.status(200).json({ message: 'Technical Detail deleted successfully' });
//   } catch (error:any) {
//     return res.status(500).json({ message: 'Failed to delete technical detail', error: error.message });
//   }
// }
