import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Cloudflare R2 configuration with validation
const r2Config = {
  accountId: import.meta.env.VITE_R2_ACCOUNT_ID,
  accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
  secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  bucketName: import.meta.env.VITE_R2_BUCKET_NAME,
  publicUrl: import.meta.env.VITE_R2_PUBLIC_URL,
};

// Validate environment variables
const validateEnv = () => {
  const requiredVars = [
    'VITE_R2_ACCOUNT_ID',
    'VITE_R2_ACCESS_KEY_ID',
    'VITE_R2_SECRET_ACCESS_KEY',
    'VITE_R2_BUCKET_NAME',
    'VITE_R2_PUBLIC_URL'
  ];

  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    throw new Error(`Missing R2 configuration: ${missingVars.join(', ')}`);
  }
};

// Validate on module load
validateEnv();

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
});

interface UploadFileOptions {
  file: File;
  path: string;
  contentType?: string;
}

interface UploadResult {
  url: string;
  key: string;
  publicUrl: string;
}

/**
 * Upload a file to Cloudflare R2
 */
export const uploadToR2 = async ({
  file,
  path,
  contentType,
}: UploadFileOptions): Promise<UploadResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    const key = path;
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      Body: arrayBuffer,
      ContentType: contentType || file.type,
      ContentLength: file.size,
      CacheControl: 'public, max-age=86400, stale-while-revalidate=604800',
      // Add CORS headers for better compatibility
      Metadata: {
        'x-amz-meta-original-filename': file.name,
      },
    });

    await s3Client.send(command);

    // Generate public URL with cache-busting timestamp query parameter
    const timestamp = Date.now();
    const publicUrl = `${r2Config.publicUrl}/${key}?t=${timestamp}`;

    return {
      url: publicUrl,
      key,
      publicUrl,
    };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to upload file';
    
    if (error instanceof Error) {
      if (error.name === 'AccessDenied') {
        errorMessage = 'Access denied to Cloudflare R2. Please check your credentials and permissions.';
      } else if (error.name === 'NoSuchBucket') {
        errorMessage = 'R2 bucket not found. Please check the bucket name.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Access forbidden (403). Please check CORS configuration and bucket permissions.';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'CORS error. Please configure CORS for your R2 bucket.';
      } else {
        errorMessage = `Failed to upload file: ${error.message}`;
      }
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Generate a signed URL for temporary access to a private file
 */
export const getSignedUrlForFile = async (key: string, expiresIn: number = 3600): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Delete a file from Cloudflare R2
 */
export const deleteFromR2 = async (key: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
    });

    await s3Client.send(command);
    
  } catch (error) {
    console.error('Error deleting from R2:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.Code || 'Unknown code',
      statusCode: (error as any)?.$metadata?.httpStatusCode || 'Unknown status'
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to delete file from R2';
    if (error instanceof Error) {
      if (error.name === 'NoSuchKey') {
        console.warn('File does not exist in R2 bucket (already deleted?)');
        return; // Don't throw error if file doesn't exist
      } else if (error.name === 'AccessDenied') {
        errorMessage = 'Access denied to R2 bucket. Please check credentials and permissions.';
      } else if (error.name === 'NoSuchBucket') {
        errorMessage = 'R2 bucket not found. Please check bucket name.';
      } else {
        errorMessage = `R2 deletion failed: ${error.message}`;
      }
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Test R2 connection and permissions
 */
export const testR2Connection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Try to list objects (if permitted) or attempt a head operation
    const testKey = 'test-connection-' + Date.now();
    
    // Try to put a small test object
    const putCommand = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: testKey,
      Body: 'test',
      ContentType: 'text/plain'
    });
    
    await s3Client.send(putCommand);
    
    // Clean up test object
    const deleteCommand = new DeleteObjectCommand({
      Bucket: r2Config.bucketName,
      Key: testKey
    });
    
    await s3Client.send(deleteCommand);
    
    return { success: true, message: 'R2 connection test successful' };
  } catch (error) {
    console.error('R2 connection test failed:', error);
    return { 
      success: false, 
      message: `R2 connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

/**
 * Check if a file exists in R2 (not implemented - would require list permissions)
 */
export const fileExistsInR2 = async (_key: string): Promise<boolean> => {
  // This would require ListBucket permission which is not recommended for security
  // For now, we'll assume the file exists if we need to check
  return true;
};

export default {
  uploadToR2,
  getSignedUrlForFile,
  deleteFromR2,
  fileExistsInR2,
  testR2Connection,
};
