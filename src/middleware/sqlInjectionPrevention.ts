/**
 * SQL Injection Prevention Middleware
 * Implements comprehensive SQL injection protection and detection
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * SQL Injection Detection Configuration
 */
export interface SQLInjectionConfig {
  strict?: boolean;
  whitelistedFields?: string[];
  customPatterns?: RegExp[];
  logAttempts?: boolean;
  blockRequests?: boolean;
}

/**
 * Common SQL injection patterns
 */
const sqlInjectionPatterns = [
  // Basic SQL injection patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE|CAST|CONVERT)\b)/gi,
  
  // SQL comments
  /(--|\*\/|\*\*|#)/gi,
  
  // SQL quotes and escapes
  /('|(\\')|('')|(%27)|(%22))/gi,
  
  // SQL logic operators
  /(\b(AND|OR|NOT|XOR)\b.*\b(TRUE|FALSE|\d+\s*=\s*\d+|\d+\s*<\s*\d+|\d+\s*>\s*\d+))/gi,
  
  // SQL functions
  /(\b(SUBSTRING|CHAR|ASCII|CONCAT|CAST|CONVERT|LOAD_FILE|OUTFILE|DUMPFILE|BENCHMARK|SLEEP|DELAY|WAITFOR)\b)/gi,
  
  // SQL system tables and schemas
  /(\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS|SYSUSERS|MASTER|TEMPDB|MSDB|MODEL)\b)/gi,
  
  // SQL injection specific patterns
  /(\b(0x[0-9a-fA-F]+|HAVING|GROUP\s+BY|ORDER\s+BY|LIMIT|OFFSET)\b)/gi,
  
  // SQL union-based injection
  /(\bUNION\b.*\bSELECT\b)/gi,
  
  // SQL boolean-based injection
  /(\b(AND|OR)\b.*\b(\d+\s*=\s*\d+|\d+\s*<>\s*\d+))/gi,
  
  // SQL time-based injection
  /(\b(SLEEP|BENCHMARK|WAITFOR\s+DELAY|pg_sleep)\b)/gi,
  
  // SQL error-based injection
  /(\b(EXTRACTVALUE|UPDATEXML|EXP|CAST|CONVERT)\b.*\()/gi,
  
  // SQL stacked queries
  /(;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC))/gi,
  
  // SQL hex encoding
  /(0x[0-9a-fA-F]+)/gi,
  
  // SQL concatenation
  /(\|\||CONCAT\()/gi,
  
  // SQL version detection
  /(\b(@@version|version\(\)|user\(\)|database\(\)|current_user)\b)/gi,
  
  // SQL privilege escalation
  /(\b(LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE)\b)/gi,
  
  // SQL stored procedures
  /(\b(sp_|xp_|cmdshell|sp_password|sp_helpdb)\b)/gi,
  
  // NoSQL injection patterns
  /(\$where|\$ne|\$gt|\$lt|\$regex|\$or|\$and|\$in|\$nin)/gi,
  
  // Advanced patterns
  /(\b(CHAR|CHR|ASCII|ORD|HEX|UNHEX|LENGTH|SUBSTR|SUBSTRING|LEFT|RIGHT|MID|REVERSE|CONCAT|CONCAT_WS|LCASE|UCASE|LOWER|UPPER|TRIM|LTRIM|RTRIM|REPLACE|REPEAT|SPACE|STUFF|SOUNDEX|DIFFERENCE|QUOTENAME|REPLICATE|REVERSE|PATINDEX|CHARINDEX|LEN|DATALENGTH|RIGHT|LEFT|SUBSTRING|STUFF|REPLACE|REPLICATE|REVERSE|UPPER|LOWER|LTRIM|RTRIM|TRIM|SPACE|REPEAT|CONCAT|CONCAT_WS|LCASE|UCASE|SOUNDEX|DIFFERENCE|QUOTENAME|PATINDEX|CHARINDEX|LEN|DATALENGTH)\b)/gi
];

/**
 * Advanced SQL injection patterns (more strict)
 */
const advancedSQLPatterns = [
  // Blind SQL injection patterns
  /(\b(AND|OR)\b.*\b(SUBSTRING|SUBSTR|MID|LENGTH|ASCII|ORD|CHAR|CHR)\b)/gi,
  
  // Time-based blind SQL injection
  /(\b(AND|OR)\b.*\b(SLEEP|BENCHMARK|WAITFOR|DELAY|pg_sleep)\b)/gi,
  
  // Error-based SQL injection
  /(\b(EXTRACTVALUE|UPDATEXML|EXP|CAST|CONVERT)\b.*\()/gi,
  
  // Union-based SQL injection
  /(\bUNION\b.*\bSELECT\b.*\bFROM\b)/gi,
  
  // Stacked queries
  /(;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE))/gi,
  
  // SQL injection with encoding
  /(CHAR\(|CHR\(|ASCII\(|0x[0-9a-fA-F]+)/gi,
  
  // Database fingerprinting
  /(\b(@@version|version\(\)|user\(\)|database\(\)|current_user|current_database|schema\(\)|system_user)\b)/gi,
  
  // Privilege escalation
  /(\b(LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE|sp_|xp_|cmdshell)\b)/gi,
  
  // Information gathering
  /(\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS|SYSUSERS|MASTER|TEMPDB|MSDB|MODEL|pg_|mysql\.|sqlite_)\b)/gi,
  
  // NoSQL injection
  /(\$where|\$ne|\$gt|\$lt|\$regex|\$or|\$and|\$in|\$nin|\$exists|\$type|\$size|\$all|\$elemMatch)/gi
];

/**
 * Detect SQL injection attempts in input
 */
export const detectSQLInjection = (input: string, config: SQLInjectionConfig = {}): { detected: boolean; patterns: string[] } => {
  if (typeof input !== 'string') {
    return { detected: false, patterns: [] };
  }

  const patterns = config.strict ? advancedSQLPatterns : sqlInjectionPatterns;
  const detectedPatterns: string[] = [];

  // Add custom patterns if provided
  if (config.customPatterns) {
    patterns.push(...config.customPatterns);
  }

  // URL decode the input first
  const decodedInput = decodeURIComponent(input);
  
  // Check against all patterns
  for (const pattern of patterns) {
    if (pattern.test(decodedInput)) {
      detectedPatterns.push(pattern.source);
    }
  }

  return {
    detected: detectedPatterns.length > 0,
    patterns: detectedPatterns
  };
};

/**
 * Sanitize input to prevent SQL injection
 */
export const sanitizeSQLInput = (input: string): string => {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    // Remove SQL comments
    .replace(/(--|\*\/|\*\*|#)/g, '')
    // Escape single quotes
    .replace(/'/g, "''")
    // Remove SQL keywords in dangerous contexts
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi, '')
    // Remove SQL functions
    .replace(/(\b(SUBSTRING|CHAR|ASCII|CONCAT|CAST|CONVERT|LOAD_FILE|OUTFILE|DUMPFILE|BENCHMARK|SLEEP|DELAY|WAITFOR)\b)/gi, '')
    // Remove semicolons (to prevent stacked queries)
    .replace(/;/g, '')
    // Remove SQL operators in dangerous contexts
    .replace(/(\b(AND|OR|NOT|XOR)\b.*\b(TRUE|FALSE|\d+\s*=\s*\d+))/gi, '')
    // Trim whitespace
    .trim();
};

/**
 * Sanitize object recursively
 */
export const sanitizeObjectSQL = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeSQLInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectSQL(item));
  }

  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitize both key and value
        const sanitizedKey = sanitizeSQLInput(key);
        sanitized[sanitizedKey] = sanitizeObjectSQL(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * SQL injection prevention middleware
 */
export const sqlInjectionPrevention = (config: SQLInjectionConfig = {}) => {
  const defaultConfig: SQLInjectionConfig = {
    strict: true,
    whitelistedFields: [],
    customPatterns: [],
    logAttempts: true,
    blockRequests: true
  };

  const cfg = { ...defaultConfig, ...config };

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const checkInput = (obj: any, path: string = '', isWhitelisted: boolean = false) => {
        if (typeof obj === 'string') {
          // Skip whitelisted fields
          if (isWhitelisted || cfg.whitelistedFields?.includes(path)) {
            return null;
          }

          const detection = detectSQLInjection(obj, cfg);
          if (detection.detected) {
            if (cfg.logAttempts) {
              logger.warn('SQL injection attempt detected', {
                path,
                patterns: detection.patterns,
                input: obj.substring(0, 200),
                ip: req.ip,
                userAgent: req.get('user-agent'),
                method: req.method,
                url: req.url,
                headers: req.headers
              });
            }

            if (cfg.blockRequests) {
              return res.status(400).json({
                error: 'Malicious input detected',
                message: 'Request blocked due to potential SQL injection attack'
              });
            }
          }
        } else if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            const result = checkInput(obj[i], `${path}[${i}]`, isWhitelisted);
            if (result) return result;
          }
        } else if (obj && typeof obj === 'object') {
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              const fieldPath = path ? `${path}.${key}` : key;
              const isFieldWhitelisted = cfg.whitelistedFields?.includes(fieldPath);
              const result = checkInput(obj[key], fieldPath, isFieldWhitelisted);
              if (result) return result;
            }
          }
        }
        return null;
      };

      // Check body, query, and params
      const bodyResult = req.body ? checkInput(req.body, 'body') : null;
      if (bodyResult) return bodyResult;

      const queryResult = req.query ? checkInput(req.query, 'query') : null;
      if (queryResult) return queryResult;

      const paramsResult = req.params ? checkInput(req.params, 'params') : null;
      if (paramsResult) return paramsResult;

      next();
    } catch (error) {
      logger.error('SQL injection prevention middleware failed:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Security validation failed'
      });
    }
  };
};

/**
 * SQL injection sanitization middleware
 */
export const sqlInjectionSanitization = (config: SQLInjectionConfig = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObjectSQL(req.body);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObjectSQL(req.query);
      }

      // Sanitize route parameters
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObjectSQL(req.params);
      }

      next();
    } catch (error) {
      logger.error('SQL injection sanitization failed:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Input sanitization failed'
      });
    }
  };
};

/**
 * Parameterized query helper
 */
export const createParameterizedQuery = (query: string, params: any[]): { text: string; values: any[] } => {
  return {
    text: query,
    values: params
  };
};

/**
 * Safe query builder for PostgreSQL
 */
export const buildSafeQuery = (table: string, conditions: { [key: string]: any }, operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' = 'SELECT'): { text: string; values: any[] } => {
  const allowedTables = ['users', 'sessions', 'roles', 'audit_logs']; // Define allowed tables
  
  if (!allowedTables.includes(table)) {
    throw new Error('Invalid table name');
  }

  const keys = Object.keys(conditions);
  const values = Object.values(conditions);

  switch (operation) {
    case 'SELECT':
      const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
      return {
        text: `SELECT * FROM ${table} WHERE ${whereClause}`,
        values: values
      };
    
    case 'INSERT':
      const insertKeys = keys.join(', ');
      const insertPlaceholders = keys.map((_, index) => `$${index + 1}`).join(', ');
      return {
        text: `INSERT INTO ${table} (${insertKeys}) VALUES (${insertPlaceholders}) RETURNING *`,
        values: values
      };
    
    case 'UPDATE':
      const updateSet = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
      return {
        text: `UPDATE ${table} SET ${updateSet} WHERE id = $${keys.length + 1}`,
        values: [...values, conditions.id]
      };
    
    case 'DELETE':
      const deleteWhere = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
      return {
        text: `DELETE FROM ${table} WHERE ${deleteWhere}`,
        values: values
      };
    
    default:
      throw new Error('Invalid operation');
  }
};

/**
 * Validate table and column names
 */
export const validateIdentifier = (identifier: string): boolean => {
  // Only allow alphanumeric characters and underscores
  const validPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return validPattern.test(identifier);
};

/**
 * Escape SQL identifiers (table names, column names)
 */
export const escapeIdentifier = (identifier: string): string => {
  if (!validateIdentifier(identifier)) {
    throw new Error('Invalid SQL identifier');
  }
  return `"${identifier.replace(/"/g, '""')}"`;
};

/**
 * SQL injection detection for specific fields
 */
export const sqlInjectionDetectionFields = (fields: string[], config: SQLInjectionConfig = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const checkFields = (obj: any, fieldsList: string[]) => {
        for (const field of fieldsList) {
          if (obj[field] && typeof obj[field] === 'string') {
            const detection = detectSQLInjection(obj[field], config);
            if (detection.detected) {
              logger.warn('SQL injection detected in specific field', {
                field,
                patterns: detection.patterns,
                input: obj[field].substring(0, 200),
                ip: req.ip,
                userAgent: req.get('user-agent'),
                method: req.method,
                url: req.url
              });
              
              return res.status(400).json({
                error: 'Malicious input detected',
                message: `SQL injection detected in field: ${field}`
              });
            }
          }
        }
        return null;
      };

      // Check specified fields in body and query
      if (req.body && typeof req.body === 'object') {
        const result = checkFields(req.body, fields);
        if (result) return result;
      }

      if (req.query && typeof req.query === 'object') {
        const result = checkFields(req.query, fields);
        if (result) return result;
      }

      next();
    } catch (error) {
      logger.error('SQL injection detection for fields failed:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Security validation failed'
      });
    }
  };
};

export default {
  sqlInjectionPrevention,
  sqlInjectionSanitization,
  sqlInjectionDetectionFields,
  detectSQLInjection,
  sanitizeSQLInput,
  sanitizeObjectSQL,
  createParameterizedQuery,
  buildSafeQuery,
  validateIdentifier,
  escapeIdentifier
};