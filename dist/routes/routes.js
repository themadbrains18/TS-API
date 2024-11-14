"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const multerMiddleware_1 = require("./../middlewares/multerMiddleware");
const express_1 = require("express");
const zodValidationMiddleware_1 = require("../middlewares/zodValidationMiddleware");
const user_dto_1 = require("../dto/user.dto");
const authController_1 = require("../controllers/authController");
const templateController_1 = require("../controllers/templateController");
const creditController_1 = require("../controllers/creditController");
// import { createTechnicalDetail, getTechnicalDetails, updateTechnicalDetail, deleteTechnicalDetail, } from '../controllers/technicalDetailController';
const authMiddleware_1 = require("../middlewares/authMiddleware");
const templateTypeController_1 = require("../controllers/templateTypeController");
const subCategoryController_1 = require("../controllers/subCategoryController");
const softwareTypeController_1 = require("../controllers/softwareTypeController");
const industryTypeController_1 = require("../controllers/industryTypeController");
const mediaController_1 = require("../controllers/mediaController");
/**
 * Initialize the router
 */
const router = (0, express_1.Router)();
/**
 * Authentication routes
 */
router.post('/register', (0, zodValidationMiddleware_1.validateData)(user_dto_1.userSignUpSchema), authController_1.register); // Register a new user with validation
router.post('/login', (0, zodValidationMiddleware_1.validateData)(user_dto_1.userLoginSchema), authController_1.login); // Log in an existing user with validation
router.post('/verify-otp', authController_1.verifyOtp); // Verify OTP for user authentication
router.post('/resend-otp', authController_1.resendOtp); // Resend OTP for user verification
router.post('/logout', authController_1.logout); // Log out the current user
router.post('/forget-password', authController_1.forgetPassword); // Handle forgot password request
router.post('/reset-password', authController_1.resetPasswordWithOtp); // Reset user password with OTP verification
router.get('/get-user', authMiddleware_1.authenticateToken, authController_1.checkUser); // Get current user details if authenticated
router.get('/get-user-downloads', authMiddleware_1.authenticateToken, authController_1.getUserDownloads); // Get the user's download history
router.put('/update-details', authMiddleware_1.authenticateToken, authController_1.updateUserDetails); // Update user details if authenticated
router.delete('/delete-account', authMiddleware_1.authenticateToken, authController_1.deleteUser); // Delete user account if authenticated
router.get('/free-download', authMiddleware_1.authenticateToken, authController_1.getFreeDownload); // Get free download for authenticated user
router.put('/user/update-image', authMiddleware_1.authenticateToken, multerMiddleware_1.uploadSingleImageFile, multerMiddleware_1.multerErrorHandler, authController_1.updateUserImage); // Update user profile image with authentication and file validation
router.delete('/user/remove-image', authMiddleware_1.authenticateToken, authController_1.removeUserImage); // Remove user profile image if authenticated
/**
 * Template routes
 */
router.post('/templates', authMiddleware_1.authenticateToken, multerMiddleware_1.uploadFiles, multerMiddleware_1.multerErrorHandler, templateController_1.createTemplate); // Create a new template (with file upload)
router.post('/templates/:id/download', templateController_1.templateDownloads); // record a download for a template
router.get('/templates', templateController_1.getTemplates); // Get all templates by pagination
router.get('/all-templates', templateController_1.getAllTemplates); // Get all templates by pagination
router.get('/feature-templates', templateController_1.featureTemplates); // Get Feature Templates take 6 
router.get('/templates/latest', templateController_1.getLatestTemplates); // Get Latest templates
router.get('/templates/popular', templateController_1.getPopularTemplates); // Get Popular templates
router.get('/dashboard/templates-by-userid', authMiddleware_1.authenticateToken, templateController_1.getAllTemplatesByUserId); // Get all templates by UserID
router.get('/templates-by-userid/:id', templateController_1.getAllTemplatesByUserId); // Get all templates by UserID
router.get('/templates-by-id/:id', templateController_1.getTemplateById); // Get a specific template by ID
router.get('/templates/search', templateController_1.getTemplateByTitle); // Get a specific template by ID
router.put('/templates/:id', multerMiddleware_1.uploadFiles, multerMiddleware_1.multerErrorHandler, authMiddleware_1.authenticateToken, templateController_1.updateTemplate); // Update a specific template by ID
router.delete('/templates/:id', authMiddleware_1.authenticateToken, templateController_1.deleteTemplate); // Delete a specific template by ID
/**
 * Template Type routes
 */
router.post('/template-types', authMiddleware_1.authenticateToken, templateTypeController_1.createTemplateType); // Create a new TemplateType
router.get('/template-types', templateTypeController_1.getTemplateTypes); // Get all TemplateTypes
router.get('/template-types/:id', templateTypeController_1.getTemplateTypeById); // Get TemplateType by ID
router.put('/template-types/:id', authMiddleware_1.authenticateToken, templateTypeController_1.updateTemplateType); // Update TemplateType by ID
router.delete('/template-types/:id', authMiddleware_1.authenticateToken, templateTypeController_1.deleteTemplateType); // Delete TemplateType by ID
/**
 * Sub Categories routes
 */
router.post('/sub-categories', authMiddleware_1.authenticateToken, subCategoryController_1.createSubCategory); // Create a subcategory
router.get('/sub-categories', subCategoryController_1.getSubCategories); // Get all subcategories
router.get('/sub-categories/:id', subCategoryController_1.getSubCategoryById); // Get a subcategory by Template ID
router.put('/sub-categories/:id', authMiddleware_1.authenticateToken, subCategoryController_1.updateSubCategory); // Update a subcategory
router.delete('/sub-categories/:id', authMiddleware_1.authenticateToken, subCategoryController_1.deleteSubCategory); // Delete a subcategory
/**
 * Software-types Route definitions
 */
router.post('/software-types', authMiddleware_1.authenticateToken, softwareTypeController_1.createSoftwareType); // Create a new software type
router.get('/software-types', softwareTypeController_1.getSoftwareTypes); // Get all software types
router.get('/software-types/:id', softwareTypeController_1.getSoftwareTypeById); // Get a software type by Template ID
router.put('/software-types/:id', authMiddleware_1.authenticateToken, softwareTypeController_1.updateSoftwareType); // Update a software type
router.delete('/software-types/:id', authMiddleware_1.authenticateToken, softwareTypeController_1.deleteSoftwareType); // Delete a software type
/**
 * Industry-type Routes definitions
 */
router.post('/industry-type', authMiddleware_1.authenticateToken, industryTypeController_1.createIndustryType); // Create a new industry type
router.get('/industry-type', industryTypeController_1.getIndustryTypes); // Get all industry types
router.get('/industry-type/:id', industryTypeController_1.getIndustryTypeById); // Get an industry type by ID
router.put('/industry-type/:id', authMiddleware_1.authenticateToken, industryTypeController_1.updateIndustryType); // Update an industry type
router.delete('/industry-type/:id', authMiddleware_1.authenticateToken, industryTypeController_1.deleteIndustryType); // Delete an industry type
/**
 * Credit routes
 */
router.post('/credits', authMiddleware_1.authenticateToken, creditController_1.createCredit); // Create a new credit entry
router.get('/credits/:templateId', authMiddleware_1.authenticateToken, creditController_1.getCredits); // Get credits for a specific template
router.put('/credits/:id', authMiddleware_1.authenticateToken, creditController_1.updateCredit); // Update a specific credit entry by ID
router.delete('/credits/:id', authMiddleware_1.authenticateToken, creditController_1.deleteCredit); // Delete a specific credit entry by ID
/**
 *
 * media routes
 */
router.delete('/sliderImages/:id', authMiddleware_1.authenticateToken, mediaController_1.deleteMediaSliderImage); // Create a new credit entry
router.delete('/previewImages/:id', authMiddleware_1.authenticateToken, mediaController_1.deleteMediaPreviewImage); // Create a new credit entry
router.delete('/previewMobileImages/:id', authMiddleware_1.authenticateToken, mediaController_1.deleteMediaPreviewMobileImage); // Create a new credit entry
// /**
//  * Technical Detail routes
//  */
// router.post('/technical-details', authenticateToken, createTechnicalDetail); // Create a new technical detail entry
// router.get('/technical-details/:templateId', authenticateToken, getTechnicalDetails); // Get technical details for a specific template
// router.put('/technical-details/:id', authenticateToken, updateTechnicalDetail); // Update a specific technical detail entry by ID
// router.delete('/technical-details/:id', authenticateToken, deleteTechnicalDetail); // Delete a specific technical detail entry by ID
exports.default = router;
