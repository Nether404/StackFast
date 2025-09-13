import { Request, Response, NextFunction } from 'express';
import { createGzip, createBrotliCompress } from 'zlib';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

export interface CompressionOptions {
  threshold?: number; // Minimum response size to compress (bytes)
  level?: number; // Compression level (1-9 for gzip, 1-11 for brotli)
  preferBrotli?: boolean; // Prefer Brotli over gzip when both are supported
}

/**
 * Compression middleware that supports both gzip and Brotli compression
 */
export function compressionMiddleware(options: CompressionOptions = {}) {
  const {
    threshold = 1024, // 1KB minimum
    level = 6, // Default compression level
    preferBrotli = true
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip compression for certain content types
    const skipCompression = (contentType: string) => {
      const skipTypes = [
        'image/',
        'video/',
        'audio/',
        'application/zip',
        'application/gzip',
        'application/x-brotli'
      ];
      return skipTypes.some(type => contentType.includes(type));
    };

    // Get accepted encodings
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const supportsBrotli = acceptEncoding.includes('br');
    const supportsGzip = acceptEncoding.includes('gzip');

    // Determine compression method
    let compressionMethod: 'brotli' | 'gzip' | null = null;
    if (preferBrotli && supportsBrotli) {
      compressionMethod = 'brotli';
    } else if (supportsGzip) {
      compressionMethod = 'gzip';
    }

    if (!compressionMethod) {
      return next();
    }

    // Override res.json to handle compression
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    const compressResponse = async (data: any, isJson: boolean = false) => {
      try {
        let content: string;
        let contentType: string;

        if (isJson) {
          content = JSON.stringify(data);
          contentType = 'application/json';
        } else {
          content = data.toString();
          contentType = res.getHeader('content-type') as string || 'text/plain';
        }

        // Skip compression if content is too small or is already compressed
        if (content.length < threshold || skipCompression(contentType)) {
          return isJson ? originalJson(data) : originalSend(data);
        }

        // Set appropriate headers
        if (compressionMethod === 'brotli') {
          res.setHeader('Content-Encoding', 'br');
        } else {
          res.setHeader('Content-Encoding', 'gzip');
        }

        res.setHeader('Vary', 'Accept-Encoding');
        res.removeHeader('Content-Length'); // Will be set by compression

        // Create compression stream
        const compressionStream = compressionMethod === 'brotli' 
          ? createBrotliCompress({ 
              params: {
                [require('zlib').constants.BROTLI_PARAM_QUALITY]: level
              }
            })
          : createGzip({ level });

        // Compress and send
        const buffer = Buffer.from(content, 'utf8');
        const chunks: Buffer[] = [];

        compressionStream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        compressionStream.on('end', () => {
          const compressed = Buffer.concat(chunks);
          res.end(compressed);
        });

        compressionStream.on('error', (error) => {
          console.error('Compression error:', error);
          // Fallback to uncompressed response
          res.removeHeader('Content-Encoding');
          res.removeHeader('Vary');
          return isJson ? originalJson(data) : originalSend(data);
        });

        compressionStream.write(buffer);
        compressionStream.end();

      } catch (error) {
        console.error('Compression middleware error:', error);
        // Fallback to uncompressed response
        return isJson ? originalJson(data) : originalSend(data);
      }
    };

    // Override response methods
    res.json = function(data: any) {
      return compressResponse(data, true);
    };

    res.send = function(data: any) {
      return compressResponse(data, false);
    };

    next();
  };
}

/**
 * Middleware to add compression headers and metadata
 */
export function compressionHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add compression info to response headers for debugging
    res.setHeader('X-Compression-Available', 'gzip, br');
    
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const supportedEncodings = [];
    
    if (acceptEncoding.includes('br')) supportedEncodings.push('br');
    if (acceptEncoding.includes('gzip')) supportedEncodings.push('gzip');
    if (acceptEncoding.includes('deflate')) supportedEncodings.push('deflate');
    
    res.setHeader('X-Client-Supports', supportedEncodings.join(', ') || 'none');
    
    next();
  };
}

/**
 * Utility function to estimate compression ratio
 */
export function estimateCompressionRatio(data: string, method: 'gzip' | 'brotli' = 'gzip'): Promise<number> {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.from(data, 'utf8');
    const originalSize = buffer.length;
    
    const compressionStream = method === 'brotli' 
      ? createBrotliCompress()
      : createGzip();
    
    const chunks: Buffer[] = [];
    
    compressionStream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    compressionStream.on('end', () => {
      const compressedSize = Buffer.concat(chunks).length;
      const ratio = compressedSize / originalSize;
      resolve(ratio);
    });
    
    compressionStream.on('error', reject);
    
    compressionStream.write(buffer);
    compressionStream.end();
  });
}