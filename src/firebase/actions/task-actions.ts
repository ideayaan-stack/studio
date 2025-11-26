'use server';

import { initializeFirebaseAdmin } from '@/firebase/firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export async function updateTaskStatusAction(taskId: string, status: string, completionReport?: string) {
    try {
        const admin = initializeFirebaseAdmin();
        const db = getFirestore(admin);

        const updateData: any = {
            status,
            updatedAt: Timestamp.now(),
        };

        if (status === 'Completed' && completionReport) {
            updateData.completionReport = completionReport;
        }

        await db.collection('tasks').doc(taskId).update(updateData);

        return { success: true };
    } catch (error: any) {
        console.error('Error updating task status:', error);
        return { error: error.message };
    }
}
