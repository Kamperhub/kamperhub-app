
# Firebase & Backend Setup Checklist

> [!CAUTION]
> **This guide has been completely overhauled to provide a clear, robust, three-key setup for your local environment.** This is the most secure and flexible way to manage your app's secret keys and avoid the `grantToken` error.

---

### Step 1: Create Your Local Environment File

All your secret keys will live in a special file that is **NEVER** committed to version control.

1.  In the main folder of your project, create a new file named **exactly**:
    `.env.local`

2.  Copy and paste the following block of text into your newly created `.env.local` file. You will fill in the placeholder values in the next steps.

    ```env
    # --- Firebase Client-Side Configuration (for the browser) ---
    # NOTE: This key is ONLY for Firebase Auth, Firestore, and App Check.
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_BROWSER_KEY_HERE"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"
    
    # --- Client-Side Google Maps API Key (for the browser) ---
    # NOTE: This key is ONLY for Maps JavaScript API and Places API.
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_BROWSER_KEY_HERE"

    # --- Server-Side Google API Keys (for the backend) ---
    # This single key handles Routes API and Gemini AI. It must NOT have HTTP referrer restrictions.
    GOOGLE_API_KEY="YOUR_SERVER_API_KEY_HERE"
    
    # --- Firebase Server-Side Admin Configuration (for backend functions) ---
    # This MUST be a single line of JSON string.
    GOOGLE_APPLICATION_CREDENTIALS_JSON='PASTE_YOUR_ENTIRE_SERVICE_ACCOUNT_JSON_HERE'

    # --- App Check Configuration (for securing backend requests) ---
    NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY="your-recaptcha-enterprise-site-key"
    NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN="your-app-check-debug-token-if-needed"

    # --- Application URL and Environment ---
    NEXT_PUBLIC_APP_URL="http://localhost:8083"
    NEXT_PUBLIC_APP_ENV="development"

    # --- Stripe Configuration (for subscriptions) ---
    NEXT_PUBLIC_STRIPE_PAYMENT_LINK=https://buy.stripe.com/...
    STRIPE_SECRET_KEY="sk_test_..."
    STRIPE_WEBHOOK_SECRET="whsec_..."
    
    # --- Google OAuth Configuration (for Google Tasks, etc.) ---
    GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
    ```

---

### Step 2: Find Your Firebase Project (Est. 2 mins)
(Unchanged and Correct)

---

### Step 3: Populate Your Environment File (Est. 15-20 mins)

1.  **Firebase Client Config (`NEXT_PUBLIC_FIREBASE_*`)**
    *   In your [Firebase Project Settings](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/settings/general), find your web app config.
    *   Copy every value (`authDomain`, `projectId`, etc.) into the corresponding `NEXT_PUBLIC_FIREBASE_*` variable.
    *   **CRITICAL:** The `apiKey` value from this config object is what you will use for **`NEXT_PUBLIC_FIREBASE_API_KEY`**. Copy it into your `.env.local` file now.

2.  **Firebase Server-Side Key (`GOOGLE_APPLICATION_CREDENTIALS_JSON`)**
    *   Go to the [Firebase Service Accounts page](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/settings/serviceaccounts/adminsdk).
    *   Generate a new private key and paste the **entire one-line JSON content** into `GOOGLE_APPLICATION_CREDENTIALS_JSON`.

3.  **Google Cloud API Keys (CRITICAL - Three Distinct Keys)**
    *   Go to the [Google Cloud Credentials page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials?project=kamperhub-s4hc2).

    *   **A) Configure Your Firebase Browser Key (for `NEXT_PUBLIC_FIREBASE_API_KEY`)**
        *   In the API key list, find the key that matches the value you just put in `NEXT_PUBLIC_FIREBASE_API_KEY`. It might be named "Browser key (auto-created by Firebase)". Click its name to edit it.
        *   **API RESTRICTIONS (IMPORTANT):** Select **"Restrict key"**. Verify that there is a long list of APIs already enabled by Firebase (there may be ~24 of them). **DO NOT REMOVE THIS LIST.** These are required for the various Firebase client SDKs (Auth, Firestore, etc.) to function correctly. Restricting this key to only one or two APIs will break the application.
        *   **WEBSITE RESTRICTIONS:** Under "Application restrictions", choose **"Websites"**. Add the following two entries exactly:
            *   `*.cloudworkstations.dev/*`
            *   `localhost:*/*`
        *   Click **Save**.

    *   **B) Create & Configure Your Google Maps Browser Key (for `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)**
        *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `Kamperhub Dev Maps Key`.
        *   **API RESTRICTIONS:** Restrict this key to these two APIs: **Maps JavaScript API** and **Places API (New)**.
        *   **WEBSITE RESTRICTIONS:** Under "Application restrictions", choose **"Websites"**. Add the same two entries as the Firebase key:
            *   `*.cloudworkstations.dev/*`
            *   `localhost:*/*`
        *   Click **Save**. Paste the new key value into `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

    *   **C) Create & Configure Your Server Key (for `GOOGLE_API_KEY`)**
        *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `Kamperhub Dev Server Key`.
        *   **API RESTRICTIONS:** Restrict this key to these APIs: **Routes API**, **Generative Language API (Gemini)**, and **Places API (New)**.
        *   **APPLICATION RESTRICTIONS:** Choose **"None"**. This is critical. Do not add website restrictions.
        *   Click **Save**. Paste this key's value into the `GOOGLE_API_KEY` variable.

4.  **Google OAuth Keys (`GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`)**
    * (Instructions Unchanged and Correct)

---

(The remaining steps 3.5 through 8 remain correct and unchanged.)
