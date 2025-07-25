# KamperHub - A Firebase Studio Project

This is a Next.js starter project for KamperHub, built within Firebase Studio. It's designed for developing and managing a comprehensive caravanning companion application.

---

## **Setup Order: Getting Started**

To get your local development environment running correctly, you **must** complete the setup checklists in the following order. This ensures that services that depend on each other are configured correctly.

1.  **Firebase First:** Start with the `FIREBASE_SETUP_CHECKLIST.md`. This guide configures all the essential backend services, including authentication, database, and core API keys.

2.  **Stripe Second:** Next, complete the `STRIPE_SETUP_CHECKLIST.md`. This configures your environment for testing subscriptions, which relies on settings from the Firebase setup.

Once these two checklists are complete, your local environment will be fully functional. You can then run the application using the three terminal commands below.

---

## Getting Started: Running the Local Development Environment

To run the full application locally with all features enabled (including the web app, AI services, and Stripe subscription testing), you will need to open **three separate terminal windows** and run one command in each.

### **Terminal 1: Run the Main Web Application**

This command starts the Next.js development server, which is the core of your application.

```bash
npm run dev
```
Once started, you can view your application in the preview window. This is the primary command you will use.

---

### **Terminal 2: Run the AI Services (Genkit)**

This command starts the Genkit server, which powers all Generative AI features like the Chatbot and the AI Packing Assistant. **These features will not work without this server running.**

```bash
npm run genkit:dev
```
You can leave this terminal running in the background while you work.

---

### **Terminal 3: Run the Stripe Webhook (for Subscription Testing)**

This command is only needed when you are specifically testing the subscription process. It forwards events from Stripe's test environment to your local application, allowing you to test what happens after a user "subscribes."

Make sure your app is running on the correct port (check the `npm run dev` output and your `.env.local` file).

```bash
# Use the port that matches your NEXT_PUBLIC_APP_URL (e.g., 8083)
stripe listen --forward-to localhost:8083/api/stripe-webhook
```
You must leave this terminal running in the background while testing payments.

---

### **Initial Setup**

Before running the application for the first time, please follow the detailed setup instructions in `FIREBASE_SETUP_CHECKLIST.md` and `STRIPE_SETUP_CHECKLIST.md`. These guides are crucial for correctly configuring your local environment variables in the `.env.local` file.