// src/controllers/industryTypeController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new industry type
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

// Get all industry types
export const getIndustryTypes = async (req: Request, res: Response) => {
  try {
    const industryTypes = await prisma.industryType.findMany();
    return res.status(200).json(industryTypes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to retrieve industry types", error });
  }
};

// Get an industry type by ID
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

// Update an industry type
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

// Delete an industry type
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
