import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const deleteMediaSliderImage = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.sliderImage.delete({
            where: { id },
        });
        return res.status(204).send(); // No content to send back
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete sliderImage", error });
    }
};

export const deleteMediaPreviewImage = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.previewImage.delete({
            where: { id },
        });
        return res.status(204).send(); // No content to send back
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete PreviewImage ", error });
    }
};

export const deleteMediaPreviewMobileImage = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.previewMobileImage.delete({
            where: {id },
        });
        return res.status(204).send(); // No content to send back
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete PreviewMobileImage", error });
    }
};
export const deleteAllMediaSliderImage = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.sliderImage.deleteMany({
            where: { templateId:id },
        });
        return res.status(204).send(); // No content to send back
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete sliderImage", error });
    }
};

export const deleteAllMediaPreviewImage = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.previewImage.deleteMany({
            where: {templateId: id },
        });
        return res.status(204).send(); // No content to send back
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete PreviewImage ", error });
    }
};

export const deleteAllMediaPreviewMobileImage = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.previewMobileImage.deleteMany({
            where: {templateId:  id },
        });
        return res.status(204).send(); // No content to send back
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete PreviewMobileImage", error });
    }
};