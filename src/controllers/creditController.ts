// src/controllers/creditController.ts
import { Request, Response } from 'express';
import prisma from '../server';

// Create a new credit
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

// Get all credits for a template
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

// Update a credit
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

// Delete a credit
export async function deleteCredit(req: Request, res: Response) {
    const { id } = req.params;

    try {
        await prisma.credit.delete({ where: { id } });
        return res.status(200).json({ message: 'Credit deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to delete credit', error: error.message });
    }
}
