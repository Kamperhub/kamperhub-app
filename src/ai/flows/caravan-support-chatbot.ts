'use server';
/**
 * @fileOverview A caravan support chatbot AI agent.
 *
 * - caravanSupportChatbot - A function that handles the chatbot interaction.
 * - CaravanSupportChatbotInput - The input type for the caravanSupportChatbot function.
 * - CaravanSupportChatbotOutput - The return type for the caravanSupportChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { staticCaravanningArticles, type AiGeneratedArticle } from '@/types/learn';
import { getFirebaseAdmin } from '@/lib/server/firebase-admin';
import type { LoggedTrip } from '@/types/tripplanner';
import type { Expense } from '@/types/expense';
import type { StoredVehicle } from '@/types/vehicle';
import type { StoredCaravan } from '@/types/caravan';
import type { BookingEntry } from '@/types/booking';


const CaravanSupportChatbotInputSchema = z.object({
  question: z.string().describe('The question asked by the user about caravanning.'),
});
export type CaravanSupportChatbotInput = z.infer<typeof CaravanSupportChatbotInputSchema>;

const CaravanSupportChatbotOutputSchema = z.object({
  answer: z.string().describe('The answer to the user question.'),
  youtubeLink: z.string().optional().nullable().describe('An optional YouTube link that provides more information about the answer.'),
  relatedArticleTitle: z.string().optional().nullable().describe('The title of a related article from the Support Center, if applicable.')
});
export type CaravanSupportChatbotOutput = z.infer<typeof CaravanSupportChatbotOutputSchema>;

// Simple FAQ knowledge base
const faqData = [
  { 
    keywords: ["tyre pressure", "tire pressure", "tyres", "tires"], 
    answer: "Caravan tyre pressures are crucial for safety and tyre life. They typically range from 40-65 PSI, but always check the caravan's tyre placard or the tyre manufacturer's specific recommendations for your model and load. Tow vehicle tyre pressures should also be adjusted as per its placard, especially when towing." 
  },
  { 
    keywords: ["awning setup", "set up awning", "deploy awning"], 
    answer: "To set up your caravan awning: 1. Unlock any travel locks. 2. Use the awning rod to hook the pull strap and roll the awning out. 3. Extend the support legs and position them vertically or against the caravan wall. 4. Secure the legs. 5. Tension the fabric using the rafters or tensioning knobs. Ensure it's well-secured, especially if wind is expected." 
  },
  { 
    keywords: ["battery flat", "battery dead", "charge battery"], 
    answer: "If your caravan battery is flat: 1. Check if it's an issue with the charger or a blown fuse. 2. Try charging it using your tow vehicle (if set up for it), a 240V smart charger when connected to mains power, or a solar panel. 3. If it's an old battery, it might need replacement. Deep cycle batteries can be damaged if left flat for too long." 
  },
  {
    keywords: ["toilet cassette", "empty toilet"],
    answer: "To empty your caravan toilet cassette: 1. Ensure the blade valve is closed. 2. Remove the cassette from its external hatch. 3. Transport it to an approved dump point. 4. Unscrew the spout, point it downwards into the dump point, and press the air vent button to empty smoothly. 5. Rinse the cassette with water. 6. Add the appropriate toilet chemical before reinserting."
  },
  {
    keywords: ["sway control", "caravan swaying"],
    answer: "Caravan sway can be dangerous. To prevent it: 1. Ensure correct weight distribution (approx 10-15% of caravan ATM on the towball). 2. Don't overload the rear of the caravan. 3. Check tyre pressures. 4. Drive at appropriate speeds for conditions. 5. Consider using a weight distribution hitch and/or an electronic sway control system. If sway occurs, gently ease off the accelerator and apply the caravan's electric brakes manually (if fitted with a controller that allows this) – do not slam on the vehicle brakes or turn the steering wheel sharply."
  }
];

const getFaqAnswer = ai.defineTool(
  {
    name: 'getFaqAnswer',
    description: 'Retrieves a pre-defined answer to a frequently asked caravanning question from the local knowledge base. Use this tool first to check for existing answers.',
    inputSchema: z.object({
      topicKeywords: z.string().describe('One or more keywords from the user question related to the topic they are asking about (e.g., "tyre pressure", "awning setup").'),
    }),
    outputSchema: z.string().optional().describe('The answer from the FAQ if a match is found, otherwise undefined.'),
  },
  async ({ topicKeywords }) => {
    const lowerTopicKeywords = topicKeywords.toLowerCase().split(/\s+/).filter(kw => kw.length > 2); // Split into words
    for (const faq of faqData) {
      if (faq.keywords.some(kw => lowerTopicKeywords.some(userKw => kw.toLowerCase().includes(userKw)))) {
        return faq.answer;
      }
    }
    return undefined; // No specific FAQ found
  }
);

const getArticleInfoTool = ai.defineTool(
  {
    name: 'getArticleInfoTool',
    description: 'Searches the static article database for relevant information based on user keywords. Use this if no direct FAQ answer is found.',
    inputSchema: z.object({
      searchKeywords: z.string().describe('Keywords from the user question to find a relevant article (e.g., "parking caravan", "battery management").'),
    }),
    outputSchema: z.object({
      title: z.string(),
      summary: z.string(), // The introduction of the article
      topic: z.string(),
    }).optional().describe('The title, introduction (as summary), and topic of a relevant article if found, otherwise undefined.'),
  },
  async ({ searchKeywords }) => {
    const lowerKeywords = searchKeywords.toLowerCase().split(/\s+/).filter(kw => kw.length > 2); // Split into words, ignore small words
    if (lowerKeywords.length === 0) return undefined;

    for (const article of staticCaravanningArticles) {
      const searchableText = `${article.topic.toLowerCase()} ${article.title.toLowerCase()} ${article.introduction.toLowerCase()}`;
      if (lowerKeywords.every(kw => searchableText.includes(kw))) { // All keywords must be present
        return {
          title: article.title,
          summary: article.introduction,
          topic: article.topic,
        };
      }
    }
    // Fallback: check if any keyword matches
     for (const article of staticCaravanningArticles) {
      const searchableText = `${article.topic.toLowerCase()} ${article.title.toLowerCase()} ${article.introduction.toLowerCase()}`;
      if (lowerKeywords.some(kw => searchableText.includes(kw))) {
        return {
          title: article.title,
          summary: article.introduction,
          topic: article.topic,
        };
      }
    }
    return undefined;
  }
);


const findYoutubeLink = ai.defineTool(
  {
    name: 'findYoutubeLink',
    description: 'Finds a relevant YouTube video link based on the user question topic. Use this if a visual explanation would be helpful.',
    inputSchema: z.object({
      searchQuery: z.string().describe('A concise search query based on the user question to find a relevant YouTube video.'),
    }),
    outputSchema: z.string().optional(),
  },
  async (input) => {
    // This is a placeholder implementation.
    if (input.searchQuery.toLowerCase().includes('weight limits')) {
      return 'https://www.youtube.com/watch?v=M7lc1UVf-VE';
    }
    if (input.searchQuery.toLowerCase().includes('awning')) {
        return 'https://www.youtube.com/watch?v=L_jWHffIx5E';
    }
    return undefined;
  }
);

const listUserTripsTool = ai.defineTool(
  {
    name: 'listUserTrips',
    description: "Lists all of the user's available trips.",
    inputSchema: z.object({
      userId: z.string().describe("The user's unique ID."),
    }),
    outputSchema: z.array(z.string()).describe("A list of trip names.").nullable(),
  },
  async ({ userId }) => {
    const { firestore, error } = getFirebaseAdmin();
    if (error || !firestore) return null;
    try {
      const tripsRef = firestore.collection('users').doc(userId).collection('trips');
      const snapshot = await tripsRef.get();
      if (snapshot.empty) return null;

      const tripNames = snapshot.docs
        .map(doc => doc.data()?.name)
        .filter((name): name is string => typeof name === 'string');
      
      return tripNames.length > 0 ? tripNames : null;
    } catch (e: any) {
        console.error('Critical error in listUserTripsTool:', e);
        return null;
    }
  }
);

const listUserVehiclesTool = ai.defineTool(
  {
    name: 'listUserVehicles',
    description: "Lists all of the user's saved vehicles.",
    inputSchema: z.object({
      userId: z.string().describe("The user's unique ID."),
    }),
    outputSchema: z.array(z.string()).describe("A list of vehicle names (e.g., '2022 Ford Ranger').").nullable(),
  },
  async ({ userId }) => {
    const { firestore, error } = getFirebaseAdmin();
    if (error || !firestore) return null;
    try {
      const vehiclesRef = firestore.collection('users').doc(userId).collection('vehicles');
      const snapshot = await vehiclesRef.get();
      if (snapshot.empty) return null;

      const vehicleNames = snapshot.docs
        .map(doc => {
            const data = doc.data() as StoredVehicle;
            return data.year && data.make && data.model ? `${data.year} ${data.make} ${data.model}` : null;
        })
        .filter((name): name is string => name !== null);
      
      return vehicleNames.length > 0 ? vehicleNames : null;
    } catch (e: any) {
        console.error('Critical error in listUserVehiclesTool:', e);
        return null;
    }
  }
);


const findUserTripTool = ai.defineTool(
  {
    name: 'findUserTrip',
    description: "Finds a user's trip by its name to get its ID and budget categories. Use this before trying to add an expense.",
    inputSchema: z.object({
      userId: z.string().describe("The user's unique ID."),
      tripName: z.string().describe('A partial or full name of the trip to search for.'),
    }),
    outputSchema: z.object({
      tripId: z.string(),
      tripName: z.string(),
      budgetCategories: z.array(z.string()),
    }).nullable(),
  },
  async ({ userId, tripName }) => {
    const { firestore, error } = getFirebaseAdmin();
    if (error || !firestore) return null;
    try {
      const tripsRef = firestore.collection('users').doc(userId).collection('trips');
      const snapshot = await tripsRef.get();
      if (snapshot.empty) {
        return null;
      }

      const trips: LoggedTrip[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data && typeof data.name === 'string' && typeof data.id === 'string') {
          trips.push(data as LoggedTrip);
        }
      });
      
      const foundTrip = trips.find(trip => trip.name.toLowerCase().includes(tripName.toLowerCase()));

      if (foundTrip) {
        return {
          tripId: foundTrip.id,
          tripName: foundTrip.name,
          budgetCategories: foundTrip.budget?.map(cat => cat.name) || [],
        };
      }
      return null;
    } catch (e: any) {
        console.error('Critical error in findUserTripTool:', e);
        return null; 
    }
  }
);

const addExpenseToTripTool = ai.defineTool(
  {
    name: 'addExpenseToTrip',
    description: 'Adds an expense record to a specific trip for a user.',
    inputSchema: z.object({
      userId: z.string().describe("The user's unique ID."),
      tripId: z.string().describe("The unique ID of the trip, obtained from findUserTrip."),
      amount: z.number().describe("The monetary value of the expense."),
      categoryName: z.string().describe("The name of the budget category for this expense."),
      description: z.string().describe("A brief description of the expense (e.g., 'Diesel fill-up', 'Groceries at Coles')."),
      expenseDate: z.string().datetime().describe("The date of the expense in ISO 8601 format."),
    }),
    outputSchema: z.string().describe("A confirmation message indicating success or failure."),
  },
  async ({ userId, tripId, amount, categoryName, description, expenseDate }) => {
    const { firestore, error } = getFirebaseAdmin();
    if (error || !firestore) return 'Error: Database service is not available.';
    
    const tripRef = firestore.collection('users').doc(userId).collection('trips').doc(tripId);
    
    try {
      const doc = await tripRef.get();
      if (!doc.exists) {
        return `Error: Trip with ID ${tripId} not found.`;
      }
      const trip = doc.data() as LoggedTrip;

      const budgetCategory = trip.budget?.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
      if (!budgetCategory) {
        const availableCategories = trip.budget?.map(c => c.name).join(', ') || 'none';
        return `Error: Budget category "${categoryName}" not found. Please choose from: ${availableCategories}.`;
      }

      const newExpense: Omit<Expense, 'tripId'> = {
        id: Date.now().toString(),
        categoryId: budgetCategory.id,
        amount,
        description,
        date: expenseDate,
        timestamp: new Date().toISOString(),
      };

      const updatedExpenses = [...(trip.expenses || []), newExpense];
      
      await tripRef.update({ expenses: updatedExpenses });

      return `Successfully added expense "${description}" for $${amount.toFixed(2)} to the trip "${trip.name}".`;

    } catch (e: any) {
      console.error("Error adding expense to trip:", e);
      return `An unexpected error occurred while adding the expense: ${e.message}`;
    }
  }
);

const getTripExpensesTool = ai.defineTool(
  {
    name: 'getTripExpenses',
    description: "Retrieves all expenses for a specific trip, optionally filtered by category. Use this to answer questions about spending.",
    inputSchema: z.object({
      userId: z.string().describe("The user's unique ID."),
      tripId: z.string().describe("The unique ID of the trip, obtained from findUserTrip."),
      categoryName: z.string().optional().describe("An optional category name to filter expenses by (e.g., 'Fuel', 'Accommodation')."),
    }),
    outputSchema: z.object({
      totalSpend: z.number(),
      expenses: z.array(z.object({
        description: z.string(),
        amount: z.number(),
        category: z.string(),
        date: z.string(),
      })),
    }).nullable(),
  },
  async ({ userId, tripId, categoryName }) => {
    const { firestore, error } = getFirebaseAdmin();
    if (error || !firestore) return null;

    try {
      const tripRef = firestore.collection('users').doc(userId).collection('trips').doc(tripId);
      const tripDoc = await tripRef.get();

      if (!tripDoc.exists) {
        return null;
      }

      const trip = tripDoc.data() as LoggedTrip;
      let expenses = trip.expenses || [];

      const categoryMap = new Map(trip.budget?.map(cat => [cat.id, cat.name]) || []);

      if (categoryName) {
        const categoryId = trip.budget?.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase())?.id;
        if (categoryId) {
          expenses = expenses.filter(exp => exp.categoryId === categoryId);
        } else {
          // If category doesn't exist, return empty results for that category.
          return { totalSpend: 0, expenses: [] };
        }
      }
      
      const totalSpend = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      const formattedExpenses = expenses.map(exp => ({
        description: exp.description,
        amount: exp.amount,
        category: categoryMap.get(exp.categoryId) || 'Unknown',
        date: exp.date,
      }));

      return { totalSpend, expenses: formattedExpenses };
    } catch (e: any) {
      console.error('Critical error in getTripExpensesTool:', e);
      return null;
    }
  }
);

const addAmountToBudgetCategoryTool = ai.defineTool(
  {
    name: 'addAmountToBudgetCategory',
    description: 'Adds a specified amount to a budget category for a trip. If the category does not exist, it will be created.',
    inputSchema: z.object({
      userId: z.string().describe("The user's unique ID."),
      tripId: z.string().describe("The unique ID of the trip, obtained from findUserTrip."),
      categoryName: z.string().describe("The name of the budget category to add the amount to (e.g., 'Food', 'Activities')."),
      amountToAdd: z.number().positive().describe("The positive amount to add to the budget category."),
    }),
    outputSchema: z.string().describe("A confirmation message indicating success or failure."),
  },
  async ({ userId, tripId, categoryName, amountToAdd }) => {
    const { firestore, error } = getFirebaseAdmin();
    if (error || !firestore) return 'Error: Database service is not available.';
    
    const tripRef = firestore.collection('users').doc(userId).collection('trips').doc(tripId);
    
    try {
      await firestore.runTransaction(async (transaction) => {
        const doc = await transaction.get(tripRef);
        if (!doc.exists) {
          throw new Error(`Trip with ID ${tripId} not found.`);
        }
        const trip = doc.data() as LoggedTrip;
        const budget = trip.budget || [];

        const categoryIndex = budget.findIndex(cat => cat.name.toLowerCase() === categoryName.toLowerCase());

        if (categoryIndex > -1) {
          // Category exists, update it
          budget[categoryIndex].budgetedAmount += amountToAdd;
        } else {
          // Category doesn't exist, create it
          budget.push({
            id: `budget_${categoryName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
            name: categoryName,
            budgetedAmount: amountToAdd,
          });
        }
        
        transaction.update(tripRef, { budget });
      });

      return `Successfully added $${amountToAdd.toFixed(2)} to the "${categoryName}" budget for the trip.`;

    } catch (e: any) {
      console.error("Error adding to budget category:", e);
      return `An unexpected error occurred while updating the budget: ${e.message}`;
    }
  }
);

const getVehicleDetailsTool = ai.defineTool(
  {
    name: 'getVehicleDetails',
    description: 'Retrieves all specifications for a specific vehicle.',
    inputSchema: z.object({
      userId: z.string().describe("The user's unique ID."),
      vehicleName: z.string().describe("The name of the vehicle to search for (e.g., 'Ford Ranger')."),
    }),
    outputSchema: z.any().nullable().describe("An object containing the vehicle's details or null if not found."),
  },
  async ({ userId, vehicleName }) => {
    const { firestore, error } = getFirebaseAdmin();
    if (error || !firestore) return null;
    try {
      const vehiclesRef = firestore.collection('users').doc(userId).collection('vehicles');
      const snapshot = await vehiclesRef.get();
      if (snapshot.empty) return null;

      const foundVehicle = snapshot.docs
        .map(doc => doc.data() as StoredVehicle)
        .find(vehicle => `${vehicle.year} ${vehicle.make} ${vehicle.model}`.toLowerCase().includes(vehicleName.toLowerCase()));

      return foundVehicle || null;
    } catch (e: any) {
        console.error('Critical error in getVehicleDetailsTool:', e);
        return null;
    }
  }
);

const getCaravanDetailsTool = ai.defineTool(
  {
    name: 'getCaravanDetails',
    description: "Retrieves all specifications for a specific caravan.",
    inputSchema: z.object({
      userId: z.string().describe("The user's unique ID."),
      caravanName: z.string().describe("The name of the caravan to search for (e.g., 'Jayco Starcraft')."),
    }),
    outputSchema: z.any().nullable().describe("An object containing the caravan's details or null if not found."),
  },
  async ({ userId, caravanName }) => {
    const { firestore, error } = getFirebaseAdmin();
    if (error || !firestore) return null;
    try {
      const caravansRef = firestore.collection('users').doc(userId).collection('caravans');
      const snapshot = await caravansRef.get();
      if (snapshot.empty) return null;

      const foundCaravan = snapshot.docs
        .map(doc => doc.data() as StoredCaravan)
        .find(caravan => `${caravan.year} ${caravan.make} ${caravan.model}`.toLowerCase().includes(caravanName.toLowerCase()));
      
      return foundCaravan || null;
    } catch (e: any) {
        console.error('Critical error in getCaravanDetailsTool:', e);
        return null;
    }
  }
);

const listUserBookingsTool = ai.defineTool(
  {
    name: 'listUserBookings',
    description: "Lists all of the user's saved accommodation bookings.",
    inputSchema: z.object({
      userId: z.string().describe("The user's unique ID."),
    }),
    outputSchema: z.array(z.object({
        siteName: z.string(),
        checkInDate: z.string(),
        checkOutDate: z.string(),
        confirmationNumber: z.string().optional().nullable(),
    })).nullable().describe("A list of booking details or null if none exist."),
  },
  async ({ userId }) => {
    const { firestore, error } = getFirebaseAdmin();
    if (error || !firestore) return null;
    try {
      const bookingsRef = firestore.collection('users').doc(userId).collection('bookings');
      const snapshot = await bookingsRef.get();
      if (snapshot.empty) return null;

      const bookings = snapshot.docs
        .map(doc => {
            const data = doc.data() as BookingEntry;
            return {
                siteName: data.siteName,
                checkInDate: data.checkInDate,
                checkOutDate: data.checkOutDate,
                confirmationNumber: data.confirmationNumber
            };
        });
      
      return bookings.length > 0 ? bookings : null;
    } catch (e: any) {
        console.error('Critical error in listUserBookingsTool:', e);
        return null;
    }
  }
);

export async function caravanSupportChatbot(
  input: CaravanSupportChatbotInput,
  userId: string,
): Promise<CaravanSupportChatbotOutput> {
  return caravanSupportChatbotFlow({ ...input, userId });
}

const CaravanSupportChatbotFlowInputSchema = CaravanSupportChatbotInputSchema.extend({
  userId: z.string(),
});

const caravanSupportChatbotFlow = ai.defineFlow(
  {
    name: 'caravanSupportChatbotFlow',
    inputSchema: CaravanSupportChatbotFlowInputSchema,
    outputSchema: CaravanSupportChatbotOutputSchema,
  },
  async (input): Promise<CaravanSupportChatbotOutput> => {
    try {
      const prompt = ai.definePrompt({
        name: 'caravanSupportChatbotPrompt',
        input: {schema: CaravanSupportChatbotFlowInputSchema },
        output: {schema: CaravanSupportChatbotOutputSchema},
        tools: [getFaqAnswer, getArticleInfoTool, findYoutubeLink, listUserTripsTool, findUserTripTool, addExpenseToTripTool, getTripExpensesTool, addAmountToBudgetCategoryTool, listUserVehiclesTool, getVehicleDetailsTool, getCaravanDetailsTool, listUserBookingsTool],
        prompt: `You are a friendly and helpful caravan support chatbot for KamperHub. Your goal is to provide useful answers and perform actions for the user based on their data.

      USER ID: {{{userId}}}

      **Response Hierarchy & Logic:**
      1.  **Action Intent (Add/Update):** First, check if the user wants to perform an action (e.g., "add expense", "increase budget"). If so, prioritize completing that action using the data interaction tools.
      2.  **Query Intent (Get/List/View):** If the user is asking a question about their data (e.g., "what trips do I have?", "what is the GVM of my Ford Ranger?", "list my bookings"), use the appropriate listing or details-retrieval tool.
          - If a specific item (like "Ford Ranger") is mentioned, use the corresponding 'get...Details' tool.
          - If the request is general (like "list my vehicles"), use the 'list...' tool.
          - After providing the data, do not suggest articles or YouTube videos unless the user asks a follow-up question.
      3.  **General Question (Non-User Data):** If the question is not about the user's data (e.g., "how to fix a flat tyre?"), follow this order:
          a.  Use 'getFaqAnswer'.
          b.  If no FAQ, use 'getArticleInfoTool'.
          c.  If still no answer, use your general knowledge.
          d.  Optionally, use 'findYoutubeLink' if a video would be helpful.

      **Data Interaction Instructions:**

      - **Finding Items:** For any action or query about a specific vehicle, caravan, or trip, you MUST find it by name first using the appropriate tool (\`getVehicleDetailsTool\`, \`getCaravanDetailsTool\`, \`findUserTripTool\`). If no specific item is mentioned, ask the user to clarify. If a tool returns null, inform the user you could not find the item.

      - **Displaying Details:** When a user asks for details of a vehicle or caravan, use the 'get...Details' tool. If data is returned, present all the key-value pairs from the tool's output in a clean, readable, itemized format (e.g., using bullet points or a list).

      - **Budget & Expenses:**
          - To **add/modify budget**, you need the trip ID, amount, and category name. If any are missing, ask for them. Use 'addAmountToBudgetCategoryTool'.
          - To **add an expense**, you need trip ID, amount, description, and category. Suggest available categories. Assume today's date unless specified. Use 'addExpenseToTripTool'.
          - To **get expenses**, use 'getTripExpenses' with the trip ID and optional category. Summarize the results.

      Strictly follow these hierarchies. Your primary role is now a personal data assistant for the user's KamperHub data.

      User's Question: {{{question}}}
      `,
      });

      const {output} = await prompt(input);
      if (!output) {
        throw new Error('The AI returned an empty or invalid response.');
      }
      return output;
    } catch (error: any) {
      console.error("Error in caravanSupportChatbotFlow:", error);
      let answer = `I'm sorry, I ran into a problem. Here is the technical error: ${error.message || 'An unknown error occurred.'}`;
      if (error.message && error.message.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
        answer = 'AI Service Error: The GOOGLE_API_KEY has "HTTP referrer" restrictions, which is not allowed for server-to-server AI calls. Use a key with "None" or "IP Address" restrictions as explained in the setup guide.';
      }
      return {
        answer: answer,
        youtubeLink: null,
        relatedArticleTitle: null,
      };
    }
  }
);
