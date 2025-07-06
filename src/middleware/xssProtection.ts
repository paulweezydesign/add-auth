/**
 * XSS Protection Middleware
 * Implements comprehensive Cross-Site Scripting (XSS) protection with sanitization
 */

import { Request, Response, NextFunction } from 'express';
import xss from 'xss';
import { logger } from '../utils/logger';

/**
 * XSS Protection Configuration
 */
export interface XSSProtectionConfig {
  whiteList?: { [key: string]: string[] };
  stripIgnoreTag?: boolean;
  stripIgnoreTagBody?: string[] | boolean;
  css?: boolean | { [key: string]: boolean };
  allowCommentTag?: boolean;
  escapeHtml?: (html: string) => string;
  onIgnoreTag?: (tag: string, html: string, options: any) => string;
  onIgnoreTagAttr?: (tag: string, name: string, value: string, isWhiteAttr: boolean) => string;
  onTagAttr?: (tag: string, name: string, value: string, isWhiteAttr: boolean) => string;
  safeAttrValue?: (tag: string, name: string, value: string, cssFilter: any) => string;
}

/**
 * Default XSS protection configuration
 */
const defaultXSSConfig: XSSProtectionConfig = {
  whiteList: {
    // Allow basic formatting tags with limited attributes
    'b': [],
    'i': [],
    'em': [],
    'strong': [],
    'br': [],
    'p': ['class'],
    'span': ['class'],
    'div': ['class'],
    'h1': ['class'],
    'h2': ['class'],
    'h3': ['class'],
    'h4': ['class'],
    'h5': ['class'],
    'h6': ['class'],
    'ul': ['class'],
    'ol': ['class'],
    'li': ['class'],
    'a': ['href', 'title', 'target'],
    'img': ['src', 'alt', 'title', 'width', 'height']
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'object', 'embed', 'iframe'],
  css: false,
  allowCommentTag: false,
  onIgnoreTag: (tag: string, html: string, options: any) => {
    // Log suspicious tags
    logger.warn('XSS: Ignored suspicious tag', { tag, html: html.substring(0, 100) });
    return '';
  },
  onIgnoreTagAttr: (tag: string, name: string, value: string, isWhiteAttr: boolean) => {
    // Log suspicious attributes
    if (!isWhiteAttr) {
      logger.warn('XSS: Ignored suspicious attribute', { tag, name, value: value.substring(0, 100) });
    }
    return '';
  },
  onTagAttr: (tag: string, name: string, value: string, isWhiteAttr: boolean) => {
    // Additional validation for href attributes
    if (name === 'href' && !isWhiteAttr) {
      // Only allow http, https, and mailto protocols
      if (!/^(https?:\/\/|mailto:)/i.test(value)) {
        logger.warn('XSS: Blocked suspicious href', { tag, name, value });
        return '';
      }
    }
    return `${name}="${xss.escapeAttrValue(value)}"`;
  }
};

/**
 * Strict XSS configuration (no HTML allowed)
 */
const strictXSSConfig: XSSProtectionConfig = {
  whiteList: {}, // No tags allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: true,
  css: false,
  allowCommentTag: false
};

/**
 * Sanitize a string value using XSS protection
 */
export const sanitizeString = (input: string, config: XSSProtectionConfig = defaultXSSConfig): string => {
  if (typeof input !== 'string') {
    return input;
  }

  try {
    return xss(input, config);
  } catch (error) {
    logger.error('XSS sanitization failed:', error);
    // Fallback to basic escaping
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj: any, config: XSSProtectionConfig = defaultXSSConfig): any => {
  if (typeof obj === 'string') {
    return sanitizeString(obj, config);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, config));
  }

  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitize both key and value
        const sanitizedKey = sanitizeString(key, strictXSSConfig);
        sanitized[sanitizedKey] = sanitizeObject(obj[key], config);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * XSS protection middleware
 */
export const xssProtection = (config: XSSProtectionConfig = defaultXSSConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body, config);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query, config);
      }

      // Sanitize route parameters
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params, config);
      }

      // Set XSS protection headers
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';");

      next();
    } catch (error) {
      logger.error('XSS protection middleware failed:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'XSS protection failed'
      });
    }
  };
};

/**
 * Strict XSS protection middleware (no HTML allowed)
 */
export const strictXSSProtection = () => {
  return xssProtection(strictXSSConfig);
};

/**
 * XSS protection for specific fields
 */
export const xssProtectFields = (fields: string[], config: XSSProtectionConfig = defaultXSSConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body && typeof req.body === 'object') {
        for (const field of fields) {
          if (req.body[field] && typeof req.body[field] === 'string') {
            req.body[field] = sanitizeString(req.body[field], config);
          }
        }
      }

      if (req.query && typeof req.query === 'object') {
        for (const field of fields) {
          if (req.query[field] && typeof req.query[field] === 'string') {
            req.query[field] = sanitizeString(req.query[field] as string, config);
          }
        }
      }

      next();
    } catch (error) {
      logger.error('Field-specific XSS protection failed:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'XSS protection failed'
      });
    }
  };
};

/**
 * Content Security Policy (CSP) middleware
 */
export const contentSecurityPolicy = (customPolicy?: string) => {
  const defaultPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ');

  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Content-Security-Policy', customPolicy || defaultPolicy);
    next();
  };
};

/**
 * HTML escaping utility
 */
export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  return text.replace(/[&<>"'`=\/]/g, (s) => map[s]);
};

/**
 * URL validation and sanitization
 */
export const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') {
    return '';
  }

  // Remove dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
  const lowerUrl = url.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.includes(protocol)) {
      logger.warn('XSS: Blocked dangerous URL protocol', { url: url.substring(0, 100) });
      return '';
    }
  }

  // Only allow http, https, and mailto
  if (!/^(https?:\/\/|mailto:)/i.test(url)) {
    logger.warn('XSS: Blocked invalid URL protocol', { url: url.substring(0, 100) });
    return '';
  }

  return url;
};

/**
 * Safe JSON parsing with XSS protection
 */
export const safeJsonParse = (jsonString: string, config: XSSProtectionConfig = defaultXSSConfig): any => {
  try {
    const parsed = JSON.parse(jsonString);
    return sanitizeObject(parsed, config);
  } catch (error) {
    logger.error('Safe JSON parsing failed:', error);
    return null;
  }
};

/**
 * XSS detection utility
 */
export const detectXSS = (input: string): { detected: boolean; patterns: string[] } => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onerror=/gi,
    /onclick=/gi,
    /onmouseover=/gi,
    /onfocus=/gi,
    /onblur=/gi,
    /onchange=/gi,
    /onsubmit=/gi,
    /document\.cookie/gi,
    /document\.write/gi,
    /window\.location/gi,
    /eval\(/gi,
    /setTimeout\(/gi,
    /setInterval\(/gi
  ];

  const detectedPatterns: string[] = [];

  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      detectedPatterns.push(pattern.source);
    }
  }

  return {
    detected: detectedPatterns.length > 0,
    patterns: detectedPatterns
  };
};

/**
 * XSS detection middleware
 */
export const xssDetection = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const checkInput = (obj: any, path: string = '') => {
      if (typeof obj === 'string') {
        const detection = detectXSS(obj);
        if (detection.detected) {
          logger.warn('XSS attack detected', {
            path,
            patterns: detection.patterns,
            input: obj.substring(0, 200),
            ip: req.ip,
            userAgent: req.get('user-agent'),
            method: req.method,
            url: req.url
          });
          
          // Optionally block the request
          return res.status(400).json({
            error: 'Malicious input detected',
            message: 'Request blocked due to potential XSS attack'
          });
        }
      } else if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          const result = checkInput(obj[i], `${path}[${i}]`);
          if (result) return result;
        }
      } else if (obj && typeof obj === 'object') {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const result = checkInput(obj[key], path ? `${path}.${key}` : key);
            if (result) return result;
          }
        }
      }
    };

    // Check body, query, and params
    const bodyResult = req.body ? checkInput(req.body, 'body') : null;
    if (bodyResult) return bodyResult;

    const queryResult = req.query ? checkInput(req.query, 'query') : null;
    if (queryResult) return queryResult;

    const paramsResult = req.params ? checkInput(req.params, 'params') : null;
    if (paramsResult) return paramsResult;

    next();
  };
};

export default {
  xssProtection,
  strictXSSProtection,
  xssProtectFields,
  contentSecurityPolicy,
  sanitizeString,
  sanitizeObject,
  escapeHtml,
  sanitizeUrl,
  safeJsonParse,
  detectXSS,
  xssDetection
};