'use server';

import { getStorage } from 'firebase-admin/storage';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../firebase-admin';

export interface UploadFileParams {
  file: File;
  teamId: string;
  uploadedBy: string;
  uploadedByName: string;
}

/**
 * Upload a file to Firebase Storage and create metadata in Firestore
 */
export async function uploadFileAction(params: UploadFileParams): Promise<{ error?: string; fileId?: string }> {
  try {
    const adminApp = initializeFirebaseAdmin();
    const storage = getStorage(adminApp);
    const db = getFirestore(adminApp);

    const { file, teamId, uploadedBy, uploadedByName } = params;

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const filePath = `teams/${teamId}/${fileName}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Firebase Storage
    const bucket = storage.bucket();
    const fileRef = bucket.file(filePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Get download URL
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-09-2491', // Far future date
    });

    // Create metadata in Firestore
    const fileData = {
      name: file.name,
      type: file.type,
      size: file.size,
      url,
      teamId,
      uploadedBy,
      uploadedByName,
      uploadDate: Timestamp.now(),
    };

    const docRef = await db.collection('files').add(fileData);

    return { fileId: docRef.id };
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return { error: error.message || 'Failed to upload file' };
  }
}

/**
 * Delete a file from Storage and Firestore
 */
export async function deleteFileAction(fileId: string, fileUrl: string): Promise<{ error?: string }> {
  try {
    const adminApp = initializeFirebaseAdmin();
    const storage = getStorage(adminApp);
    const db = getFirestore(adminApp);

    // Delete from Storage
    const urlObj = new URL(fileUrl);
    const path = decodeURIComponent(urlObj.pathname.split('/o/')[1]?.split('?')[0] || '');
    if (path) {
      const bucket = storage.bucket();
      await bucket.file(path).delete().catch(() => {
        // Ignore if file doesn't exist
      });
    }

    // Delete from Firestore
    await db.collection('files').doc(fileId).delete();

    return {};
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return { error: error.message || 'Failed to delete file' };
  }
}

