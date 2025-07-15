
# Firebase & Backend Setup Checklist

> [!CAUTION]
> **This guide has been updated to use industry-standard environment variables and a safer setup order.** This is the most secure and flexible way to manage your app's secret keys and avoid common startup errors.

---

### Step 1: Create Your Local Environment File

All your secret keys will live in a special file that is **NEVER** committed to version control.

> [!WARNING]
> **CRITICAL SECURITY WARNING:** Your `.env.local` file contains highly sensitive secret keys. **NEVER commit this file to GitHub or any other public repository.** The project is now configured with a `.gitignore` file to help prevent this, but you are ultimately responsible for keeping your secrets safe.

1.  In the main folder of your project (the same level as `package.json`), create a new file named **exactly**:
    `.env.local`

2.  Copy and paste the following block of text into your newly created `.env.local` file. You will fill in the placeholder values in the next steps.

    ```env
    # Firebase Client-Side Configuration (for the browser)
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY_HERE"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"

    # App Check Configuration (for securing backend requests)
    # The RECAPTCHA key is for production/staging. The DEBUG token is ONLY for local development.
    # To get a debug token, run the app and look for a message in the browser console.
    NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY="your-recaptcha-enterprise-site-key"
    NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN="your-app-check-debug-token-if-needed"

    # Firebase Server-Side Admin Configuration (for backend functions)
    # This MUST be a single line of JSON wrapped in single quotes.
    GOOGLE_APPLICATION_CREDENTIALS_JSON='PASTE_YOUR_ENTIRE_SERVICE_ACCOUNT_JSON_HERE'
    
    # Generative AI (Genkit / Gemini) & Server-Side Routes API Key
    # Use your secure "Kamperhub Server Key" for this value. It has no "HTTP referrer" restrictions.
    GOOGLE_API_KEY="YOUR_SERVER_API_KEY_HERE"

    # Application URL and Environment
    # NEXT_PUBLIC_APP_URL MUST match the exposed URL of your application when it's running (e.g., http://localhost:8083)
    # This is used by services like Stripe and Google OAuth to redirect the user back to your app.
    # NEXT_PUBLIC_APP_ENV MUST be "development" for local testing. It controls features like the environment banner.
    NEXT_PUBLIC_APP_URL="http://localhost:8083"
    NEXT_PUBLIC_APP_ENV="development"

    # Stripe Configuration (for subscriptions)
    NEXT_PUBLIC_STRIPE_PAYMENT_LINK=https://buy.stripe.com/...
    STRIPE_SECRET_KEY="sk_test_..."
    STRIPE_WEBHOOK_SECRET="whsec_..."
    
    # Google API Configuration (for Google Tasks, etc. - Uses OAuth, not an API key)
    GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

    # Google Maps & Places API Key (for the browser)
    # Use your "Kamperhub Browser Key" for this value. It should have "HTTP referrer" restrictions.
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_BROWSER_API_KEY_HERE"
    ```

---

### Step 2: Find Your Firebase Project (Est. 2 mins)

> [!IMPORTANT]
> This is the most critical step. Your Firebase **Project ID** is `kamperhub-s4hc2`. You must get **all keys** from this specific project.

1.  Go to the [Firebase Console](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/overview).
2.  Click the gear icon ⚙️ next to **Project Overview** and select **Project settings**.
3.  The **Project ID** listed on this General settings page must be `kamperhub-s4hc2`. This is the value you will use for `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.

> [!NOTE]
> **Project ID vs. API Key:** The **Project ID** (`kamperhub-s4hc2`) identifies your entire project. The **API Key** (which you'll get in the next step) is a long string of characters that authorizes your app to *use* the project's services. They are two different, essential values.

---

### Step 3: Populate Your Environment File (Est. 15-20 mins)

Now, using the correct **`kamperhub-s4hc2` project** from Step 2, find your keys and paste them into the `.env.local` file.

> [!WARNING]
> **Login Error: `auth/api-key-expired` or `auth/invalid-api-key`**
> If you see this error, it means your `NEXT_PUBLIC_FIREBASE_API_KEY` is incorrect, invalid, or has been deleted from Google Cloud. Follow the instructions in **Step 3.1** below to get your current, correct Firebase SDK configuration and update your `.env.local` file.

1.  **Firebase Client Keys (`NEXT_PUBLIC_FIREBASE_*`)**
    *   In your [Firebase Project Settings](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/settings/general), under the "General" tab, scroll down to the "Your apps" section.
    *   Find your web app (it's likely named something like `kamperhub-s4hc2`).
    *   Look for the "Firebase SDK snippet" section and select the **Config** option.
    *   This will display an object with keys like `apiKey`, `authDomain`, `projectId`, etc.
    *   **CRITICAL:** Carefully copy each value from this Config object and paste it into the corresponding `NEXT_PUBLIC_FIREBASE_*` variable in your `.env.local` file. The `apiKey` value is your **Web API Key** and goes into `NEXT_PUBLIC_FIREBASE_API_KEY`.
    *   **CRITICAL:** Verify that the `projectId` from the config matches `kamperhub-s4hc2`.

2.  **Firebase Server-Side Key (`GOOGLE_APPLICATION_CREDENTIALS_JSON`)**
    *   Go to the [Firebase Service Accounts page](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/settings/serviceaccounts/adminsdk).
    *   **CRITICAL SECURITY:** If you have any existing service account keys listed, delete them.
    *   Click "Generate new private key". A new, secure JSON file will download.
    *   Open the downloaded file, copy the **entire JSON content**, and paste it inside the single quotes for `GOOGLE_APPLICATION_CREDENTIALS_JSON`. **It must all be on one line.**
    *   **CRITICAL: The `project_id` field inside this JSON file must also be `kamperhub-s4hc2`.**

3.  **Google Cloud API Keys (`GOOGLE_API_KEY` & `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)**
    *   Go to the [Google Cloud Credentials page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials?project=kamperhub-s4hc2).
    *   > [!CAUTION]
    >   **IMPORTANT: Ignore Auto-Generated Keys**
    >   Firebase may automatically create a generic, unrestricted API key in your project named "KamperHub (auto created by Firebase)" or "Browser key". **DO NOT USE THIS KEY.** For security, it is best practice to create and use dedicated, restricted keys as described below. You can safely delete the auto-generated key.
    *   **Create Your Server Key (for `GOOGLE_API_KEY`):**
        *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `Kamperhub Server Key`.
        *   Restrict this key to **Routes API**, **Gemini API**, and **Places API**. The Places API is required for the backend to search for fuel stations along a route.
        *   Under "Application restrictions", choose **"None"**. This is a secret server key and must not have browser restrictions.
        *   Paste this key into the `GOOGLE_API_KEY` variable.
    *   **Create Your Browser Key (for `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):**
        *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `Kamperhub Browser Key`.
        *   Restrict this key to **Maps JavaScript API** and **Places API**.
        *   Under "Application restrictions", choose **"Websites"** and add your local development URL (e.g., `http://localhost:8083/*`).
        *   Paste this key into the `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` variable.

4.  **Google OAuth Keys (`GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`)**
    *   Go to the [Google Cloud Credentials page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials?project=kamperhub-s4hc2).
    *   Find or create credentials of type **"OAuth 2.0 Client ID"**.
    *   **CRITICAL: If creating a new one, select "Web application" as the application type.**
    *   On the details page for your Client ID, you will find the **Client ID** and **Client Secret**.
    *   Copy and paste these into the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` variables in your `.env.local` file.

---

### Step 3.5: CRITICAL - Verify Google Cloud APIs Are Enabled (Est. 5 mins)

Many app features depend on Google services. An incorrect API key or disabled services will cause features to fail.

1.  **Go to the [Google Cloud APIs & Services Dashboard for kamperhub-s4hc2](https://console.cloud.google.com/apis/dashboard?project=kamperhub-s4hc2).**

2.  Click **"Enable APIs and Services"** at the top. You must search for and enable the following APIs if they are not already enabled.

3.  **Client-Side APIs** (Used by `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):
    *   **Maps JavaScript API**
    *   **Places API** 

4.  **Server-Side APIs** (Used by `GOOGLE_API_KEY`):
    *   **Routes API**
    *   **Gemini API** (may be listed as "Generative Language API")
    *   **Places API** (Required for fuel station search)

5.  **OAuth API** (Does not use an API key):
    *   **Google Tasks API**

> [!WARNING]
> **Important Note on "Places API"**
> When you search for "Places API" in the Google Cloud Console, you might see multiple results. The one you need to enable is simply named **"Places API"**. You do NOT need to enable the one called "Places API (New)". The application is configured to use the modern v1 endpoints provided by the standard "Places API" service.

---

### Step 3.6: CRITICAL - Configure OAuth Consent Screen & Credentials (Est. 5 mins)

> [!WARNING]
> **If you see a `403 That's an error... you do not have access` or `redirect_uri_mismatch` page from Google when trying to connect your account, it means this step was missed or done incorrectly.**

This step is mandatory for allowing users to connect their Google Accounts (for features like Google Tasks).

1.  **Go to the [OAuth Consent Screen page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials/consent?project=kamperhub-s4hc2).**
2.  **Set User Type:** If prompted, select **"External"** and click **Create**.
3.  **Fill in App Information:**
    *   **App name:** KamperHub
    *   **User support email:** Select your email address.
    *   **Developer contact information:** Enter your email address again.
    *   Click **"SAVE AND CONTINUE"** through the "Scopes" and "Optional Info" pages. You do not need to add scopes here.
4.  **Publishing Status - VERY IMPORTANT**:
    *   On the OAuth Consent Screen summary page, check the "Publishing status".
    *   If it says **"Testing"**: You can ONLY log in with Google accounts you have explicitly added as "Test users".
    *   If it says **"In production"**: Any Google user can connect to the app.
5.  **Add Test Users (If Status is "Testing")**:
    *   While your app is in "Testing" mode, you must add your own Google account as a test user.
    *   On the OAuth Consent Screen page, go to the **"Test users"** section on the left menu (or find the "+ ADD USERS" button).
    *   Click **"+ ADD USERS"** and enter the email address of the Google account you will be using to test the app (e.g., your personal gmail.com account). This allows that account to bypass the "unverified app" screen during login.
6.  **Verify Redirect URI:**
    *   Go back to the [Credentials page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials?project=kamperhub-s4hc2).
    *   Click on the name of your **OAuth 2.0 Client ID** (the one you used for `GOOGLE_CLIENT_ID`).
    *   Under **"Authorized redirect URIs"**, click **"+ ADD URI"**.
    > [!WARNING]
    > **Port `8083` is Required for OAuth**
    > In this development environment, your app runs internally on port 3000, but it is **exposed externally on port 8083**. Google's services connect to this external port.
    > You **MUST** use the URL with port **8083** for your redirect URI to work. Do **NOT** use port 3000.
    *   Enter the URL that matches your `NEXT_PUBLIC_APP_URL` from your `.env.local` file, followed by `/api/auth/google/callback`.
    *   **Example:** Your `NEXT_PUBLIC_APP_URL` must be `http://localhost:8083`, and the redirect URI you enter must be `http://localhost:8083/api/auth/google/callback`.
    *   Click **Save**.

---

### Step 3.7: CRITICAL - Configure App Check with reCAPTCHA Enterprise (Est. 5 mins)

> [!WARNING]
> **If you see errors related to `app-check-token-request-failed`, it means this step was missed or done incorrectly.** App Check protects your backend resources (like APIs and databases) from abuse.

1.  **Enable App Check in Firebase:**
    *   Go to the [Firebase App Check page for kamperhub-s4hc2](https://console.firebase.google.com/project/kamperhub-s4hc2/appcheck).
    *   Click on your web app (e.g., `kamperhub-s4hc2 (web)`).
    *   In the "Providers" list, select **reCAPTCHA Enterprise** and click **"Save"**. You will be prompted to enable APIs; accept this.

2.  **Create a reCAPTCHA Enterprise Key:**
    *   Go to the [Google Cloud reCAPTCHA Enterprise page for kamperhub-s4hc2](https://console.cloud.google.com/security/recaptcha?project=kamperhub-s4hc2).
    *   Click **"+ CREATE KEY"** at the top.
    *   **Label:** Give it a descriptive name like `KamperHub Web Key`.
    *   **Choose integration type:** Select **Website**.
    *   **Domains:**
        *   **CRITICAL:** Add the domain `localhost`. This is required for local testing.
        *   Add any other domains where your app will be deployed.
    *   **Use reCAPTCHA checkbox:** Uncheck this box. We will use an invisible score-based check.
    *   **Click "CREATE KEY"**.

3.  **Get and Set the Site Key:**
    *   After creation, you will see your new key listed.
    *   Click the "Copy key ID" button next to your `KamperHub Web Key`. This is your **site key**.
    *   Paste this key into your `.env.local` file for the `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY` variable.

4.  **Get and Set the Debug Token (for Local Development):**
    *   Run your app (`npm run dev`).
    *   Open the app preview in a new browser tab.
    *   Open the browser's developer console (usually by pressing F12).
    *   You should see a message from Firebase that looks like this: `App Check debug token: [some-long-uuid-string]`.
    *   Copy **only the long string part** of that token.
    *   Paste it into your `.env.local` file for the `NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN` variable.
    *   **CRITICAL:** Stop and restart your `npm run dev` server after setting the debug token. The app will only use it after a restart.

---

### Step 4: CRITICAL - Verify Your Local Development Server Setup (Est. 1 min)

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

### Step 5: CRITICAL - Verify Firestore Database Exists (with ID `kamperhubv2`) (Est. 2 mins)

> [!IMPORTANT]
> The application code is specifically configured to connect to a Firestore database with the **Database ID `kamperhubv2`**. This is different from your **Project ID**.

1.  In the [Firebase Console for kamperhub-s4hc2](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/firestore/databases), go to **Firestore Database** in the "Build" menu.
2.  **If you see a "Create database" button:** You must create one.
    *   Click **"Create database"**.
    *   Choose **"Start in test mode"**.
    *   Choose a location.
    *   When prompted for a **Database ID**, you MUST enter **`kamperhubv2`**. Do not leave it as `(default)`.
    *   Click **Enable**.
3.  **If a database already exists:** Look at the top of the "Data" tab. The database ID is shown there. It **must be `kamperhubv2`**. If it is `(default)`, you must delete the `(default)` database and create a new one with the correct ID `kamperhubv2`.

---

### Step 6: CRITICAL - Verify Service Account Permissions (Est. 2 mins)

If the above steps are correct, the final check is to ensure your service account has permission to access Firestore.

1.  Go to the [Google Cloud Console IAM Page for kamperhub-s4hc2](https://console.cloud.google.com/iam-admin/iam?project=kamperhub-s4hc2).
2.  Find the service account you are using (its email address is in the `client_email` field of your credentials JSON).
3.  Check its "Role" column. It **must** have a role that allows Firestore access, such as **`Editor`**, **`Firebase Admin`**, or **`Cloud Datastore User`**.
4.  If it doesn't, click the pencil icon to edit its permissions and add one of those roles.

---

### Step 7: FINAL & CRITICAL - Deploy Security Rules (Est. 2 mins)

> [!WARNING]
> **This is the most likely reason your app is stuck on "Initializing Session" or shows "PERMISSION_DENIED" errors.**

The IAM role gives your *server* permission to access the database, but Firestore **Security Rules** control what your *app users* are allowed to do. You must deploy the rules included with the project.

1.  In the application file explorer on the left, open the newly created `firestore.rules` file and copy its entire contents.
2.  Go to the [Firebase Console Rules Editor for kamperhubv2](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/firestore/databases/-kamperhubv2-/rules).
3.  Make sure you have selected the **`kamperhubv2`** database from the dropdown at the top.
4.  Click on the **"Rules"** tab.
5.  Delete any existing text in the rules editor.
6.  Paste the rules you copied from `firestore.rules`.
7.  Click **"Publish"**.

---

### Step 8: Create Your First User Account (One-Time Only) (Est. 1 min)

> [!NOTE]
> This is a one-time step to create your initial user. Once the account exists, you will simply **log in** for future sessions. You only need to sign up again if you delete the user from Firebase.

The debug tool for creating users has been removed for security. The application now handles this automatically during sign-up.

1.  Navigate to the application's sign-up page.
2.  Create your account. If you use the admin email (`info@kamperhub.com`), your account will automatically be granted admin privileges.
3.  After signing up, you should be logged in and can access all features.

> **Warning:** Never commit your `.env.local` file to Git. It contains secrets that provide administrative access to your Firebase project.

---
---

## **Troubleshooting Google Connection Issues**

> [!WARNING]
> **Symptom: The "Connect Google Tasks" button does nothing, or shows an error toast.**
> This almost always means there is a server-side configuration issue preventing the app from generating the Google authentication URL. The problem is NOT your Redirect URI if you've already verified it. The cause is likely one of the two issues below.

### **1. Verify the Google Tasks API is Enabled**

The application needs permission to talk to Google Tasks. If this API is not enabled, the request will fail on the server.

1.  **Go to the [Google Cloud APIs & Services Dashboard for kamperhub-s4hc2](https://console.cloud.google.com/apis/dashboard?project=kamperhub-s4hc2).**
2.  Click **"+ ENABLE APIS AND SERVICES"**.
3.  Search for **"Google Tasks API"**.
4.  If it is not already enabled, click the **"Enable"** button. If it's enabled, you will see a "Manage" button.

### **2. Verify Firestore Security Rules**

To prevent a security issue called "Cross-Site Request Forgery", the connection process creates a temporary, single-use token in your Firestore database in a collection called `oauthStates`. If your security rules block this action, the connection will fail.

1.  Go to the [Firebase Console Rules Editor for kamperhubv2](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/firestore/databases/-kamperhubv2-/rules).
2.  Make sure you have selected the **`kamperhubv2`** database from the dropdown at the top.
3.  Click on the **"Rules"** tab.
4.  Your rules should allow an authenticated user to create documents in the `oauthStates` collection. Add the following `match` block inside your `match /databases/{database}/documents` block if it doesn't exist:

    ```firestore-rules
    // Add this block for Google Auth state tokens
    match /oauthStates/{state} {
      // Allow any authenticated user to create a state token for themselves.
      // The document ID is the random 'state' string.
      // We check that the 'userId' in the document being created matches the user's UID.
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      
      // Only the user who created the state token can read or delete it.
      allow read, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    ```
5.  **Click "Publish"** to save your new rules. After publishing, return to the app and try connecting your account again.
