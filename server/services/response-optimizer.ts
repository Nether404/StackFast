import { Response } from 'express';

export interface SerializationOptions {
  excludeFields?: string[];
  includeFields?: string[];
  maxDepth?: number;
  dateFormat?: 'iso' | 'timestamp' | 'unix';
  numberPrecision?: number;
}

export class ResponseOptimizer {
  /**
   * Optimize data serialization for large responses
   */
  static optimizeData<T>(data: T, options: SerializationOptions = {}): any {
    const {
      excludeFields = [],
      includeFields = [],
      maxDepth = 10,
      dateFormat = 'iso',
      numberPrecision
    } = options;

    const optimize = (obj: any, depth: number = 0): any => {
      if (depth > maxDepth) {
        return '[Max depth reached]';
      }

      if (obj === null || obj === undefined) {
        return obj;
      }

      if (obj instanceof Date) {
        switch (dateFormat) {
          case 'timestamp':
            return obj.toISOString();
          case 'unix':
            return Math.floor(obj.getTime() / 1000);
          default:
            return obj.toISOString();
        }
      }

      if (typeof obj === 'number' && numberPrecision !== undefined) {
        return Number(obj.toFixed(numberPrecision));
      }

      if (Array.isArray(obj)) {
        return obj.map(item => optimize(item, depth + 1));
      }

      if (typeof obj === 'object') {
        const result: any = {};
        
        for (const [key, value] of Object.entries(obj)) {
          // Skip excluded fields
          if (excludeFields.includes(key)) {
            continue;
          }
          
          // If includeFields is specified, only include those fields
          if (includeFields.length > 0 && !includeFields.includes(key)) {
            continue;
          }
          
          result[key] = optimize(value, depth + 1);
        }
        
        return result;
      }

      return obj;
    };

    return optimize(data);
  }

  /**
   * Create optimized JSON response with metadata
   */
  static createOptimizedResponse(
    data: any,
    options: {
      message?: string;
      meta?: Record<string, any>;
      serializationOptions?: SerializationOptions;
    } = {}
  ) {
    const { message, meta = {}, serializationOptions = {} } = options;
    
    const optimizedData = this.optimizeData(data, serializationOptions);
    
    const response: any = {
      success: true,
      data: optimizedData
    };

    if (message) {
      response.message = message;
    }

    if (Object.keys(meta).length > 0) {
      response.meta = meta;
    }

    // Add response metadata
    response.meta = {
      ...response.meta,
      timestamp: new Date().toISOString(),
      dataSize: JSON.stringify(optimizedData).length
    };

    return response;
  }

  /**
   * Stream large responses in chunks
   */
  static streamResponse(res: Response, data: any[], chunkSize: number = 1000) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    res.write('{"success":true,"data":[');
    
    let isFirst = true;
    
    const writeChunk = (chunk: any[]) => {
      const serialized = chunk.map(item => JSON.stringify(item)).join(',');
      if (!isFirst) {
        res.write(',');
      }
      res.write(serialized);
      isFirst = false;
    };

    // Process data in chunks
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      writeChunk(chunk);
    }
    
    res.write(']}');
    res.end();
  }

  /**
   * Compress response data by removing redundant information
   */
  static compressResponseData(data: any[]): any[] {
    if (!Array.isArray(data) || data.length === 0) {
      return data;
    }

    // Find common fields across all objects
    const firstItem = data[0];
    if (typeof firstItem !== 'object' || firstItem === null) {
      return data;
    }

    const allKeys = Object.keys(firstItem);
    const commonFields: Record<string, any> = {};
    const variableFields: string[] = [];

    // Identify fields that have the same value across all items
    for (const key of allKeys) {
      const firstValue = firstItem[key];
      const isCommon = data.every(item => 
        item && typeof item === 'object' && item[key] === firstValue
      );

      if (isCommon && typeof firstValue !== 'object') {
        commonFields[key] = firstValue;
      } else {
        variableFields.push(key);
      }
    }

    // If no common fields found, return original data
    if (Object.keys(commonFields).length === 0) {
      return data;
    }

    // Create compressed format
    const compressedData = data.map(item => {
      const compressed: any = {};
      for (const field of variableFields) {
        if (item && typeof item === 'object' && field in item) {
          compressed[field] = item[field];
        }
      }
      return compressed;
    });

    return {
      _compressed: true,
      _common: commonFields,
      _data: compressedData
    } as any;
  }

  /**
   * Add response timing and performance metadata
   */
  static addPerformanceMetadata(startTime: number, additionalMeta: Record<string, any> = {}) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      ...additionalMeta,
      performance: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage()
      }
    };
  }

  /**
   * Create efficient data transfer object (DTO) for API responses
   */
  static createDTO<T>(
    data: T,
    mapping: Record<string, string | ((value: any) => any)>
  ): any {
    if (Array.isArray(data)) {
      return data.map(item => this.createDTO(item, mapping));
    }

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const dto: any = {};
    
    for (const [sourceKey, target] of Object.entries(mapping)) {
      const sourceValue = (data as any)[sourceKey];
      
      if (typeof target === 'string') {
        dto[target] = sourceValue;
      } else if (typeof target === 'function') {
        dto[sourceKey] = target(sourceValue);
      }
    }

    return dto;
  }

  /**
   * Lazy load related data for responses
   */
  static createLazyResponse<T>(
    data: T,
    lazyFields: Record<string, () => Promise<any>>
  ) {
    const response = {
      ...data,
      _lazy: Object.keys(lazyFields)
    };

    // Add methods to load lazy fields
    for (const [fieldName, loader] of Object.entries(lazyFields)) {
      (response as any)[`load${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`] = loader;
    }

    return response;
  }

  /**
   * Optimize response for mobile clients (reduced data)
   */
  static optimizeForMobile<T>(data: T): T {
    const mobileOptimizations: SerializationOptions = {
      excludeFields: ['description', 'notes', 'metadata', 'debug'],
      numberPrecision: 2,
      maxDepth: 3
    };

    return this.optimizeData(data, mobileOptimizations);
  }

  /**
   * Create summary response for large datasets
   */
  static createSummaryResponse<T>(
    data: T[],
    summaryFields: string[] = ['id', 'name'],
    includeCount: boolean = true
  ) {
    const summary = data.map(item => {
      if (typeof item === 'object' && item !== null) {
        const summaryItem: any = {};
        for (const field of summaryFields) {
          if (field in item) {
            summaryItem[field] = (item as any)[field];
          }
        }
        return summaryItem;
      }
      return item;
    });

    const response: any = {
      summary,
      _isSummary: true
    };

    if (includeCount) {
      response.totalCount = data.length;
    }

    return response;
  }
}