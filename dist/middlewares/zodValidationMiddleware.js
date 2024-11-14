"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateData = validateData;
const zod_1 = require("zod");
const http_status_codes_1 = require("http-status-codes");
/**
 * Middleware to Validate Request Body Data Using a Zod Schema.
 *
 * This middleware validates the incoming request body using the provided Zod schema. It ensures that the data
 * conforms to the expected format before passing the request to the next middleware or route handler.
 *
 * - If the validation is successful, the middleware passes control to the next handler using `next()`.
 * - If the validation fails, it catches the error and formats the error messages based on the validation issues:
 *   - For each validation error, it constructs an error message indicating which field is invalid and why.
 *   - If the error is an instance of `ZodError`, a `400` Bad Request response is sent to the client with a detailed message of all the validation issues.
 *   - If the error is not related to Zod validation, it returns a `500` Internal Server Error response.
 * @param schema - The Zod schema used to validate the request body.
 * @returns Middleware function that validates the data.
 */
function validateData(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errorMessages = error.errors.map((issue) => ({
                    message: `${issue.path.join('.')} is ${issue.message}`,
                }));
                let message = '';
                if (typeof errorMessages === "object") {
                    message = '';
                    for (let msg of errorMessages)
                        message += msg.message + ' ';
                }
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: 'Invalid data', message: message ? message : errorMessages });
            }
            else {
                res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
            }
        }
    };
}
