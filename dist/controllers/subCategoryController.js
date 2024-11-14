"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubCategory = exports.updateSubCategory = exports.getSubCategoryById = exports.getSubCategories = exports.createSubCategory = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Creates a new subcategory.
 *
 * @param {Request} req - The request object, containing the `name` and `templateTypeId` in the body.
 * @param {Response} res - The response object to return the created subcategory or an error message.
 * @returns {Promise<Response>} - A response containing the created subcategory or an error message.
 *
 * - The `name` and `templateTypeId` are extracted from the request body to create a new subcategory.
 * - If the subcategory is successfully created, a 201 status code is returned with the newly created subcategory.
 * - If an error occurs during the creation process, a 500 status code is returned with an error message.
 */
const createSubCategory = async (req, res) => {
    const { name, templateTypeId } = req.body;
    try {
        const newSubCategory = await prisma.subCategory.create({
            data: {
                name,
                templateTypeId,
            },
        });
        return res.status(201).json({ results: newSubCategory });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to create subcategory", error });
    }
};
exports.createSubCategory = createSubCategory;
/**
 * Retrieves all subcategories.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object to return the list of subcategories or an error message.
 * @returns {Promise<Response>} - A response containing a list of subcategories or an error message.
 *
 * - This function fetches all subcategories from the database using Prisma's `findMany` method.
 * - If subcategories are found, a `200 OK` status is returned with the list of subcategories.
 * - If an error occurs during the fetch process, a `500 Internal Server Error` status is returned with an error message.
 */
const getSubCategories = async (req, res) => {
    try {
        const subCategories = await prisma.subCategory.findMany();
        return res.status(200).json({ results: subCategories });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to retrieve subcategories", error });
    }
};
exports.getSubCategories = getSubCategories;
/**
 * Retrieves subcategories and software categories by template type ID.
 *
 * @param {Request} req - The request object containing the template type ID in the URL parameters.
 * @param {Response} res - The response object to return the subcategories and software categories, or an error message.
 * @returns {Promise<Response>} - A response containing subcategories, software categories, or an error message.
 *
 * - This function fetches subcategories and software categories from the database using Prisma's `findMany` method, filtered by the `templateTypeId` from the request parameters.
 * - If neither subcategories nor software categories are found, a `404 Not Found` status is returned with a message indicating that no categories were found.
 * - If subcategories or software categories are found, a `200 OK` status is returned with the list of both subcategories and software categories.
 * - If an error occurs during the fetch process, a `500 Internal Server Error` status is returned with an error message.
 */
const getSubCategoryById = async (req, res) => {
    const { id } = req.params;
    try {
        const subCategories = await prisma.subCategory.findMany({
            where: { templateTypeId: id },
        });
        const softwareCategories = await prisma.softwareType.findMany({
            where: { templateTypeId: id },
        });
        // If no subcategories or software categories are found
        if (!subCategories.length && !softwareCategories.length) {
            return res.status(404).json({ message: 'Categories not found' });
        }
        return res.status(200).json({
            results: {
                subCategories,
                softwareCategories
            }
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to retrieve subcategory", error });
    }
};
exports.getSubCategoryById = getSubCategoryById;
/**
 * Updates an existing subcategory by its ID.
 *
 * @param {Request} req - The request object containing the subcategory ID in the URL parameters and the updated data in the body.
 * @param {Response} res - The response object to return the updated subcategory or an error message.
 * @returns {Promise<Response>} - A response containing the updated subcategory or an error message.
 *
 * - This function updates an existing subcategory using Prisma's `update` method, where the subcategory is identified by the `id` from the URL parameters.
 * - The updated data (name and templateTypeId) is passed in the request body.
 * - If the subcategory is successfully updated, a `200 OK` status is returned with the updated subcategory in the response body.
 * - If an error occurs during the update process, a `500 Internal Server Error` status is returned with an error message.
 */
const updateSubCategory = async (req, res) => {
    const { id } = req.params;
    const { name, templateTypeId } = req.body;
    try {
        const updatedSubCategory = await prisma.subCategory.update({
            where: { id },
            data: {
                name,
                templateTypeId,
            },
        });
        return res.status(200).json({ results: updatedSubCategory });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to update subcategory", error });
    }
};
exports.updateSubCategory = updateSubCategory;
/**
 * Deletes an existing subcategory by its ID.
 *
 * @param {Request} req - The request object containing the subcategory ID in the URL parameters.
 * @param {Response} res - The response object to return a success message or an error message.
 * @returns {Promise<Response>} - A response indicating the success or failure of the deletion.
 *
 * - This function deletes a subcategory using Prisma's `delete` method, where the subcategory is identified by the `id` from the URL parameters.
 * - If the deletion is successful, a `204 No Content` status is returned, indicating that the resource was successfully deleted.
 * - If an error occurs during the deletion process, a `500 Internal Server Error` status is returned with an error message.
 */
const deleteSubCategory = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.subCategory.delete({
            where: { id },
        });
        return res.status(204).send(); // No content to send back
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete subcategory", error });
    }
};
exports.deleteSubCategory = deleteSubCategory;
