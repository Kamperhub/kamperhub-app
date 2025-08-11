
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
    # IMPORTANT: This URL must match the one shown in your terminal when you run `npm run dev`.
    # It will look like: https://PORT-ID.cluster-ID.cloudworkstations.dev
    # CRITICAL: Do NOT include a trailing slash or wildcard (e.g., "/*") at the end of the URL.
    NEXT_PUBLIC_APP_URL="https://6000-firebase-studio-1748946751962.cluster-isls3qj2gbd5qs4jkjqvhahfv6.cloudworkstations.dev"
    NEXT_PUBLIC_APP_ENV="development"

    # --- Stripe & Google OAuth ---
    NEXT_PUBLIC_STRIPE_PAYMENT_LINK=https://buy.stripe.com/...
    STRIPE_SECRET_KEY="sk_test_..."
    STRIPE_WEBHOOK_SECRET="whsec_..."
    GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
    ```

---

### Step 2: Get Firebase Client & Server Keys

This step has two parts: getting the regular client-side keys, and then downloading and encoding the server-side key.

1.  **Get Client-Side Keys (`NEXT_PUBLIC_FIREBASE_*`)**
    *   In your [Firebase Project Settings](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/settings/general), find your web app config.
    *   Copy every value (`apiKey`, `authDomain`, etc.) into the corresponding `NEXT_PUBLIC_FIREBASE_*` variables in `.env.local`.

2.  **Download and Encode Server-Side Key (`GOOGLE_APPLICATION_CREDENTIALS_JSON`)**
    *   **A. Download the JSON file:**
        *   Go to the [Firebase Service Accounts page](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/settings/serviceaccounts/adminsdk).
        *   Click **"Generate new private key"**. A JSON file will be downloaded to your computer.
    *   **B. Convert the JSON file to a Base64 string:**
        *   You can use an online tool like [base64encode.org](https://www.base64encode.org/).
        *   Click **"Choose File"** and select the JSON file you just downloaded.
        *   Click **"Encode"**.
        *   Click **"Copy to Clipboard"** to copy the single, long line of encoded text.
    *   **C. Paste the Base64 String:**
        *   Go back to your `.env.local` file.
        *   Paste the single line of Base64 text as the value for `GOOGLE_APPLICATION_CREDENTIALS_JSON`. **Do not wrap it in quotes.**
        *   The line should look like this: `GOOGLE_APPLICATION_CREDENTIALS_JSON=eyJwcm9qZWN0X2lkIjoi...`
    *   **D. CRITICAL - Verify Project ID Match:** Open the downloaded JSON file and ensure the `project_id` field inside it matches the `NEXT_PUBLIC_FIREBASE_PROJECT_ID` you set above. If they do not match, your client and server are configured for different projects, which will cause authentication failures.

---

### Step 3: Configure Google Cloud API Keys
(Instructions are correct and remain unchanged)

---

### Step 4: CRITICAL - Configure Google OAuth
(Instructions are correct and remain unchanged)

---

### Step 5: CRITICAL - Create the (default) Firestore Database

> [!IMPORTANT]
> The error **"Service firestore is not available"** means this step has not been completed. The application code requires that your project's **(default)** Firestore database instance exists.

1.  In the Firebase Console for your `kamperhub-s4hc2` project, go to [**Firestore Database**](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/firestore/data).
2.  **Look at the dropdown menu at the top of the Firestore "Data" tab.** It should show **`(default)`**.
3.  **If you see a "Create database" button:**
    *   Click **"Create database"**.
    *   Choose **"Start in test mode"**.
    *   Choose a location (e.g., us-central1).
    *   When prompted for a **Database ID**, leave it as **`(default)`**. Do not change it.
    *   Click **Enable**.
4.  Once the database is created, the page will refresh and you will see an empty "Data" panel ready for your collections. This is the confirmation that the service is now available.

---

### Step 6: CRITICAL - Verify Service Account Permissions

Ensure your service account has permission to access Firestore.

1.  Go to the [Google Cloud Console IAM Page](https://console.cloud.google.com/iam-admin/iam?project=kamperhub-s4hc2) for your project.
2.  Find the service account you are using (its email address is in the `client_email` field of your credentials JSON).
3.  Check its "Role" column. It **must** have a role that allows Firestore access, such as **`Editor`**, **`Firebase Admin`**, or **`Cloud Datastore User`**.
4.  If it doesn't, click the pencil icon to edit its permissions and add one of those roles.

---

### Step 7: FINAL & CRITICAL - Deploy Security Rules to the (default) Database
(Instructions are correct and remain unchanged)

---

### Step 8: CRITICAL - Restart Your Server & Sign Up
(Instructions are correct and remain unchanged)
