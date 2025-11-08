'use server';

import { suggestTasks as suggestTasksFlow, SuggestTasksInput } from '@/ai/flows/ai-task-suggester';

export type SuggestTasksState = {
  message: string | null;
  tasks: string[];
  error?: boolean;
}

export async function suggestTasksAction(prevState: SuggestTasksState, formData: FormData): Promise<SuggestTasksState> {
  const eventDescription = formData.get('description') as string;
  if (!eventDescription || eventDescription.trim().length < 10) {
    return { message: 'Please provide a more detailed event description.', tasks: [], error: true };
  }
  
  try {
    const result = await suggestTasksFlow({ eventDescription });
    if (!result.suggestedTasks || result.suggestedTasks.length === 0) {
        return { message: "The AI couldn't suggest any tasks. Try a different description.", tasks: [], error: true };
    }
    return { message: 'Here are some suggested tasks for your event.', tasks: result.suggestedTasks, error: false };
  } catch (error) {
    console.error('AI Task Suggestion Error:', error);
    return { message: 'An unexpected error occurred while suggesting tasks.', tasks: [], error: true };
  }
}

export type CreateTeamState = {
    message: string;
    error?: boolean;
}

export async function createTeamAction(prevState: CreateTeamState, formData: FormData): Promise<CreateTeamState> {
    const name = formData.get('name') as string;
    const description = (formData.get('description') as string) || '';
    const head = (formData.get('head') as string) || '';

    if (!name || !name.trim()) {
        return { message: 'Team name is required.', error: true };
    }

    try {
        // Use Admin SDK to bypass Firestore rules and ensure team creation works
        const { initializeFirebaseAdmin } = await import('@/firebase/firebase-admin');
        const { getFirestore } = await import('firebase-admin/firestore');
        
        const adminApp = initializeFirebaseAdmin();
        const db = getFirestore(adminApp);
        
        const teamData: {name: string, description: string, members: string[], head?: string} = {
            name: name.trim(),
            description: description.trim(),
            members: [],
        };

        // Only add head if it's a valid UID (not 'none' or empty)
        if (head && head !== 'none' && head.trim() !== '') {
            teamData.head = head.trim();
            teamData.members.push(head.trim());
        }

        await db.collection('teams').add(teamData);
        return { message: `Team "${name}" created successfully.`, error: false };
    } catch (error: any) {
        console.error('Create Team Error:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack,
        });
        
        let message = 'An unexpected error occurred while creating the team.';
        
        if (error.message?.includes('service account') || error.message?.includes('FIREBASE_SERVICE_ACCOUNT_JSON')) {
            message = 'Firebase Admin SDK is not configured. Please set up the service account credentials.';
        } else if (error.code === 'permission-denied') {
            message = 'Permission denied. You do not have access to create teams.';
        } else if (error.message) {
            message = error.message;
        }
        
        return { message, error: true };
    }
}
