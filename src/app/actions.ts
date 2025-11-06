'use server';

import { suggestTasks as suggestTasksFlow, SuggestTasksInput } from '@/ai/flows/ai-task-suggester';
import { initializeFirebase } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';

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
    const description = formData.get('description') as string;
    const head = formData.get('head') as string;

    if (!name || !description || !head) {
        return { message: 'All fields are required.', error: true };
    }

    try {
        const { db } = initializeFirebase();
        await addDoc(collection(db, 'teams'), {
            name,
            description,
            head,
            members: [head], // The head is also a member
        });
        return { message: `Team "${name}" created successfully.`, error: false };
    } catch (error) {
        console.error('Create Team Error:', error);
        return { message: 'An unexpected error occurred while creating the team.', error: true };
    }
}
