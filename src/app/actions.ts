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
    const description = (formData.get('description') as string) || '';
    const head = (formData.get('head') as string) || '';

    if (!name) {
        return { message: 'Team name is required.', error: true };
    }

    try {
        const { db } = initializeFirebase();
        const teamData: {name: string, description: string, members: string[], head?: string} = {
            name,
            description,
            members: [],
        };

        if (head) {
            teamData.head = head;
            teamData.members.push(head);
        }

        await addDoc(collection(db, 'teams'), teamData);
        return { message: `Team "${name}" created successfully.`, error: false };
    } catch (error) {
        console.error('Create Team Error:', error);
        return { message: 'An unexpected error occurred while creating the team.', error: true };
    }
}
