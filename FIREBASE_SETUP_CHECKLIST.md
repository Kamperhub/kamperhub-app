
# Firebase & Backend Setup Checklist

> [!CAUTION]
> **This guide has been updated to use industry-standard environment variables and a safer setup order.** This is the most secure and flexible way to manage your app's secret keys and avoid common startup errors.

---

### Step 1: Create Your Local Environment File

All your secret keys will live in a special file that is NOT committed to version control.

1.  In the main folder of your project (the same level as `package.json`), create a new file named **exactly**:
    `.env.local`

2.  Copy and paste the following block of text into your newly created `.env.local` file. You will fill in the placeholder values in the next steps.

    ```env
    # Firebase Client-Side Configuration (for the browser)
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY_HERE"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"

    # App Check Configuration (for securing backend requests)
    NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY="your-recaptcha-enterprise-site-key"
    NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN="your-app-check-debug-token-if-needed"

    # Firebase Server-Side Admin Configuration (for backend functions)
    # This MUST be a single line of JSON wrapped in single quotes.
    GOOGLE_APPLICATION_CREDENTIALS_JSON='PASTE_YOUR_ENTIRE_SERVICE_ACCOUNT_JSON_HERE'
    
    # Generative AI (Genkit / Gemini) API Key
    # IMPORTANT: This key MUST NOT have "HTTP referrer" restrictions. Use a key with no restrictions or IP address restrictions.
    GOOGLE_API_KEY="YOUR_GENERATIVE_AI_API_KEY_HERE"

    # Stripe Configuration (for subscriptions)
    STRIPE_SECRET_KEY="sk_test_..."
    STRIPE_WEBHOOK_SECRET="whsec_..."
    STRIPE_PRO_PRICE_ID="price_..."
    
    # Google API Configuration (for Google Tasks, etc.)
    GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

    # Google Maps API Key
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY_HERE"
    ```

---

### Step 2: Find the CORRECT Firebase Project

> [!IMPORTANT]
> This is the most critical step. Based on the error messages you are seeing, your app is currently configured for a different project than the one containing your `kamperhubv2` database. You must get **all keys** from the correct project.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  In the project list, find the project that holds your existing `kamperhubv2` database.
3.  Click the gear icon ⚙️ next to **Project Overview** and select **Project settings**.
4.  The **Project ID** is listed on this General settings page (e.g., `kamperhubv2-prod-abcdef` or `kamperhubv2`). **This is the Project ID you must use for all subsequent steps.**

---

### Step 3: Populate Your Environment File

Now, using the **correct `kamperhubv2` project** from Step 2, find your keys and paste them into the `.env.local` file.

1.  **Firebase Client Keys (`NEXT_PUBLIC_FIREBASE_*`)**
    *   In your `kamperhubv2` Project settings, under "Your apps", find your web app.
    *   Look for the "Firebase SDK snippet" and select the **Config** option.
    *   Copy each value (`apiKey`, `authDomain`, `projectId`, etc.) and paste it into the corresponding `NEXT_PUBLIC_FIREBASE_*` variable in your `.env.local` file.
    *   **CRITICAL: Verify that `NEXT_PUBLIC_FIREBASE_PROJECT_ID` matches the `kamperhubv2` Project ID from Step 2.**

2.  **Firebase Server-Side Key (`GOOGLE_APPLICATION_CREDENTIALS_JSON`)**
    *   In your `kamperhubv2` Project settings, go to the **Service accounts** tab.
    *   Click "Generate new private key". A JSON file will download.
    *   Open the downloaded file, copy the **entire JSON content**, and paste it inside the single quotes for `GOOGLE_APPLICATION_CREDENTIALS_JSON`. **It must all be on one line.**
    *   **CRITICAL: The `project_id` field inside this JSON file must also match the `kamperhubv2` Project ID from Step 2.**
    *   **CRITICAL: The `private_key` field in the JSON contains `\n` characters. The app is now designed to handle these correctly, so you should not need to modify them manually.**

3.  **Generative AI Key (`GOOGLE_API_KEY`)**
    *   Go to the [Google Cloud Credentials page](https://console.cloud.google.com/apis/credentials) for your project.
    *   You need an API key that is **NOT** restricted by "HTTP referrers". Requests from the server have no referrer and will be blocked by that restriction type.
    *   From your screenshot, keys like **"Generative Language API Key"** or **"GenAI Key"** are good candidates. The key named **"KamperHub V2 key" is incorrect** for this purpose.
    *   Click "Show key" next to a suitable, unrestricted key. Copy it.
    *   Paste the key into the `GOOGLE_API_KEY` variable in your `.env.local` file.
    *   **If you create a new key**, under "Application restrictions", select **"None"**. Do **NOT** select "HTTP referrers".

---

### Step 4: CRITICAL - Ensure Firestore Database Exists

The most common server error after a correct setup is `5 NOT_FOUND` or `16 UNAUTHENTICATED`. This error means your backend code tried to connect to a Firestore database, but one has not been created in your project yet. You must do this manually.

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and select your project from Step 2.
2.  In the left-hand navigation under "Build", click on **Firestore Database**.
3.  If you see a large "Create database" button, **you must create one**.
    *   Click **"Create database"**.
    *   Choose **"Start in test mode"** (you can secure it later with `firestore.rules`).
    *   Choose a location (e.g., `us-central` or one near you).
    *   Click **Enable**.

If a database already exists (you see "Data", "Rules", "Indexes" tabs), you can skip this step. This is a one-time setup for your project.

---

### Step 5: CRITICAL - Restart Your Server

After **ANY** change to your `.env.local` file, you **MUST** restart your development server. The server only reads this file when it first starts.

1.  Go to your terminal where the server is running.
2.  Press `Ctrl + C` to stop it.
3.  Run `npm run dev` again to restart it.

---

### Step 6: Verify Your Setup (Troubleshooting)

After restarting your server, you can use the built-in diagnostic tool to confirm everything is set up correctly.

1.  Go to the following URL in your browser:
    `[YOUR_APP_URL]/api/debug/env` (e.g., http://localhost:8083/api/debug/env)
2.  This will show a JSON response indicating the status of each required environment variable.
3.  **Check `ADMIN_SDK_INITIALIZATION_STATUS`**. If it shows a `CRITICAL FAILURE`, the error message will tell you exactly what is wrong with your `GOOGLE_APPLICATION_CREDENTIALS_JSON`. Fix the issue in `.env.local` and restart the server.
4.  **Check `PROJECT_IDS_MATCH`**. If it says `"NO - MISMATCH DETECTED"`, it means the Project ID in your `GOOGLE_APPLICATION_CREDENTIALS_JSON` does not match your `NEXT_PUBLIC_FIREBASE_PROJECT_ID`. Go back to Step 2 and ensure you generated all keys from the same Firebase project.
5.  If everything looks good here but you still have errors, proceed to the next step.

---

### Step 7: Resolve Login Issues (If Necessary)

If after all the above steps you can log in but see an error on the "My Account" page about a missing profile, use this special one-time tool.

1.  Make sure you are logged into the application.
2.  Open the following URL in a new tab:
    `[YOUR_APP_URL]/api/debug/create-admin-user` (e.g., http://localhost:8083/api/debug/create-admin-user)
3.  This will create your admin user profile document in the database the server is connected to. It will either show a success message or a final, specific error.
4.  After running it successfully, go back to the "My Account" page and refresh.

> **Warning:** Never commit your `.env.local` file to Git. It contains secrets that provide administrative access to your Firebase project.
