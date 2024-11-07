import { multerErrorHandler, uploadFiles, uploadSingleImageFile } from './../middlewares/multerMiddleware';
import { Router } from 'express';
import { validateData } from '../middlewares/zodValidationMiddleware';
import { userLoginSchema, userSignUpSchema } from '../dto/user.dto';

import { register, login, logout, forgetPassword, resetPasswordWithOtp, verifyOtp, resendOtp, checkUser, updateUserDetails, updateUserImage, getUserDownloads, removeUserImage, deleteUser, getFreeDownload } from '../controllers/authController';
import { createTemplate, getTemplates, getTemplateById, updateTemplate, deleteTemplate, getAllTemplatesByUserId, getLatestTemplates, getPopularTemplates, templateDownloads, getAllTemplates, featureTemplates, getTemplateByTitle, } from '../controllers/templateController';
import { createCredit, getCredits, updateCredit, deleteCredit, } from '../controllers/creditController';
// import { createTechnicalDetail, getTechnicalDetails, updateTechnicalDetail, deleteTechnicalDetail, } from '../controllers/technicalDetailController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { createTemplateType, getTemplateTypes, getTemplateTypeById, updateTemplateType, deleteTemplateType, } from '../controllers/templateTypeController';
import { createSubCategory, getSubCategories, getSubCategoryById, updateSubCategory, deleteSubCategory, } from '../controllers/subCategoryController';
import { createSoftwareType, getSoftwareTypes, getSoftwareTypeById, updateSoftwareType, deleteSoftwareType, } from '../controllers/softwareTypeController';
import { createIndustryType, getIndustryTypes, getIndustryTypeById, updateIndustryType, deleteIndustryType, } from '../controllers/industryTypeController';
import { createTemplateSchema, deleteTemplateSchema, getAllTemplatesByUserIdSchema, getTemplateByIdSchema, updateTemplateSchema } from '../dto/template.dto';

/**
 * Initialize the router
 */
const router = Router();

/**
 * Authentication routes
 */
router.post('/register', validateData(userSignUpSchema), register); // Register a new user with validation
router.post('/login', validateData(userLoginSchema), login); // Log in an existing user with validation
router.post('/verify-otp', verifyOtp); // Verify OTP for user authentication
router.post('/resend-otp', resendOtp); // Resend OTP for user verification
router.post('/logout', logout); // Log out the current user
router.post('/forget-password', forgetPassword); // Handle forgot password request
router.post('/reset-password', resetPasswordWithOtp); // Reset user password with OTP verification
router.get('/get-user', authenticateToken, checkUser); // Get current user details if authenticated
router.get('/get-user-downloads', authenticateToken, getUserDownloads); // Get the user's download history
router.put('/update-details', authenticateToken, updateUserDetails); // Update user details if authenticated
router.delete('/delete-account', authenticateToken, deleteUser); // Delete user account if authenticated
router.get('/free-download', authenticateToken, getFreeDownload); // Get free download for authenticated user


router.put('/user/update-image', authenticateToken, uploadSingleImageFile, multerErrorHandler, updateUserImage); // Update user profile image with authentication and file validation
router.delete('/user/remove-image', authenticateToken, removeUserImage); // Remove user profile image if authenticated

/**
 * Template routes
 */
router.post('/templates', authenticateToken, uploadFiles, multerErrorHandler, createTemplate); // Create a new template (with file upload)
router.post('/templates/:id/download', templateDownloads); // record a download for a template
router.get('/templates', getTemplates); // Get all templates by pagination
router.get('/all-templates', getAllTemplates); // Get all templates by pagination
router.get('/feature-templates', featureTemplates); // Get Feature Templates take 6 
router.get('/templates/latest', getLatestTemplates); // Get Latest templates
router.get('/templates/popular', getPopularTemplates); // Get Popular templates
router.get('/dashboard/templates-by-userid', authenticateToken, getAllTemplatesByUserId); // Get all templates by UserID
router.get('/templates-by-userid/:id', getAllTemplatesByUserId); // Get all templates by UserID
router.get('/templates-by-id/:id', getTemplateById); // Get a specific template by ID
router.get('/templates/search', getTemplateByTitle); // Get a specific template by ID
router.put('/templates/:id', uploadFiles, multerErrorHandler, authenticateToken, updateTemplate); // Update a specific template by ID
router.delete('/templates/:id',  authenticateToken, deleteTemplate); // Delete a specific template by ID

/**
 * Template Type routes
 */
router.post('/template-types', authenticateToken, createTemplateType); // Create a new TemplateType
router.get('/template-types', getTemplateTypes); // Get all TemplateTypes
router.get('/template-types/:id', getTemplateTypeById); // Get TemplateType by ID
router.put('/template-types/:id', authenticateToken, updateTemplateType); // Update TemplateType by ID
router.delete('/template-types/:id', authenticateToken, deleteTemplateType); // Delete TemplateType by ID

/**
 * Sub Categories routes
 */
router.post('/sub-categories', authenticateToken, createSubCategory); // Create a subcategory
router.get('/sub-categories', getSubCategories); // Get all subcategories
router.get('/sub-categories/:id', getSubCategoryById); // Get a subcategory by Template ID
router.put('/sub-categories/:id', authenticateToken, updateSubCategory); // Update a subcategory
router.delete('/sub-categories/:id', authenticateToken, deleteSubCategory); // Delete a subcategory

/**
 * Software-types Route definitions
 */
router.post('/software-types', authenticateToken, createSoftwareType); // Create a new software type
router.get('/software-types', getSoftwareTypes); // Get all software types
router.get('/software-types/:id', getSoftwareTypeById); // Get a software type by Template ID
router.put('/software-types/:id', authenticateToken, updateSoftwareType); // Update a software type
router.delete('/software-types/:id', authenticateToken, deleteSoftwareType); // Delete a software type

/**
 * Industry-type Routes definitions
 */
router.post('/industry-type', authenticateToken, createIndustryType); // Create a new industry type
router.get('/industry-type', getIndustryTypes); // Get all industry types
router.get('/industry-type/:id', getIndustryTypeById); // Get an industry type by ID
router.put('/industry-type/:id', authenticateToken, updateIndustryType); // Update an industry type
router.delete('/industry-type/:id', authenticateToken, deleteIndustryType); // Delete an industry type

/**
 * Credit routes
 */
router.post('/credits', authenticateToken, createCredit); // Create a new credit entry
router.get('/credits/:templateId', authenticateToken, getCredits); // Get credits for a specific template
router.put('/credits/:id', authenticateToken, updateCredit); // Update a specific credit entry by ID
router.delete('/credits/:id', authenticateToken, deleteCredit); // Delete a specific credit entry by ID

// /**
//  * Technical Detail routes
//  */
// router.post('/technical-details', authenticateToken, createTechnicalDetail); // Create a new technical detail entry
// router.get('/technical-details/:templateId', authenticateToken, getTechnicalDetails); // Get technical details for a specific template
// router.put('/technical-details/:id', authenticateToken, updateTechnicalDetail); // Update a specific technical detail entry by ID
// router.delete('/technical-details/:id', authenticateToken, deleteTechnicalDetail); // Delete a specific technical detail entry by ID

export default router;
