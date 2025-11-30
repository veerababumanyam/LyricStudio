import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const registerValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('phoneNumber')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),
    body('displayName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Display name must be between 2 and 50 characters')
];

export const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.type === 'field' ? err.path : 'unknown',
                message: err.msg
            }))
        });
    }

    next();
}
