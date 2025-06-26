# Firebase & Backend Setup Checklist

> [!WARNING]
> This guide has been updated to use environment variables (`.env.local`) for all secret keys. This is a more secure and reliable method that prevents your keys from being accidentally overwritten.
> **Please follow these steps carefully.**

---

### Step 1: Create Your Local Environment File

In the main folder of your project, create a new file named exactly:

`.env.local`

This file will securely store all your secret keys and is ignored by version control, so your secrets will never be exposed.

---

### Step 2: Add Firebase Configuration to `.env.local`

1.  **Go to the Firebase Console**: Open your project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
2.  Navigate to **Project settings** (click the gear icon ⚙️ next to "Project Overview").
3.  In the **General** tab, under the "Your apps" section, find your web app.
4.  Look for the "Firebase SDK snippet" and select the **Config** option.
5.  You will see a block of code like this:
    ```javascript
    const firebaseConfig = {
      apiKey: "AIzax...x",
      authDomain: "your-project.firebaseapp.com",
      projectId: "your-project",
      // ... and so on
    };
    ```
6.  Copy the following template into your `.env.local` file and replace the placeholder values with the actual values from the Firebase Console snippet.

    ```env
    # Firebase Client Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY_HERE"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN_HERE"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID_HERE"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET_HERE"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID_HERE"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID_HERE"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID_HERE"
    ```

> **This is the most critical step to make the app work.**

---

### Step 3: Configure the Server-Side Key

The server needs a special key to securely access Firebase services like Firestore and Auth.

1.  **Generate Private Key**: Go to the [Firebase Console](https://console.firebase.google.com/), click the gear icon next to "Project Overview," and go to **Project settings > Service accounts**. Click "Generate new private key." A JSON file will download.

2.  **Add to `.env.local`**: Open the downloaded JSON file with a text editor. Copy the **entire JSON content**. Paste it into your `.env.local` file like this (make sure it's all on one line and surrounded by single quotes):

    ```env
    # Firebase Server-Side Admin Configuration
    GOOGLE_APPLICATION_CREDENTIALS_JSON='PASTE_YOUR_ENTIRE_SERVICE_ACCOUNT_JSON_HERE'
    ```

> **Warning:** Never commit your `.env.local` file to Git. It provides administrative access to your entire Firebase project.

---

### Step 4: Configure App Check for Security

For enhanced security, App Check verifies that requests to your backend come from your actual app. **This is required for the app to function.**

1.  **Find reCAPTCHA Key**: In the [Google Cloud Console](https://console.cloud.google.com/), find **reCAPTCHA Enterprise** and create a site key for your domain.

2.  **Add reCAPTCHA Key to `.env.local`**: Add the key to your `.env.local` file:
    ```env
    # App Check Configuration
    NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY="your-recaptcha-enterprise-site-key"
    ```

3.  **Add App Check Debug Token (for Local Development)**: When you first run the app locally, a message will appear in your browser's developer console like: `App Check debug token: [some_long_token]...`.
    
    Copy this token and add it to your `.env.local` file. This tells Firebase to trust requests from your local machine.
    ```env
    NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN="your-app-check-debug-token"
    ```
    For example:
    ```env
    NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN="5FCAB872-DBB6-4C1E-9394-398F686E37E7"
    ```

---

### Step 5: **VERY IMPORTANT** - Restart Your Server

After **ANY** change to your `.env.local` file (adding Firebase keys, the service account, or the App Check token), you **MUST** restart your development server. The server only reads this file when it first starts.

1.  Go to your terminal where the server is running.
2.  Press `Ctrl + C` to stop it.
3.  Run `npm run dev` again to restart it.

This step is required for your changes to be applied.
