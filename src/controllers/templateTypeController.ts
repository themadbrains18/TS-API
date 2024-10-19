// src/controllers/templateTypeController.ts
import { Request, Response } from 'express';
import prisma from '../server';

// Create a new TemplateType
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

// Get all TemplateTypes
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

// Get TemplateType by ID
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

// Update TemplateType by ID
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

// Delete TemplateType by ID
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
