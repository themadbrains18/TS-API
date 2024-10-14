import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';

// VALIDATION CHECK FOR ALL APIS BODY
export function validateData(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue: any) => ({
          message: `${issue.path.join('.')} is ${issue.message}`,
        }))

        let message : any  = ''
        if(typeof errorMessages === "object"){
          message = '';
          for (let msg of errorMessages)
            message += msg.message+ ' '
        }
        res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid data', message: message ? message :errorMessages  });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
      }
    }
  };
}
