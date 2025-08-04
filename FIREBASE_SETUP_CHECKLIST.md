
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
(Instructions are correct and remain unchanged)

---

### Step 4: CRITICAL - Configure Google OAuth
(Instructions are correct and remain unchanged)

---

### Step 5: CRITICAL - Verify Firestore Database Exists (with ID `kamperhubv2`)

> [!IMPORTANT]
> The application code is specifically configured to connect to a Firestore database with the **Database ID `kamperhubv2`**. This is different from your **Project ID**. This is the most common cause of the "Service firestore is not available" error.

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

This step is required to allow your application to read and write data.

1.  In the application file explorer on the left, open the `firestore.rules` file and copy its entire contents.
2.  Go to the [Firebase Console](https://console.firebase.google.com/) for your `kamperhub-s4hc2` project.
3.  Navigate to the **Firestore Database** section.
4.  Make sure you have selected the **`kamperhubv2`** database from the dropdown at the top.
5.  Click on the **"Rules"** tab.
6.  Delete any existing text in the rules editor.
7.  Paste the rules you copied from `firestore.rules`.
8.  Click **"Publish"**.

---

### Step 8: CRITICAL - Restart Your Server

After saving your updated `.env.local` file and verifying the steps above, you **MUST** restart your development server.

*   Stop the server (`Ctrl + C` in the terminal).
*   Start it again (`npm run dev`).
*   Check the terminal for the `[Firebase Admin] SDK initialized successfully` message. If you still see errors, please review the steps in this guide carefully.
