/**
 * Alternative image storage solution for profile pictures
 * Since Firebase Storage requires billing, we use base64 encoding
 * and store images directly in Firestore (with size limits)
 * 
 * For production, consider:
 * - Cloudinary (free tier available)
 * - ImgBB API (free)
 * - Base64 in Firestore (current solution, limited to 1MB per document)
 */

const MAX_IMAGE_SIZE = 500 * 1024; // 500KB max for base64 storage
const MAX_IMAGE_DIMENSION = 400; // Max width/height in pixels

/**
 * Convert image file to base64 string
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Resize image to reduce file size
 */
export function resizeImage(
  file: File,
  maxWidth: number = MAX_IMAGE_DIMENSION,
  maxHeight: number = MAX_IMAGE_DIMENSION
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

      // Draw and compress
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
        0.8 // Quality: 0.8 (80%)
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate and process image for storage
 */
export async function processImageForStorage(file: File): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size (before processing)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be less than 5MB');
  }

  // Resize image to reduce size
  const resizedFile = await resizeImage(file);

  // Convert to base64
  const base64 = await imageToBase64(resizedFile);

  // Check final size
  const base64Size = (base64.length * 3) / 4; // Approximate size in bytes
  if (base64Size > MAX_IMAGE_SIZE) {
    throw new Error('Image is too large after processing. Please use a smaller image.');
  }

  return base64;
}

/**
 * Get image URL from base64 string
 */
export function getImageUrl(base64String: string | null | undefined): string | null {
  if (!base64String) return null;
  // If it's already a URL, return it
  if (base64String.startsWith('http://') || base64String.startsWith('https://')) {
    return base64String;
  }
  // Otherwise, it's base64
  return base64String;
}

