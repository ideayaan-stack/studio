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

        // Send email notification if task is completed
        if (status === 'Completed') {
            try {
                // Fetch task details to get teamId and title
                const taskDoc = await db.collection('tasks').doc(taskId).get();
                const taskData = taskDoc.data();

                if (taskData) {
                    const teamId = taskData.teamId;
                    const volunteerName = taskData.assignee?.name || 'A volunteer';
                    const taskTitle = taskData.title;
                    const completedAt = new Date().toLocaleString();

                    // Find the Head of the team
                    // We need to query users collection where teamId == teamId AND role == 'Head'
                    // Note: Users might have teamIds array now, but let's check primary teamId first or iterate
                    // Since we are in admin context, we can query.

                    // Try to find a Head for this team
                    const headsQuery = await db.collection('users')
                        .where('role', '==', 'Head')
                        .where('teamId', '==', teamId)
                        .get();

                    let headEmail = '';
                    let headName = '';

                    if (!headsQuery.empty) {
                        const headDoc = headsQuery.docs[0];
                        headEmail = headDoc.data().email;
                        headName = headDoc.data().displayName;
                    } else {
                        // If no Head found by primary teamId, try checking teamIds array (if we supported array query here)
                        // Or fallback to Core admins?
                        // For now, let's try to find ANY Head or Core
                        // If no head, maybe don't send? Or send to the assigner if we had that info stored (we don't store assigner email directly usually)
                        console.log('No Head found for team', teamId);
                    }

                    if (headEmail) {
                        const { sendTaskCompletionEmail } = await import('@/lib/email-service');
                        await sendTaskCompletionEmail(
                            headEmail,
                            headName,
                            volunteerName,
                            taskTitle,
                            completionReport || 'No report provided.',
                            completedAt
                        );
                    }
                }
            } catch (emailError) {
                console.error('Error sending completion email:', emailError);
                // Don't fail the action just because email failed
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error updating task status:', error);
        return { error: error.message };
    }
}
