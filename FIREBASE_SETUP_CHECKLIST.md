
# Firebase & Backend Setup Checklist

> [!CAUTION]
> **This guide has been updated with a more robust setup for the development environment.** This is the most secure and flexible way to manage your app's secret keys and avoid common startup errors.

---

### Step 1: Create Your Local Environment File

All your secret keys will live in a special file that is **NEVER** committed to version control.

1.  In the main folder of your project, create a new file named **exactly**:
    `.env.local`

2.  Copy and paste the following block of text into your `.env.local` file. You will fill in the placeholder values in the next steps.

    ```env
    # --- Firebase Client-Side Configuration (for the browser) ---
    # NOTE: NEXT_PUBLIC_FIREBASE_API_KEY is now DEPRECATED. The app will use NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for auth.
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"
    
    # --- Client-Side Google API Keys (for the browser) ---
    # CRITICAL: This is now the SINGLE key for all client-side Google services, including Firebase Auth and Google Maps.
    # It should have "HTTP referrer" restrictions.
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_BROWSER_API_KEY_HERE"

    # --- Server-Side Google API Keys (for the backend) ---
    # This key handles Routes API and Gemini AI. It must NOT have HTTP referrer restrictions.
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
(Unchanged)

---

### Step 3: Populate Your Environment File (Est. 15-20 mins)
(Unchanged, but with clearer instructions)

1.  **Firebase Client Config (`NEXT_PUBLIC_FIREBASE_*`)**
    *   In your [Firebase Project Settings](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/settings/general), find your web app config.
    *   **CRITICAL:** Carefully copy every value (`authDomain`, `projectId`, etc.) into the corresponding `NEXT_PUBLIC_FIREBASE_*` variable.
    *   **CRITICAL (UNIFIED KEY):** Copy the `apiKey` value from this config and paste it into the `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` variable. This will be your single key for all browser operations.

2.  **Firebase Server-Side Key (`GOOGLE_APPLICATION_CREDENTIALS_JSON`)**
    *   Go to the [Firebase Service Accounts page](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/settings/serviceaccounts/adminsdk).
    *   Generate a new private key and paste the **entire one-line JSON content** into `GOOGLE_APPLICATION_CREDENTIALS_JSON`.

3.  **Google Cloud API Keys (`GOOGLE_API_KEY` & Modifying the Browser Key)**
    *   Go to the [Google Cloud Credentials page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials?project=kamperhub-s4hc2).
    *   **Create Your Server Key (for `GOOGLE_API_KEY`):**
        *   Create a new API Key. Name it `Kamperhub Dev Server Key`.
        *   Restrict this key to **Routes API**, **Gemini API**, and **Places API (New)**.
        *   Under "Application restrictions", choose **"None"**. This is a secret server key and must not have browser restrictions.
        *   Paste this key into the `GOOGLE_API_KEY` variable.
    *   **Configure Your Browser Key (the `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):**
        *   Find the key that matches the value you put in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
        *   **API RESTRICTIONS:** Restrict the key to: **Maps JavaScript API**, **Places API (New)**, **Identity Toolkit API** (for Auth), and **Firebase App Check API**.
        *   **WEBSITE RESTRICTIONS:** Under "Application restrictions", choose **"Websites"**.
        *   **CRITICAL FIX:** Add your development URL to the allowed list. The most robust value to add is `*.cloudworkstations.dev`. You should also add `localhost`.

4.  **Google OAuth Keys (`GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`)**
    * (Unchanged)

---

### Step 3.5: CRITICAL - Verify Google Cloud APIs Are Enabled (Est. 5 mins)
(Unchanged)

---

### Step 3.6: CRITICAL - Configure OAuth Consent Screen & Credentials (Est. 5 mins)
(Instructions updated for clarity)

1.  Go to the [OAuth Consent Screen page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials/consent?project=kamperhub-s4hc2).
2.  Fill in app info and publish the app.
3.  Go to the [Credentials page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials?project=kamperhub-s4hc2).
4.  Click on your **OAuth 2.0 Client ID**.
5.  **Part 1: Authorized JavaScript origins**:
    *   Click "+ ADD URI".
    *   Paste the base URL of your application (e.g., `https://your-id.cloudworkstations.dev`).
6.  **Part 2: Authorized redirect URIs**:
    *   Click "+ ADD URI".
    *   Paste the full callback URL: your base URL plus `/api/auth/google/callback`.

---

### Step 3.7: CRITICAL - Configure App Check with a Debug Token (Est. 5 mins)

> [!IMPORTANT]
> This is a new, mandatory step for local development to prevent `grantToken` errors.

1.  **Go to the [Firebase App Check page for kamperhub-s4hc2](https://console.firebase.google.com/project/kamperhub-s4hc2/appcheck/apps).**
2.  Select your web app. In the "Providers" tab, enable **reCAPTCHA Enterprise**. You will be prompted to create a key; follow the on-screen steps.
3.  Copy the **Site Key ID** from the reCAPTCHA Enterprise page and paste it into the `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY` variable in your `.env.local` file.
4.  Back in the Firebase App Check "Apps" tab, click the three-dot menu next to your web app and select **"Manage debug tokens"**.
5.  Click **"Add debug token"** and select **"Generate new token"**.
6.  Copy the generated token string.
7.  Paste this token into the `NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN` variable in your `.env.local` file.

---

(The remaining steps 4, 5, 6, 7, and 8 remain correct and unchanged.)

---

### Step 4: CRITICAL - Verify Your Local Development Server Setup (Est. 1 min)
...

### Step 5: CRITICAL - Verify Firestore Database Exists (with ID `kamperhubv2`) (Est. 2 mins)
...

### Step 6: CRITICAL - Verify Service Account Permissions (Est. 2 mins)
...

### Step 7: FINAL & CRITICAL - Deploy Security Rules (Est. 2 mins)
...

### Step 8: Create Your First User Account (One-Time Only) (Est. 1 min)
...
