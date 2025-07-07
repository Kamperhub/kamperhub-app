
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

    # Application URL
    # This MUST match the base URL of your application when it's running.
    # In the dev environment, check the terminal: if it says "started server on ... http://localhost:3000",
    # the exposed URL is http://localhost:8083. If it says "http://localhost:3001", the URL is http://localhost:8084.
    # This URL is used by services like Stripe to redirect the user back to your app.
    NEXT_PUBLIC_APP_URL="http://localhost:8083"

    # Stripe Configuration (for subscriptions)
    NEXT_PUBLIC_STRIPE_PAYMENT_LINK=https://buy.stripe.com/...
    STRIPE_SECRET_KEY="sk_test_..."
    STRIPE_WEBHOOK_SECRET="whsec_..."
    
    # Google API Configuration (for Google Tasks, etc.)
    GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

    # Google Maps API Key
    # NOTE: It's often best practice to use the same key for Maps and AI to simplify management,
    # as long as that key does not have HTTP referrer restrictions.
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

3.  **Google API Keys (`GOOGLE_API_KEY` & `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)**
    *   Go to the [Google Cloud Credentials page](https://console.cloud.google.com/apis/credentials) for your `kamperhub-s4hc2` project.
    *   **CRITICAL - Understand Key Restrictions:**
        *   **HTTP referrer restrictions** are for client-side browser use only. They will cause an `API_KEY_HTTP_REFERRER_BLOCKED` error for server-side calls like AI and Directions.
        *   **IP address restrictions** are for secure server-side use. This is the best practice for production.
        *   **No restrictions** keys work on both client and server, which is convenient for local development but less secure for production.
    *   **ACTION:**
        *   Create or identify a key that **DOES NOT** have HTTP referrer restrictions. A key with "None" or "IP Address" restrictions is required.
        *   Paste this key into both the `GOOGLE_API_KEY` and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` variables in your `.env.local` file. Using the same secure key for both simplifies management.

---

### Step 3.5: CRITICAL - Verify Google Cloud APIs Are Enabled

Many app features depend on Google services. An incorrect API key or disabled services will cause features to fail.

1.  **Go to the [Google Cloud APIs & Services Dashboard](https://console.cloud.google.com/apis/dashboard) for your `kamperhub-s4hc2` project.**

2.  Click **"Enable APIs and Services"** at the top. You must search for and enable the following **four APIs** one by one if they are not already enabled.

3.  **Search for and Enable "Maps JavaScript API"**:
    *   **Required for:** Displaying the interactive map in the Trip Planner.
    *   If it's not enabled, click **"Enable"**.

4.  **Search for and Enable "Places API"**:
    *   **Required for:** The address autocomplete search boxes in the Trip Planner.
    *   If it's not enabled, click **"Enable"**.

5.  **Search for and Enable "Routes API"**:
    *   **Required for:** Calculating driving directions, distance, duration, and height-aware routing.
    *   **CRITICAL:** If this is not enabled, the Trip Planner will fail with an error. Click **"Enable"**.
    > [!WARNING]
    > **"Routes API" vs. "Directions API"**
    > You must enable the **Routes API**. The older **Directions API** is **not** sufficient and will cause errors.

6.  **Search for and Enable "Generative Language API"**:
    *   **Required for:** All AI features, including the Chatbot and the Packing Assistant.
    *   If it's not enabled, click **"Enable"**.

7.  **Verify your API Key Permissions**:
    *   Go back to the [Credentials page](https://console.cloud.google.com/apis/credentials).
    *   Find the key you are using for `GOOGLE_API_KEY`.
    *   Click its name to see its details.
    *   Under **"API restrictions"**, ensure it has permission to use all four of the APIs listed above. If it's unrestricted ("Don't restrict key"), that is fine for local development.

---

### Step 4: CRITICAL - Verify Your Local Development Server Setup

After populating `.env.local`, you **MUST** restart your local development server. The server only reads this file when it first starts.

> [!NOTE]
> **Production Note:** This manual restart is only for your local `npm run dev` server. In a live production environment (like Firebase App Hosting), you will set these variables in the hosting configuration, and the service will automatically handle applying them—no manual restarts needed.

1.  Stop your server (`Ctrl + C`) and restart it (`npm run dev`).
2.  Check the terminal where your server is running. You should see messages like:
    *   `[Firebase Admin] SDK initialized successfully for project: kamperhub-s4hc2`
    *   `[Firebase Client] Successfully initialized for project: kamperhub-s4hc2...`
3.  If you see an error like `FATAL: The GOOGLE_APPLICATION_CREDENTIALS_JSON string... is not valid JSON`, it means there's a copy-paste error in your `.env.local` file. Recopy the service account JSON carefully.
4.  **If the project IDs in the two success messages above do not match, or if you see an error like "FATAL: Project ID Mismatch", it means your client keys and server keys are from different projects. This is a critical error that will cause authentication to fail. Go back to Step 2 and ensure all keys come from the same project.**

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

### Step 8: Create Your First User Account (One-Time Only)

> [!NOTE]
> This is a one-time step to create your initial user. Once the account exists, you will simply **log in** for future sessions. You only need to sign up again if you delete the user from Firebase.

The debug tool for creating users has been removed for security. The application now handles this automatically during sign-up.

1.  Navigate to the application's sign-up page.
2.  Create your account. If you use the admin email (`info@kamperhub.com`), your account will automatically be granted admin privileges.
3.  After signing up, you should be logged in and can access all features.

> **Warning:** Never commit your `.env.local` file to Git. It contains secrets that provide administrative access to your Firebase project.
