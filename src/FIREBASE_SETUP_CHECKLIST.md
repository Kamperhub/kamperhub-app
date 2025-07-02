
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

### Step 2: Find Your Firebase Project (`kamperhub-s4hc2`)

> [!IMPORTANT]
> This is the most critical step. Your Firebase **Project ID** is `kamperhub-s4hc2`. You must get **all keys** from this specific project.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  In the project list, find and select the project named **`kamperhub-s4hc2`**.
3.  Click the gear icon ⚙️ next to **Project Overview** and select **Project settings**.
4.  The **Project ID** listed on this General settings page must be `kamperhub-s4hc2`. This is the value you will use for `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and verify against the service account JSON.

---

### Step 3: Populate Your Environment File

Now, using the correct **`kamperhub-s4hc2` project** from Step 2, find your keys and paste them into the `.env.local` file.

1.  **Firebase Client Keys (`NEXT_PUBLIC_FIREBASE_*`)**
    *   In your `kamperhub-s4hc2` Project settings, under "Your apps", find your web app.
    *   Look for the "Firebase SDK snippet" and select the **Config** option.
    *   Copy each value (`apiKey`, `authDomain`, `projectId`, etc.) and paste it into the corresponding `NEXT_PUBLIC_FIREBASE_*` variable in your `.env.local` file.
    *   **CRITICAL: Verify that `NEXT_PUBLIC_FIREBASE_PROJECT_ID` is set to `kamperhub-s4hc2`**

2.  **Firebase Server-Side Key (`GOOGLE_APPLICATION_CREDENTIALS_JSON`)**
    *   In your `kamperhub-s4hc2` Project settings, go to the **Service accounts** tab.
    *   Click "Generate new private key". A JSON file will download.
    *   Open the downloaded file, copy the **entire JSON content**, and paste it inside the single quotes for `GOOGLE_APPLICATION_CREDENTIALS_JSON`. **It must all be on one line.**
    *   **CRITICAL: The `project_id` field inside this JSON file must also be `kamperhub-s4hc2`.**
    *   **CRITICAL: The `private_key` field in the JSON contains `\n` characters. The app is now designed to handle these correctly, so you should not need to modify them manually.**

3.  **Generative AI Key (`GOOGLE_API_KEY`)**
    *   Go to the [Google Cloud Credentials page](https://console.cloud.google.com/apis/credentials) for your `kamperhub-s4hc2` project.
    *   **CRITICAL:** You must use an API key that does **NOT** have "HTTP referrers" restrictions. Server-side AI features will fail with an `API_KEY_HTTP_REFERRER_BLOCKED` error if you use a key with this restriction type.
    *   A key with **"None"**, **"IP Address"**, or just API service restrictions (e.g., restricted to "Generative Language API") is required.
    *   Looking at your list of keys, the one named `KamperHub V2 key` **will not work** for this purpose. Use a different key like `Generative Language API Key` or `GenAI Key`.
    *   Click "Show key" next to a suitable key. Copy it.
    *   Paste this key into the `GOOGLE_API_KEY` variable in your `.env.local` file.

---

### Step 4: CRITICAL - Verify Your Setup with the Diagnostic Tool

After populating `.env.local`, you **MUST** restart your development server. The server only reads this file when it first starts.

1.  Stop your server (`Ctrl + C`) and restart it (`npm run dev`).
2.  Go to the following URL in your browser:
    `[YOUR_APP_URL]/api/debug/env` (e.g., http://localhost:8083/api/debug/env)
3.  This will show a JSON response indicating the status of each required environment variable. Review it carefully:
    *   **`ADMIN_SDK_INITIALIZATION_STATUS`**: If this shows a `CRITICAL FAILURE`, the error message will tell you exactly what is wrong with your `GOOGLE_APPLICATION_CREDENTIALS_JSON`. Fix the issue in `.env.local` and restart the server.
    *   **`PROJECT_IDS_MATCH`**: If it says `"NO - CRITICAL MISMATCH"`, it means the Project ID in your `GOOGLE_APPLICATION_CREDENTIALS_JSON` does not match your `NEXT_PUBLIC_FIREBASE_PROJECT_ID`. Go back to Step 2 and ensure you generated all keys from the same Firebase project. This is a very common cause of authentication errors.

---

### Step 5: CRITICAL - Verify Firestore Database Exists (with ID `kamperhubv2`)

> [!IMPORTANT]
> The application code is specifically configured to connect to a Firestore database with the **Database ID `kamperhubv2`**. This is different from your **Project ID**.

1.  In the Firebase Console for your `kamperhub-s4hc2` project, go to **Firestore Database** in the "Build" menu.
2.  **If you see a "Create database" button:** You must create one.
    *   Click **"Create database"**.
    *   Choose **"Start in test mode"**.
    *   Choose a location.
    *   When prompted for a **Database ID**, you MUST enter **`kamperhubv2`**. Do not leave it as `(default)`.
    *   Click **Enable**.
3.  **If a database already exists:** Look at the top of the "Data" tab. The database ID is shown there. It **must be `kamperhubv2`**. If it is `(default)`, you must delete the `(default)` database and create a new one with the correct ID `kamperhubv2`.

---

### Step 6: CRITICAL - Verify Service Account Permissions

If the above steps are correct, the final check is to ensure your service account has permission to access Firestore.

1.  Go to the [Google Cloud Console IAM Page](https://console.cloud.google.com/iam-admin/iam) for your project.
2.  Find the service account you are using (its email address is in the `client_email` field of your credentials JSON).
3.  Check its "Role" column. It **must** have a role that allows Firestore access, such as **`Editor`**, **`Firebase Admin`**, or **`Cloud Datastore User`**.
4.  If it doesn't, click the pencil icon to edit its permissions and add one of those roles.

---

### Step 7: FINAL & CRITICAL - Deploy Security Rules

This is the final step and solves most `UNAUTHENTICATED` errors seen on the dashboard.

1.  In the application file explorer on the left, open the newly created `firestore.rules` file and copy its entire contents.
2.  Go to the [Firebase Console](https://console.firebase.google.com/) for your `kamperhub-s4hc2` project.
3.  Navigate to the **Firestore Database** section.
4.  Make sure you have selected the **`kamperhubv2`** database from the dropdown at the top.
5.  Click on the **"Rules"** tab.
6.  Delete any existing text in the rules editor.
7.  Paste the rules you copied from `firestore.rules`.
8.  Click **"Publish"**.

---

### Step 8: Resolve Login Issues (If Necessary)

If after all the above steps you can log in but see an error on the "My Account" page about a missing profile, use this special one-time tool.

1.  Make sure you are logged into the application.
2.  Open the following URL in a new tab:
    `[YOUR_APP_URL]/api/debug/create-admin-user` (e.g., http://localhost:8083/api/debug/create-admin-user)
3.  This will create your admin user profile document in the database the server is connected to. It will either show a success message or a final, specific error.
4.  After running it successfully, go back to the "My Account" page and refresh.

> **Warning:** Never commit your `.env.local` file to Git. It contains secrets that provide administrative access to your Firebase project.
