"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMediaPreviewMobileImage = exports.deleteMediaPreviewImage = exports.deleteMediaSliderImage = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const deleteMediaSliderImage = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.sliderImage.delete({
            where: { id },
        });
        return res.status(204).send(); // No content to send back
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete sliderImage", error });
    }
};
exports.deleteMediaSliderImage = deleteMediaSliderImage;
const deleteMediaPreviewImage = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.previewImage.delete({
            where: { id },
        });
        return res.status(204).send(); // No content to send back
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete PreviewImage ", error });
    }
};
exports.deleteMediaPreviewImage = deleteMediaPreviewImage;
const deleteMediaPreviewMobileImage = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.previewMobileImage.delete({
            where: { id },
        });
        return res.status(204).send(); // No content to send back
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete PreviewMobileImage", error });
    }
};
exports.deleteMediaPreviewMobileImage = deleteMediaPreviewMobileImage;
