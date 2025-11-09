/**
 * ImgBB API integration for free image storage
 * Free tier: 32MB per file, unlimited storage
 * 
 * Setup:
 * 1. Sign up at imgbb.com (free account)
 * 2. Go to https://api.imgbb.com/ and click "Get API Key"
 * 3. Or go to https://imgbb.com/api and register your app
 * 4. Copy your API key
 * 5. Add to .env.local as NEXT_PUBLIC_IMGBB_API_KEY
 * 
 * Alternative: If you don't have ImgBB API key, the app will use base64 storage
 * for files smaller than 500KB (stored directly in Firestore)
 */

const MAX_FILE_SIZE = 32 * 1024 * 1024; // 32MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/png'];

export interface ImgBBUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  deleteUrl?: string;
}

/**
 * Upload image to ImgBB
 */
export async function uploadToImgBB(file: File): Promise<ImgBBUploadResult> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'ImgBB API key not configured. Please add NEXT_PUBLIC_IMGBB_API_KEY to .env.local',
    };
  }

  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      success: false,
      error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.',
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File size exceeds 32MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);

    // Upload to ImgBB
    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', base64.split(',')[1] || base64); // Remove data:image/...;base64, prefix

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        url: data.data.url,
        deleteUrl: data.data.delete_url,
      };
    } else {
      return {
        success: false,
        error: data.error?.message || 'Failed to upload image to ImgBB',
      };
    }
  } catch (error: any) {
    console.error('Error uploading to ImgBB:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload image. Please try again.',
    };
  }
}

/**
 * Convert file to base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Resize image before upload (optimized for speed)
 */
export function resizeImage(
  file: File,
  maxWidth: number = 1600,
  maxHeight: number = 1600,
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress (faster with lower quality)
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          const resizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
