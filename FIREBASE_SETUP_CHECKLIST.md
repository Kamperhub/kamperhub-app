
# Firebase & Backend Setup Checklist

This guide provides a step-by-step checklist to ensure your Firebase project and environment variables are configured correctly.

**Please follow these steps carefully to ensure a stable backend.**

---

### Step 1: Add Your Web API Key

The application needs your unique Web API Key to connect to your Firebase project.

1.  **Find Your API Key**: In the [Firebase Console](https://console.firebase.google.com/), go to **Project settings > General**. Under "Your apps," find your web app and look for the `apiKey` in the "Firebase SDK snippet" section.

2.  **Edit the Code**: Open the file `src/lib/firebase.ts`.

3.  **Add Your Key**: On line 11, replace the placeholder `"YOUR_API_KEY"` with the actual API Key you just found. The line should look like this:

    ```javascript
    apiKey: "aiZasY..._your_actual_key_...w5iA", // This is just an example
    ```

> **This is the most critical step to make the app work.**

---

### Step 2: Configure the Server-Side Key

The server needs a special key to securely access Firebase services like Firestore and Auth.

1.  **Create `.env.local`**: If it doesn't already exist, create a file named `.env.local` in the main folder of your project.

2.  **Generate Private Key**: Go to the [Firebase Console](https://console.firebase.google.com/), click the gear icon next to "Project Overview," and go to **Project settings > Service accounts**. Click "Generate new private key." A JSON file will download.

3.  **Add to `.env.local`**: Open the downloaded JSON file with a text editor. Copy the **entire JSON content**. Paste it into your `.env.local` file like this:

    ```
    GOOGLE_APPLICATION_CREDENTIALS_JSON='PASTE_YOUR_ENTIRE_SERVICE_ACCOUNT_JSON_HERE'
    ```

> **Warning:** Never commit your `.env.local` file to Git. It provides administrative access to your entire Firebase project.

---

### Step 3: Configure App Check & reCAPTCHA (Optional but Recommended)

For enhanced security, App Check verifies that requests to your backend services come from your actual app.

1.  **Find reCAPTCHA Key**: In the [Google Cloud Console](https://console.cloud.google.com/), find **reCAPTCHA Enterprise** and create a site key for your domain.

2.  **Add to `.env.local`**: Add the key to your `.env.local` file:
    ```
    NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY="your-recaptcha-enterprise-site-key"
    ```

---

### Step 4: Final Setup

1.  **Enable Auth Method**: In the Firebase Console, go to **Build > Authentication > Sign-in method** and enable **Email/Password**.
2.  **Create Firestore Database**: Go to **Build > Firestore Database** and create a database in **production mode**.
3.  **Restart Server**: Once your files are updated, stop your development server (`Ctrl+C`) and restart it (`npm run dev`) for all changes to take effect.
