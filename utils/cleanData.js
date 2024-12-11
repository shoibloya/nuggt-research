// utils/cleanData.js

/**
 * Recursively removes undefined values from an object or array.
 * @param {any} obj - The object or array to clean.
 * @returns {any} - The cleaned object or array with undefined values removed.
 */
 export function cleanData(obj) {
    if (Array.isArray(obj)) {
      return obj
        .map((item) => cleanData(item))
        .filter((item) => item !== undefined);
    } else if (obj !== null && typeof obj === 'object') {
      const cleanedObj = {};
      Object.keys(obj).forEach((key) => {
        const value = cleanData(obj[key]);
        if (value !== undefined) {
          cleanedObj[key] = value;
        }
      });
      return cleanedObj;
    } else if (obj !== undefined) {
      return obj;
    }
    return undefined;
  }
  