'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../firebase-admin';

/**
 * Delete a file from Firestore
 */
export async function deleteFileAction(fileId: string): Promise<{ error?: string }> {
  try {
    await initializeFirebaseAdmin();
    const db = getFirestore();
    
    await db.collection('files').doc(fileId).delete();
    
    return {};
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return { error: error.message || 'Failed to delete file' };
  }
}

/**
 * Rename a file in Firestore
 */
export async function renameFileAction(fileId: string, newName: string): Promise<{ error?: string }> {
  try {
    await initializeFirebaseAdmin();
    const db = getFirestore();
    
    if (!newName || newName.trim().length === 0) {
      return { error: 'File name cannot be empty' };
    }
    
    await db.collection('files').doc(fileId).update({
      name: newName.trim(),
    });
    
    return {};
  } catch (error: any) {
    console.error('Error renaming file:', error);
    return { error: error.message || 'Failed to rename file' };
  }
}
