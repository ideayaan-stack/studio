'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../firebase-admin';
import { Timestamp } from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  teamId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp;
}

/**
 * Send a message to a team chat
 */
export async function sendMessageAction(
  teamId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<{ error?: string }> {
  try {
    const adminApp = initializeFirebaseAdmin();
    const db = getFirestore(adminApp);

    const messageData = {
      teamId,
      senderId,
      senderName,
      text: text.trim(),
      timestamp: Timestamp.now(),
    };

    await db.collection('messages').add(messageData);

    return {};
  } catch (error: any) {
    console.error('Error sending message:', error);
    return { error: error.message || 'Failed to send message' };
  }
}

