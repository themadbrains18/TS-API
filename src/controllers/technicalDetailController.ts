// src/controllers/technicalDetailController.ts
import { Request, Response } from 'express';
import prisma from '../server';

// Create a new technical detail
export async function createTechnicalDetail(req: Request, res: Response) {
  const { techName, templateId } = req.body;

  if (!templateId) {
    return res.status(400).json({ message: 'Template ID is required' });
  }

  try {
    const newDetail = await prisma.technicalDetail.create({
      data: {
        techName,
        templateId,
      },
    });
    return res.status(201).json({ message: 'Technical Detail created successfully', detail: newDetail });
  } catch (error:any) {
    return res.status(500).json({ message: 'Failed to create technical detail', error: error.message });
  }
}

// Get all technical details for a template
export async function getTechnicalDetails(req: Request, res: Response) {
  const { templateId } = req.params;

  try {
    const details = await prisma.technicalDetail.findMany({
      where: { templateId },
    });
    return res.status(200).json(details);
  } catch (error:any) {
    return res.status(500).json({ message: 'Failed to fetch technical details', error: error.message });
  }
}

// Update a technical detail
export async function updateTechnicalDetail(req: Request, res: Response) {
  const { id } = req.params;
  const { techName } = req.body;

  try {
    const updatedDetail = await prisma.technicalDetail.update({
      where: { id },
      data: { techName },
    });
    return res.status(200).json({ message: 'Technical Detail updated successfully', detail: updatedDetail });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to update technical detail', error: error.message });
  }
}

// Delete a technical detail
export async function deleteTechnicalDetail(req: Request, res: Response) {
  const { id } = req.params;

  try {
    await prisma.technicalDetail.delete({ where: { id } });
    return res.status(200).json({ message: 'Technical Detail deleted successfully' });
  } catch (error:any) {
    return res.status(500).json({ message: 'Failed to delete technical detail', error: error.message });
  }
}
