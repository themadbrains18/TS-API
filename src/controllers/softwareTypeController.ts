// src/controllers/softwareTypeController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new software type
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

// Get all software types
export const getSoftwareTypes = async (req: Request, res: Response) => {
  try {
    const softwareTypes = await prisma.softwareType.findMany();
    return res.status(200).json(softwareTypes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to retrieve software types", error });
  }
};

// Get a software type by ID
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

// Update a software type
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

// Delete a software type
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
