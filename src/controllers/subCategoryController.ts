// src/controllers/subCategoryController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new subcategory
export const createSubCategory = async (req: Request, res: Response) => {
  const { name, templateTypeId } = req.body;

  try {
    const newSubCategory = await prisma.subCategory.create({
      data: {
        name,
        templateTypeId,
      },
    });
    return res.status(201).json(newSubCategory);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create subcategory", error });
  }
};

// Get all subcategories
export const getSubCategories = async (req: Request, res: Response) => {
  try {
    const subCategories = await prisma.subCategory.findMany();
    return res.status(200).json(subCategories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to retrieve subcategories", error });
  }
};

// Get a subcategory by Template ID
export const getSubCategoryById = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to retrieve subcategory", error });
  }
};

// Update a subcategory
export const updateSubCategory = async (req: Request, res: Response) => {
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
    return res.status(200).json(updatedSubCategory);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update subcategory", error });
  }
};

// Delete a subcategory
export const deleteSubCategory = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.subCategory.delete({
      where: { id },
    });
    return res.status(204).send(); // No content to send back
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete subcategory", error });
  }
};
