

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
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
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

4.  **Stripe API Keys (`STRIPE_*`)**
    *   Go to your [Stripe Developer Dashboard](https://dashboard.stripe.com/developers).
    > [!IMPORTANT]
    > **Test Mode vs. Live Mode:** Stripe maintains two completely separate environments. The API keys, customers, products, and webhooks you create in Test Mode do **not** exist in Live Mode. For local development, always use your **Test Mode** keys. When you go live, you will need to get a new set of keys from Live Mode and recreate your products and webhooks there.
    *   **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`**: This is your "Publishable key". It starts with `pk_test_...` and is safe to be exposed to the browser.
    *   **`STRIPE_SECRET_KEY`**: This is your "Secret key". It will start with `sk_test_...` for test mode or `sk_live_...` for live mode. **Never expose this key to the browser.**
    *   **`STRIPE_PRO_PRICE_ID`**: This is the ID of your subscription product's price.
        *   In your Stripe Dashboard (in **Test Mode**), go to the **Product catalogue**.
        *   If you haven't created one, click **+ Add product**, name it "KamperHub Pro" (or similar), and add a recurring price.
        *   Click on the product name (e.g., "KamperHub Pro").
        *   In the "Pricing" section, find the price you want to use. Click the "..." (more options) menu next to it and select **Copy ID**.
        *   The copied ID will start with `price_...` and is what you need for your `.env.local` file.
        > [!IMPORTANT]
        > You need the **Price ID** (`price_...`), not the Product ID (`prod_...`). The Price ID is for a specific price point (e.g., $10/month), while the Product ID is for the overall product.
        *   You will need to repeat this process in Live Mode to get a different Price ID for production.
    *   **`STRIPE_WEBHOOK_SECRET`**: This is how your app securely receives subscription updates. For local testing, this secret comes from the **Stripe CLI**, not the dashboard.
        *   **Step 1: Install & Login to Stripe CLI:** If you haven't already, [install the Stripe CLI](https://stripe.com/docs/stripe-cli) and log in by running `stripe login` in your terminal.
        *   **Step 2: Start Event Forwarding:** With your Next.js app running (`npm run dev`), open a **new terminal window** and run:
            ```bash
            stripe listen --forward-to localhost:8083/api/stripe-webhook
            ```
        *   **Step 3: Copy Your Secret:** The CLI will immediately print your webhook signing secret. It will look like `whsec_...`. This is your `STRIPE_WEBHOOK_SECRET` for local development. Copy it and paste it into your `.env.local` file.
        *   **Keep it running:** You must leave this `stripe listen` terminal running in the background while you test.
        *   **For Production:** When you go live, you will create a webhook endpoint in the Stripe Dashboard (in **Live Mode**). The URL will be `YOUR_APP_URL/api/stripe-webhook`. You must select the following events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, and `customer.subscription.deleted`. The dashboard will then provide you with a different `whsec_...` secret for production.
    > [!NOTE]
    > **Stripe's mode (Test vs. Live) does not affect the Firebase `UNAUTHENTICATED` errors.** Those errors are related to your server's access to the database, controlled by the `GOOGLE_APPLICATION_CREDENTIALS_JSON` and your Firebase project's IAM permissions.

5.  **Stripe Verification Checklist (After Setup)**
    > [!TIP]
    > After you believe everything is set up, run through this checklist to catch common issues.
    >
    > 1.  **Check Your `.env.local` File:**
    >     *   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` must start with `pk_test_`.
    >     *   `STRIPE_SECRET_KEY` must start with `sk_test_`.
    >     *   `STRIPE_PRO_PRICE_ID` must start with `price_` (the Price ID, not the Product ID).
    >     *   `STRIPE_WEBHOOK_SECRET` must start with `whsec_` and be the one provided by the `stripe listen` command, NOT one from the Stripe Dashboard.
    >
    > 2.  **Restart Your Development Server:** Have you stopped (`Ctrl+C`) and restarted (`npm run dev`) your Next.js application since you last saved your `.env.local` file? The server only reads these variables on startup.
    >
    > 3.  **Check Your Stripe CLI Terminal:**
    >     *   Is the `stripe listen --forward-to localhost:8083/api/stripe-webhook` command still running in a separate terminal window? It must be running in the background for your local app to receive events.
    >     *   When you perform actions in the app (like trying to subscribe), do you see event logs appearing in this terminal? If not, the connection isn't working.
    >
    > 4.  **Check Your Stripe Dashboard:**
    >     *   Are you in **Test Mode**? (The toggle is in the top-right corner). All your `pk_test_`, `sk_test_`, and `price_` IDs must come from this mode.
    >     *   Does the product and price you created still exist in the "Product catalogue" in Test Mode?

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
4.  If the project IDs in the two success messages above do not match, it means your client keys and server keys are from different projects. This is a critical error that will cause authentication to fail. Go back to Step 2 and ensure all keys come from the same project.

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

### Step 8: Create Your User Account

The debug tool for creating users has been removed for security. The application now handles this automatically during sign-up.

1.  Navigate to the application's sign-up page.
2.  Create your account. If you use the admin email (`info@kamperhub.com`), your account will automatically be granted admin privileges.
3.  After signing up, you should be logged in and can access all features.

> **Warning:** Never commit your `.env.local` file to Git. It contains secrets that provide administrative access to your Firebase project.
