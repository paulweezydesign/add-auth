/**
 * Validation Middleware
 * Implements comprehensive input validation using Joi for request validation
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

/**
 * Validation target types
 */
export type ValidationTarget = 'body' | 'query' | 'params' | 'headers';

/**
 * Validation options
 */
export interface ValidationOptions {
  abortEarly?: boolean;
  allowUnknown?: boolean;
  stripUnknown?: boolean;
  target?: ValidationTarget;
  customMessages?: { [key: string]: string };
}

/**
 * Common validation schemas
 */
export const validationSchemas = {
  // User registration schema
  userRegistration: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username must only contain alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required'
      }),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required'
      }),
    firstName: Joi.string()
      .min(1)
      .max(50)
      .pattern(new RegExp('^[a-zA-Z\\s]+$'))
      .optional()
      .messages({
        'string.min': 'First name must be at least 1 character long',
        'string.max': 'First name cannot exceed 50 characters',
        'string.pattern.base': 'First name must only contain letters and spaces'
      }),
    lastName: Joi.string()
      .min(1)
      .max(50)
      .pattern(new RegExp('^[a-zA-Z\\s]+$'))
      .optional()
      .messages({
        'string.min': 'Last name must be at least 1 character long',
        'string.max': 'Last name cannot exceed 50 characters',
        'string.pattern.base': 'Last name must only contain letters and spaces'
      })
  }),

  // User login schema
  userLogin: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(1)
      .max(128)
      .required()
      .messages({
        'string.min': 'Password is required',
        'string.max': 'Password cannot exceed 128 characters',
        'any.required': 'Password is required'
      }),
    rememberMe: Joi.boolean()
      .optional()
      .default(false)
  }),

  // Password reset request schema
  passwordResetRequest: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      })
  }),

  // Password reset schema
  passwordReset: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Reset token is required'
      }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required'
      })
  }),

  // Password change schema
  passwordChange: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.max': 'New password cannot exceed 128 characters',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required'
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required'
      })
  }),

  // User profile update schema
  userProfileUpdate: Joi.object({
    firstName: Joi.string()
      .min(1)
      .max(50)
      .pattern(new RegExp('^[a-zA-Z\\s]+$'))
      .optional()
      .messages({
        'string.min': 'First name must be at least 1 character long',
        'string.max': 'First name cannot exceed 50 characters',
        'string.pattern.base': 'First name must only contain letters and spaces'
      }),
    lastName: Joi.string()
      .min(1)
      .max(50)
      .pattern(new RegExp('^[a-zA-Z\\s]+$'))
      .optional()
      .messages({
        'string.min': 'Last name must be at least 1 character long',
        'string.max': 'Last name cannot exceed 50 characters',
        'string.pattern.base': 'Last name must only contain letters and spaces'
      }),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .optional()
      .messages({
        'string.email': 'Please provide a valid email address'
      })
  }),

  // Common parameter validation
  idParam: Joi.object({
    id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.uuid': 'Invalid ID format',
        'any.required': 'ID is required'
      })
  }),

  // Pagination schema
  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .optional()
      .default(1)
      .messages({
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .messages({
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
    sortBy: Joi.string()
      .valid('createdAt', 'updatedAt', 'name', 'email')
      .optional()
      .default('createdAt')
      .messages({
        'any.only': 'Invalid sort field'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .optional()
      .default('desc')
      .messages({
        'any.only': 'Sort order must be either "asc" or "desc"'
      })
  })
};

/**
 * Create validation middleware
 */
export const validate = (schema: Joi.ObjectSchema, options: ValidationOptions = {}) => {
  const defaultOptions: ValidationOptions = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
    target: 'body'
  };

  const opts = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction) => {
    const targetData = req[opts.target!];
    
    if (!targetData) {
      return res.status(400).json({
        error: 'Validation failed',
        message: `No ${opts.target} data found in request`
      });
    }

    const { error, value } = schema.validate(targetData, {
      abortEarly: opts.abortEarly,
      allowUnknown: opts.allowUnknown,
      stripUnknown: opts.stripUnknown
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Validation failed', {
        target: opts.target,
        errors: validationErrors,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        path: req.path
      });

      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: validationErrors
      });
    }

    // Replace the target data with the validated and sanitized value
    req[opts.target! as keyof Request] = value;
    next();
  };
};

/**
 * Validate request body
 */
export const validateBody = (schema: Joi.ObjectSchema, options: Omit<ValidationOptions, 'target'> = {}) => {
  return validate(schema, { ...options, target: 'body' });
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema, options: Omit<ValidationOptions, 'target'> = {}) => {
  return validate(schema, { ...options, target: 'query' });
};

/**
 * Validate route parameters
 */
export const validateParams = (schema: Joi.ObjectSchema, options: Omit<ValidationOptions, 'target'> = {}) => {
  return validate(schema, { ...options, target: 'params' });
};

/**
 * Validate headers
 */
export const validateHeaders = (schema: Joi.ObjectSchema, options: Omit<ValidationOptions, 'target'> = {}) => {
  return validate(schema, { ...options, target: 'headers' });
};

/**
 * Sanitize string input to prevent XSS
 */
export const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Sanitization middleware
 */
export const sanitizeInput = (target: ValidationTarget = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetData = req[target];
      
      if (targetData && typeof targetData === 'object') {
        req[target as keyof Request] = sanitizeObject(targetData);
      }
      
      next();
    } catch (error) {
      logger.error('Input sanitization failed:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Input sanitization failed'
      });
    }
  };
};

/**
 * Combined validation and sanitization middleware
 */
export const validateAndSanitize = (schema: Joi.ObjectSchema, options: ValidationOptions = {}) => {
  return [
    sanitizeInput(options.target),
    validate(schema, options)
  ];
};

/**
 * Email validation utility
 */
export const isValidEmail = (email: string): boolean => {
  const emailSchema = Joi.string().email({ tlds: { allow: false } });
  const { error } = emailSchema.validate(email);
  return !error;
};

/**
 * Password strength validation utility
 */
export const isStrongPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export default {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateHeaders,
  sanitizeInput,
  validateAndSanitize,
  validationSchemas,
  isValidEmail,
  isStrongPassword
};