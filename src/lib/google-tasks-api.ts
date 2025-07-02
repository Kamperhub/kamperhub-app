
import { google, type tasks_v1 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type { GoogleTasksStructure } from '@/ai/flows/personalized-packing-list-flow';

/**
 * Creates and configures an OAuth2 client with the provided refresh token.
 * @param refreshToken - The user's Google OAuth refresh token.
 * @returns An authenticated OAuth2Client instance.
 */
export function getOauth2Client(refreshToken: string): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    // The redirect URI is not strictly needed for token refresh but is good practice to include.
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback` 
  );
  
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}


/**
 * Creates a new task list in Google Tasks and populates it with categories and items.
 * @param oauth2Client - An authenticated OAuth2Client.
 * @param tasksData - The structured data for the task list.
 * @returns The ID of the newly created task list.
 */
export async function createTaskListWithItems(oauth2Client: OAuth2Client, tasksData: GoogleTasksStructure): Promise<string> {
    const tasks = google.tasks({ version: 'v1', auth: oauth2Client });

    // 1. Create the main task list
    const taskListResponse = await tasks.tasklists.insert({
        requestBody: {
            title: tasksData.trip_task_name,
        },
    });

    const taskListId = taskListResponse.data.id;
    if (!taskListId) {
        throw new Error('Failed to create the main task list in Google Tasks.');
    }

    // 2. Sequentially create parent tasks for categories and then their child tasks for items.
    for (const category of tasksData.categories) {
        if (category.items.length === 0) continue; // Skip empty categories

        // Create a parent task for the category
        const parentTaskResponse = await tasks.tasks.insert({
            tasklist: taskListId,
            requestBody: {
                title: category.category_name,
            },
        });

        const parentTaskId = parentTaskResponse.data.id;
        if (!parentTaskId) {
            console.warn(`Could not create parent task for category: ${category.category_name}`);
            continue; // Move to the next category
        }

        // Create child tasks for each item under the parent category task
        for (const item of category.items) {
            await tasks.tasks.insert({
                tasklist: taskListId,
                requestBody: {
                    title: item,
                },
                parent: parentTaskId, // Link item to its category
            });
        }
    }

    return taskListId;
}
