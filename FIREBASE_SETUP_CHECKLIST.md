
# Firebase & Backend Setup Checklist

> [!CAUTION]
> **This guide has been completely overhauled to use Base64 encoding for the server key.** This is the most robust and reliable method to prevent the critical `16 UNAUTHENTICATED` error caused by copy-paste issues. Please follow these steps carefully.

---

### Step 1: Create Your Local Environment File

1.  In the main folder of your project, create a new file named **exactly**:
    `.env.local`

2.  Copy and paste the following block of text into your newly created `.env.local` file. You will fill in the placeholder values in the next steps.

    ```env
    # --- Firebase Client-Side Configuration (for the browser) ---
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_BROWSER_KEY_HERE"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    # ... (other NEXT_PUBLIC_FIREBASE variables) ...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"
    
    # --- Client-Side Google Maps API Key (for the browser) ---
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_BROWSER_KEY_HERE"

    # --- Server-Side Google API Keys (for the backend: Routes, Gemini AI) ---
    GOOGLE_API_KEY="YOUR_SERVER_API_KEY_HERE"
    
    # --- Firebase Server-Side Admin Configuration (for backend functions) ---
    # CRITICAL: This MUST be a single-line Base64 encoded string of your service account JSON file.
    GOOGLE_APPLICATION_CREDENTIALS_JSON="PASTE_YOUR_BASE64_ENCODED_STRING_HERE"

    # --- App Check Configuration (for securing backend requests) ---
    NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY="your-recaptcha-enterprise-site-key"
    NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN="your-app-check-debug-token-if-needed"

    # --- Application URL and Environment ---
    NEXT_PUBLIC_APP_URL="https://6000-firebase-studio-1748946751962.cluster-isls3qj2gbd5qs4jkjqvhahfv6.cloudworkstations.dev"
    NEXT_PUBLIC_APP_ENV="development"

    # --- Stripe & Google OAuth (No changes needed here) ---
    NEXT_PUBLIC_STRIPE_PAYMENT_LINK=https://buy.stripe.com/...
    STRIPE_SECRET_KEY="sk_test_..."
    STRIPE_WEBHOOK_SECRET="whsec_..."
    GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
    ```

---

### Step 2: Get Firebase Client & Server Keys

This step now has two parts: getting the regular client-side keys, and then downloading and encoding the server-side key.

1.  **Get Client-Side Keys (`NEXT_PUBLIC_FIREBASE_*`)**
    *   In your [Firebase Project Settings](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/settings/general), find your web app config.
    *   Copy every value (`apiKey`, `authDomain`, etc.) into the corresponding `NEXT_PUBLIC_FIREBASE_*` variables in `.env.local`.

2.  **Download and Encode Server-Side Key (`GOOGLE_APPLICATION_CREDENTIALS_JSON`)**
    *   **A. Download the JSON file:**
        *   Go to the [Firebase Service Accounts page](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/settings/serviceaccounts/adminsdk).
        *   Click **"Generate new private key"**. A JSON file will be downloaded to your computer.
    *   **B. Convert the JSON file to a Base64 string:**
        *   You need to convert the *content* of this file into a single line of text. The easiest way is using an online tool.
        *   Go to a site like [base64encode.org](https://www.base64encode.org/).
        *   Click **"Choose File"** and select the JSON file you just downloaded.
        *   Click **"Encode"**.
        *   Click **"Copy to Clipboard"** to copy the single, long line of encoded text.
    *   **C. Paste the Base64 String:**
        *   Go back to your `.env.local` file.
        *   Paste the single line of Base64 text you just copied as the value for `GOOGLE_APPLICATION_CREDENTIALS_JSON`. **Do not wrap it in quotes.**
        *   The line should look like this: `GOOGLE_APPLICATION_CREDENTIALS_JSON=eyJwcm9qZWN0X2lkIjoi...`

---

### Step 3: Configure Google Cloud API Keys

This process remains the same, but is now more reliable because the server key is handled robustly.

1.  **Go to the [Google Cloud Credentials page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials?project=kamperhub-s4hc2).**

2.  **A) Configure Your Firebase Browser Key:**
    *   Find the key that matches the value in your `.env.local` for `NEXT_PUBLIC_FIREBASE_API_KEY`.
    *   **API RESTRICTIONS:** Restrict it to **Identity Toolkit API** and **Firebase App Check API**.
    *   **WEBSITE RESTRICTIONS:** Add the specific URL of your development environment (e.g., `https://6000-firebase-studio-1748946751962.cluster-isls3qj2gbd5qs4jkjqvhahfv6.cloudworkstations.dev/*`) and `localhost:*/*`.

3.  **B) Create & Configure Your Google Maps Browser Key:**
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `Kamperhub Dev Maps Key`.
    *   **API RESTRICTIONS:** Restrict it to **Maps JavaScript API** and **Places API (New)**.
    *   **WEBSITE RESTRICTIONS:** Add the specific URL of your development environment (e.g., `https://6000-firebase-studio-1748946751962.cluster-isls3qj2gbd5qs4jkjqvhahfv6.cloudworkstations.dev/*`) and `localhost:*/*`.
    *   Paste this key into `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

4.  **C) Create & Configure Your Server Key:**
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `Kamperhub Dev Server Key`.
    *   **API RESTRICTIONS:** Restrict it to **Routes API**, **Gemini API**, and **Places API (New)**.
    *   **APPLICATION RESTRICTIONS:** Choose **"None"**.
    *   Paste this key into `GOOGLE_API_KEY`.

---

### Step 4: CRITICAL - Configure Google OAuth (for "Connect to Google Tasks")

> [!WARNING]
> **If you see a "This app is blocked" or `redirect_uri_mismatch` error page from Google when trying to connect your account, it means this step was missed or done incorrectly.**

This is mandatory for allowing users to connect their Google Accounts.

1.  **Go to the [OAuth Consent Screen page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials/consent?project=kamperhub-s4hc2).**
2.  **Publishing Status:** Check the "Publishing status".
    *   If it says **"Testing"**, you can ONLY log in with Google accounts you have explicitly added as "Test users".
    *   **TO FIX "APP IS BLOCKED" ERROR:**
        *   While on the OAuth Consent Screen page, find the **"Test users"** section.
        *   Click the **"+ ADD USERS"** button.
        *   Enter the full Gmail or Google Workspace email address you are using to test the app (e.g., `your.email@gmail.com`).
        *   Click **"SAVE"**.
3.  **Verify Redirect URI:**
    *   Go back to the [Credentials page](https://console.cloud.google.com/apis/credentials?project=kamperhub-s4hc2).
    *   Click on the name of your **OAuth 2.0 Client ID**.
    *   Under **"Authorized redirect URIs"**, click **"+ ADD URI"**.
    *   Enter the URL that matches your `NEXT_PUBLIC_APP_URL` from your `.env.local` file, followed by `/api/auth/google/callback`.
    *   **Example:** `https://6000-firebase-studio-1748946751962.cluster-isls3qj2gbd5qs4jkjqvhahfv6.cloudworkstations.dev/api/auth/google/callback`
    *   Click **Save**.

---

### Step 5: CRITICAL - Restart Your Server

After saving your updated `.env.local` file, you **MUST** restart your development server for the new variables to be loaded.

*   Stop the server (`Ctrl + C` in the terminal).
*   Start it again (`npm run dev`).
*   Check the terminal for the `[Firebase Admin] SDK initialized successfully` message. If you see errors about Base64 decoding, it means the copy-paste in Step 2 was incorrect.

(The remaining steps for Firestore Database creation and Security Rules remain the same and are still required.)

    