/**
 * File storage utilities using free services
 * Uses ImgBB for images and base64 for small files
 */

import { processImageForStorage } from './image-storage';

export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  type: 'imgbb' | 'base64' | 'error';
}

const MAX_BASE64_SIZE = 500 * 1024; // 500KB for base64 storage

/**
 * Upload file using appropriate storage method
 */
export async function uploadFile(file: File, resize: boolean = true, apiKey?: string): Promise<FileUploadResult> {
  // Check if it's an image
  if (file.type.startsWith('image/')) {
    try {
      // Try ImgBB first (for images)
      let fileToUpload = file;
      
      // Optionally resize large images (only if really large to speed up uploads)
      if (resize && file.size > 3 * 1024 * 1024) { // 3MB - reduced threshold for faster uploads
        const { resizeImage } = await import('./imgbb-storage');
        fileToUpload = await resizeImage(file, 1600, 1600, 0.85); // Smaller size, lower quality for speed
      }

      const { uploadToImgBB } = await import('./imgbb-storage');
      const result = await uploadToImgBB(fileToUpload, imgbbApiKey);
      
      if (result.success) {
        return {
          success: true,
          url: result.url,
          type: 'imgbb',
        };
      }

      // If ImgBB fails and file is small, fall back to base64
      if (file.size < MAX_BASE64_SIZE) {
        const base64 = await processImageForStorage(file);
        return {
          success: true,
          url: base64,
          type: 'base64',
        };
      }

      return {
        success: false,
        error: result.error || 'Failed to upload image',
        type: 'error',
      };
    } catch (error: any) {
      // Fall back to base64 for small files
      if (file.size < MAX_BASE64_SIZE) {
        try {
          const base64 = await processImageForStorage(file);
          return {
            success: true,
            url: base64,
            type: 'base64',
          };
        } catch (base64Error: any) {
          return {
            success: false,
            error: base64Error.message || 'Failed to upload file',
            type: 'error',
          };
        }
      }

      return {
        success: false,
        error: error.message || 'Failed to upload file',
        type: 'error',
      };
    }
  }

  // For non-image files, use base64 if small enough
  if (file.size < MAX_BASE64_SIZE) {
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      return {
        success: true,
        url: base64,
        type: 'base64',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload file',
        type: 'error',
      };
    }
  }

  return {
    success: false,
    error: 'File is too large. Maximum size is 32MB for images or 500KB for other files.',
    type: 'error',
  };
}

/**
 * Get file URL (handles both ImgBB URLs and base64)
 */
export function getFileUrl(storedUrl: string | null | undefined): string | null {
  if (!storedUrl) return null;
  
  // If it's already a URL (starts with http), return it
  if (storedUrl.startsWith('http://') || storedUrl.startsWith('https://')) {
    return storedUrl;
  }
  
  // Otherwise, it's base64
  return storedUrl;
}

/**
 * Check if URL is from ImgBB
 */
export function isImgBBUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('i.ibb.co') || url.includes('imgbb.com');
}
