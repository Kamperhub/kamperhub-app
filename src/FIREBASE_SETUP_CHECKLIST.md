
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
    # --- Firebase Client-Side Configuration (for the browser) ---
    # These values come from your Firebase project settings (see Step 3.1)
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_WEB_APP_API_KEY_HERE"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"
    
    # --- Client-Side Google API Keys (for the browser) ---
    # This key handles Google Maps and Places.
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

> [!IMPORTANT]
> This is the most critical step. Your Firebase **Project ID** is `kamperhub-s4hc2`. You must get **all keys** from this specific project.

1.  Go to the [Firebase Console](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/overview).
2.  Click the gear icon ⚙️ next to **Project Overview** and select **Project settings**.
3.  The **Project ID** listed on this General settings page must be `kamperhub-s4hc2`. This is the value you will use for `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.

---

### Step 3: Populate Your Environment File (Est. 15-20 mins)

Now, using the correct **`kamperhub-s4hc2` project** from Step 2, find your keys and paste them into the `.env.local` file.

1.  **Firebase Client Config (`NEXT_PUBLIC_FIREBASE_*`)**
    *   In your [Firebase Project Settings](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/settings/general), under the "General" tab, scroll down to the "Your apps" section.
    *   Find your web app (it's likely named something like `kamperhub-s4hc2`).
    *   Look for the "Firebase SDK snippet" section and select the **Config** option.
    *   **CRITICAL:** Carefully copy every value from this Config object (`apiKey`, `authDomain`, `projectId`, etc.) and paste it into the corresponding `NEXT_PUBLIC_FIREBASE_*` variable in your `.env.local` file. The `apiKey` from this object is your `NEXT_PUBLIC_FIREBASE_API_KEY`.
    *   **CRITICAL:** Verify that the `projectId` from the config matches `kamperhub-s4hc2`.

2.  **Firebase Server-Side Key (`GOOGLE_APPLICATION_CREDENTIALS_JSON`)**
    *   Go to the [Firebase Service Accounts page](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/settings/serviceaccounts/adminsdk).
    *   Under "Firebase admin SDK", click **"Generate new private key"**. A JSON file will download.
    *   Open the downloaded file, copy the **entire JSON content**, and paste it inside the single quotes for `GOOGLE_APPLICATION_CREDENTIALS_JSON`. **It must all be on one line.**
    *   **CRITICAL: The `project_id` field inside this JSON file must also be `kamperhub-s4hc2`.**

3.  **Google Cloud API Keys (`GOOGLE_API_KEY` & `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)**
    *   Go to the [Google Cloud Credentials page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials?project=kamperhub-s4hc2).
    *   **Create Your Server Key (for `GOOGLE_API_KEY`):**
        *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `Kamperhub Dev Server Key`.
        *   Restrict this key to **Routes API**, **Gemini API**, and **Places API (New)**.
        *   Under "Application restrictions", choose **"None"**. This is a secret server key and must not have browser restrictions.
        *   Paste this key into the `GOOGLE_API_KEY` variable.
    *   **Create Your Browser Key (for `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):**
        *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `Kamperhub Dev Browser Key`.
        *   **CRITICAL (API RESTRICTIONS):** Under **"API restrictions"**, select **"Restrict key"** and ensure the following APIs are selected:
            *   **Maps JavaScript API**
            *   **Places API (New)**
        *   **CRITICAL (WEBSITE RESTRICTIONS):** Under **"Application restrictions"**, choose **"Websites"**.
        *   In the "Website restrictions" section, click **"ADD"**. The most robust value to add is `*.cloudworkstations.dev`. You should also add `localhost` to this list.
        *   Click **Save**.
        *   Paste this new key into the `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` variable.

4.  **Google OAuth Keys (`GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`)**
    *   Go to the [Google Cloud Credentials page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials?project=kamperhub-s4hc2).
    *   Find or create credentials of type **"OAuth 2.0 Client ID"**.
    *   **CRITICAL: If creating a new one, select "Web application" as the application type.**
    *   On the details page for your Client ID, you will find the **Client ID** and **Client Secret**.
    *   Copy and paste these into the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` variables in your `.env.local` file.

---

### Step 3.5: CRITICAL - Verify Google Cloud APIs Are Enabled (Est. 5 mins)

> [!IMPORTANT]
> **Understanding Costs:** Simply **enabling** these APIs does **not** incur any costs. Billing is based on **usage**. Google provides a generous monthly free tier for most services.

1.  **Go to the [Google Cloud APIs & Services Dashboard for kamperhub-s4hc2](https://console.cloud.google.com/apis/dashboard?project=kamperhub-s4hc2).**

2.  Click **"Enable APIs and Services"**. You must search for and enable the following APIs if they are not already enabled.

3.  **Client-Side APIs** (Used by your Browser Key):
    *   **Maps JavaScript API**
    *   **Places API (New)**
    *   **Identity Toolkit API** (Required for Firebase Authentication)
    *   **Firebase App Check API** (Required for App Check)

4.  **Server-Side APIs** (Used by `GOOGLE_API_KEY`):
    *   **Routes API**
    *   **Gemini API** (may be listed as "Generative Language API")
    *   **Places API (New)** (also required by the server for fuel station search)

5.  **OAuth API** (Does not use an API key):
    *   **Google Tasks API**

> [!WARNING]
> **Important Note on "Places API (New)"**
> This project is configured to use the **Places API (New)**. You do **not** need to enable the older API named "Places API".

---

### Step 3.6: CRITICAL - Configure OAuth Consent Screen & Credentials (Est. 5 mins)
... (This section remains correct and unchanged) ...

---

### Step 3.7: CRITICAL - Configure App Check with reCAPTCHA Enterprise (Est. 5 mins)
... (This section remains correct and unchanged) ...

---

### Step 4: CRITICAL - Verify Your Local Development Server Setup (Est. 1 min)
... (This section remains correct and unchanged) ...

---

### Step 5: CRITICAL - Verify Firestore Database Exists (with ID `kamperhubv2`) (Est. 2 mins)
... (This section remains correct and unchanged) ...

---

### Step 6: CRITICAL - Verify Service Account Permissions (Est. 2 mins)
... (This section remains correct and unchanged) ...

---

### Step 7: FINAL & CRITICAL - Deploy Security Rules (Est. 2 mins)
... (This section remains correct and unchanged) ...

---

### Step 8: Create Your First User Account (One-Time Only) (Est. 1 min)
... (This section remains correct and unchanged) ...

---
---

## **Troubleshooting Google Connection Issues**
... (This section remains correct and unchanged) ...
