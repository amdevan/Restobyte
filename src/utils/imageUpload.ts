const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const JPEG_QUALITY = 0.8;

export interface ImageUploadResult {
  dataUrl: string;
  fileName: string;
  fileSize: number;
  width: number;
  height: number;
  mimeType: string;
}

export interface ImageUploadError {
  message: string;
}

function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || 'jpg';
}

function isAnimatedImage(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return ext === 'gif' || ext === 'webp';
}

/**
 * Validates and compresses an image file, returning a base64 data URL.
 * Resizes to max 800x800 while preserving aspect ratio.
 * Converts to JPEG (or keeps PNG for transparency).
 */
export function processImage(file: File): Promise<ImageUploadResult | ImageUploadError> {
  return new Promise((resolve) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      resolve({ message: `"${file.name}" is not an image file.` });
      return;
    }

    // Validate animated images
    if (isAnimatedImage(file.name)) {
      resolve({ message: 'Animated images (GIF, animated WebP) are not supported. Please use a static image.' });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      resolve({ message: `Image is too large (${sizeMB}MB). Maximum size is 5MB.` });
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => resolve({ message: 'Failed to read the image file.' });

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve({ message: 'Failed to load the image. The file may be corrupted.' });

      img.onload = () => {
        let { width, height } = img;

        // Calculate new dimensions if needed
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and draw
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({ message: 'Failed to process the image.' });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Determine output format and quality
        const ext = getFileExtension(file.name);
        let mimeType = 'image/jpeg';
        let quality: number | undefined = JPEG_QUALITY;

        if (ext === 'png') {
          mimeType = 'image/png';
          quality = undefined; // PNG is lossless
        } else if (ext === 'webp') {
          mimeType = 'image/webp';
        }

        const dataUrl = canvas.toDataURL(mimeType, quality);

        // Calculate compressed size (approximate from base64)
        const base64 = dataUrl.split(',')[1] || '';
        const compressedSize = Math.round((base64.length * 3) / 4);

        resolve({
          dataUrl,
          fileName: file.name,
          fileSize: compressedSize,
          width,
          height,
          mimeType,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validates an image file and returns an error message if invalid.
 * Returns null if valid.
 */
export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return `"${file.name}" is not an image file.`;
  }
  if (isAnimatedImage(file.name)) {
    return 'Animated images (GIF, animated WebP) are not supported.';
  }
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return `Image is too large (${sizeMB}MB). Maximum size is 5MB.`;
  }
  return null;
}
