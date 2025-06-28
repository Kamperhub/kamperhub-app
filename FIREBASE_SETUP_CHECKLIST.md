
# Firebase & Backend Setup Checklist

> [!CAUTION]
> **This guide has been updated to use industry-standard environment variables.** This is the most secure and flexible way to manage your app's secret keys.

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

    # App Check Configuration
    NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY="your-recaptcha-enterprise-site-key"
    NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN="your-app-check-debug-token-if-needed"

    # Firebase Server-Side Admin Configuration (for backend functions)
    # This MUST be a single line of JSON wrapped in single quotes.
    GOOGLE_APPLICATION_CREDENTIALS_JSON='PASTE_YOUR_ENTIRE_SERVICE_ACCOUNT_JSON_HERE'

    # Stripe Configuration (for subscriptions)
    STRIPE_SECRET_KEY="sk_test_..."
    STRIPE_WEBHOOK_SECRET="whsec_..."
    STRIPE_PRO_PRICE_ID="price_..."
    ```

---

### Step 2: Populate Your Environment File

Now, find your keys in the Firebase and Stripe dashboards and paste them into the `.env.local` file, replacing the placeholders.

1.  **Firebase Client Keys (`NEXT_PUBLIC_FIREBASE_*`)**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Navigate to **Project settings** (click the gear icon ⚙️).
    *   In the **General** tab, under "Your apps", find your web app.
    *   Look for the "Firebase SDK snippet" and select the **Config** option.
    *   Copy each value (`apiKey`, `authDomain`, `projectId`, etc.) and paste it into the corresponding `NEXT_PUBLIC_FIREBASE_*` variable in your `.env.local` file.

2.  **Firebase Server-Side Key (`GOOGLE_APPLICATION_CREDENTIALS_JSON`)**
    *   Go to **Project settings > Service accounts** in the Firebase Console.
    *   Click "Generate new private key". A JSON file will download.
    *   Open the downloaded file, copy the **entire JSON content**, and paste it inside the single quotes for `GOOGLE_APPLICATION_CREDENTIALS_JSON`. **It must all be on one line.**

---

### Step 3: CRITICAL - Create the Firestore Database

The most common server error is `5 NOT_FOUND`. This error means your environment variables are **correct**, but the Firestore database has not been created in your project yet. You must do this manually.

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and select your project.
2.  In the left-hand navigation under "Build", click on **Firestore Database**.
3.  If you see a large "Create database" button, **you must create one**.
    *   Click **"Create database"**.
    *   Choose **"Start in test mode"** (you can secure it later with `firestore.rules`).
    *   Choose a location (e.g., `us-central` or one near you).
    *   Click **Enable**.

If a database already exists, you can skip this step. This is a one-time setup for your project.

---

### Step 4: CRITICAL - Restart Your Server

After **ANY** change to your `.env.local` file, you **MUST** restart your development server. The server only reads this file when it first starts.

1.  Go to your terminal where the server is running.
2.  Press `Ctrl + C` to stop it.
3.  Run `npm run dev` again to restart it.

---

### Step 5: Verify Your Setup (Troubleshooting)

After restarting your server, you can use the built-in diagnostic tool to confirm everything is set up correctly.

1.  Go to the following URL in your browser:
    `[YOUR_APP_URL]/api/debug/env` (e.g., http://localhost:8081/api/debug/env)
2.  This will show a JSON response indicating the status of each required environment variable.
3.  **Check the `PROJECT_IDS_MATCH` field.** If it says `"NO - MISMATCH DETECTED"`, it means the Project ID in your `GOOGLE_APPLICATION_CREDENTIALS_JSON` does not match your `NEXT_PUBLIC_FIREBASE_PROJECT_ID`. Ensure you generated the service account key from the correct Firebase project.

> **Warning:** Never commit your `.env.local` file to Git. It contains secrets that provide administrative access to your Firebase project.
