'use server';
// IMPORTANT: This file needs to be imported by a client-side component to be callable.
// We are calling it from use-user.tsx

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../firebase-admin';
import type { Role } from '@/lib/types';

interface CreateUserParams {
    email: string;
    password: string;
    displayName: string;
    role: Role;
    teamId?: string;
}

/**
 * Creates a new user in Firebase Authentication and a corresponding user profile in Firestore.
 * This is a server action and must be called from a client component.
 * It uses the Firebase Admin SDK to avoid affecting the current user's session.
 */
export async function createUserAction(params: CreateUserParams): Promise<{ error?: string }> {
  try {
    const adminApp = initializeFirebaseAdmin();
    const auth = getAuth(adminApp);
    const db = getFirestore(adminApp);

    const { email, password, displayName, role, teamId } = params;

    // 1. Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
    });

    // 2. Create user profile in Firestore
    // Core and Semi-core can be created without teams
    // Head and Volunteer should have teams (but we allow empty for flexibility)
    const userProfileData = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL || null,
      role: role,
      teamId: teamId || '',
    };
    
    await db.collection('users').doc(userRecord.uid).set(userProfileData);

    return {};
    
  } catch (error: any) {
    console.error('Error creating user with server action:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });
    
    // Provide a more user-friendly error message
    let message = 'An unexpected error occurred.';
    
    if (error.message?.includes('service account') || error.message?.includes('FIREBASE_SERVICE_ACCOUNT_JSON')) {
      message = 'Firebase Admin SDK is not configured. Please set up the service account credentials.';
    } else if (error.code === 'auth/email-already-exists') {
      message = 'The email address is already in use by another account.';
    } else if (error.code === 'auth/invalid-password') {
      message = 'The password must be a string with at least six characters.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'The email address is invalid.';
    } else if (error.code === 'permission-denied') {
      message = 'Permission denied. You do not have access to create users.';
    } else if (error.message) {
      message = error.message;
    }
    
    return { error: message };
  }
}

/**
 * Deletes a user from Firebase Authentication and Firestore.
 * This is a server action and must be called from a client component.
 * It uses the Firebase Admin SDK to delete both Auth user and Firestore document.
 */
export async function deleteUserAction(uid: string): Promise<{ error?: string }> {
  try {
    const adminApp = initializeFirebaseAdmin();
    const auth = getAuth(adminApp);
    const db = getFirestore(adminApp);

    // 1. Delete user from Firebase Auth
    await auth.deleteUser(uid);

    // 2. Delete user profile from Firestore
    await db.collection('users').doc(uid).delete();

    return {};
    
  } catch (error: any) {
    console.error('Error deleting user with server action:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });
    
    let message = 'An unexpected error occurred while deleting the user.';
    
    if (error.message?.includes('service account') || error.message?.includes('FIREBASE_SERVICE_ACCOUNT_JSON')) {
      message = 'Firebase Admin SDK is not configured. Please set up the service account credentials.';
    } else if (error.code === 'auth/user-not-found') {
      message = 'User not found. They may have already been deleted.';
    } else if (error.message) {
      message = error.message;
    }
    
    return { error: message };
  }
}

/**
 * Updates a user's role in Firestore.
 */
export async function updateUserRoleAction(uid: string, role: Role): Promise<{ error?: string }> {
  try {
    const adminApp = initializeFirebaseAdmin();
    const db = getFirestore(adminApp);

    await db.collection('users').doc(uid).update({ role });

    return {};
    
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return { error: error.message || 'Failed to update user role.' };
  }
}

/**
 * Updates a user's team assignment in Firestore.
 */
export async function updateUserTeamAction(uid: string, teamId: string): Promise<{ error?: string }> {
  try {
    const adminApp = initializeFirebaseAdmin();
    const db = getFirestore(adminApp);

    const finalTeamId = teamId === 'unassigned' || teamId === '' ? '' : teamId;
    await db.collection('users').doc(uid).update({ teamId: finalTeamId });

    return {};
    
  } catch (error: any) {
    console.error('Error updating user team:', error);
    return { error: error.message || 'Failed to update user team.' };
  }
}
