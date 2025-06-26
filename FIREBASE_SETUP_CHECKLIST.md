# Firebase & Backend Setup Checklist

> [!CAUTION]
> **This guide has been updated to simplify setup and resolve configuration errors.** The primary and recommended way to configure your app's frontend is now by directly editing the `src/lib/firebase.ts` file. This is more reliable in the development environment. Using a `.env.local` file is now a secondary, advanced option.

---

### Step 1: **IMPORTANT** - Configure Your Firebase Client API Keys

This is the most critical step to make the frontend of your application work.

1.  **Open the file:** `src/lib/firebase.ts` in your editor.
2.  **Find the `firebaseConfig` object** near the top of the file. It will look like this:
    ```javascript
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY_HERE",
      authDomain: "your-project.firebaseapp.com",
      // ... and so on
    };
    ```
3.  **Go to the Firebase Console**: Open your project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
4.  Navigate to **Project settings** (click the gear icon ⚙️ next to "Project Overview").
5.  In the **General** tab, under the "Your apps" section, find your web app.
6.  Look for the "Firebase SDK snippet" and select the **Config** option.
7.  **Copy the entire config object** from the Firebase Console and **paste it directly into `src/lib/firebase.ts`**, replacing the placeholder object.

Your code should look like this after pasting (with your actual project values):
```javascript
const firebaseConfig = {
  apiKey: "AIzax...x",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

---

### Step 2: Configure Server-Side and Security Keys (in `.env.local`)

For server-side actions (like AI features) and security (App Check), you still need to use a local environment file.

1.  **Create Your Local Environment File**: In the main folder of your project (the same level as `package.json`), create a new file named exactly:
    `.env.local`

2.  **Add Your Server-Side Key**:
    *   **Generate Private Key**: Go to the [Firebase Console](https://console.firebase.google.com/), click the gear icon ⚙️ > **Project settings > Service accounts**. Click "Generate new private key". A JSON file will download.
    *   **Add to `.env.local`**: Open the downloaded JSON file. Copy the **entire JSON content**. Paste it into your `.env.local` file like this (it must be on one line and surrounded by single quotes):
        ```env
        # Firebase Server-Side Admin Configuration
        GOOGLE_APPLICATION_CREDENTIALS_JSON='PASTE_YOUR_ENTIRE_SERVICE_ACCOUNT_JSON_HERE'
        ```

3.  **Add Your App Check & reCAPTCHA Keys**:
    *   **Find reCAPTCHA Key**: In the [Google Cloud Console](https://console.cloud.google.com/), find **reCAPTCHA Enterprise** and create a site key for your domain.
    *   **Add reCAPTCHA Key to `.env.local`**:
        ```env
        # App Check Configuration
        NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY="your-recaptcha-enterprise-site-key"
        ```
    *   **Add App Check Debug Token (for Local Development)**: When you first run the app locally, a message may appear in your browser's developer console like: `App Check debug token: [some_long_token]...`. Copy this token and add it to your `.env.local` file:
        ```env
        # App Check Debug Token
        NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN="your-app-check-debug-token"
        ```

> **Warning:** Never commit your `.env.local` file to Git. It contains secrets that provide administrative access to your Firebase project.

---

### Step 3: **VERY IMPORTANT** - Restart Your Server

After **ANY** change to your `.env.local` file, you **MUST** restart your development server. The server only reads this file when it first starts.

1.  Go to your terminal where the server is running.
2.  Press `Ctrl + C` to stop it.
3.  Run `npm run dev` again to restart it.

This step is required for your changes to be applied.
