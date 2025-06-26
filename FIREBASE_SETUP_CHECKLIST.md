
# Firebase & Backend Setup Checklist

> [!CAUTION]
> **This guide has been updated to use industry-standard environment variables.** This is the most secure and flexible way to manage your app's secret keys.

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

    # App Check Configuration
    NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY="your-recaptcha-enterprise-site-key"
    NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN="your-app-check-debug-token-if-needed"

    # Firebase Server-Side Admin Configuration (for backend functions)
    # This MUST be a single line of JSON wrapped in single quotes.
    GOOGLE_APPLICATION_CREDENTIALS_JSON='PASTE_YOUR_ENTIRE_SERVICE_ACCOUNT_JSON_HERE'

    # Stripe Configuration (for subscriptions)
    STRIPE_SECRET_KEY="sk_test_..."
    STRIPE_WEBHOOK_SECRET="whsec_..."
    STRIPE_PRO_PRICE_ID="price_..."
    ```

---

### Step 2: Populate Your Environment File

Now, find your keys in the Firebase and Stripe dashboards and paste them into the `.env.local` file, replacing the placeholders.

1.  **Firebase Client Keys (`NEXT_PUBLIC_FIREBASE_*`)**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Navigate to **Project settings** (click the gear icon ⚙️).
    *   In the **General** tab, under "Your apps", find your web app.
    *   Look for the "Firebase SDK snippet" and select the **Config** option.
    *   Copy each value (`apiKey`, `authDomain`, `projectId`, etc.) and paste it into the corresponding `NEXT_PUBLIC_FIREBASE_*` variable in your `.env.local` file.

2.  **App Check Keys (`NEXT_PUBLIC_RECAPTCHA_*`)**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/), find **reCAPTCHA Enterprise** and create a site key. Paste it as the `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY`.
    *   When you first run the app, check the browser's developer console for an "App Check debug token" message. If it appears, copy that token and paste it as the `NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN`.

3.  **Firebase Server-Side Key (`GOOGLE_APPLICATION_CREDENTIALS_JSON`)**
    *   Go to **Project settings > Service accounts** in the Firebase Console.
    *   Click "Generate new private key". A JSON file will download.
    *   Open the downloaded file, copy the **entire JSON content**, and paste it inside the single quotes for `GOOGLE_APPLICATION_CREDENTIALS_JSON`. **It must all be on one line.**

4.  **Stripe Keys**
    *   Go to your [Stripe Developer Dashboard](https://dashboard.stripe.com/test/apikeys).
    *   Copy your "Secret key" and paste it as `STRIPE_SECRET_KEY`.
    *   Go to the "Webhooks" tab, find your webhook endpoint, and copy the "Signing secret". Paste it as `STRIPE_WEBHOOK_SECRET`.
    *   Go to the "Products" tab, click on your "Pro Plan" product, and copy the "API ID" for the price. Paste it as `STRIPE_PRO_PRICE_ID`.

---

### Step 3: **CRITICAL** - Restart Your Server

After **ANY** change to your `.env.local` file, you **MUST** restart your development server. The server only reads this file when it first starts.

1.  Go to your terminal where the server is running.
2.  Press `Ctrl + C` to stop it.
3.  Run `npm run dev` again to restart it.

---

### Step 4: Verify Your Setup (Troubleshooting)

If you are still having issues, you can use the built-in diagnostic tool.

1.  After restarting your server, go to the following URL in your browser:
    `[YOUR_APP_URL]/api/debug/env`
2.  This will show a JSON response indicating the status ("Set" or "Not Set") of each required environment variable.
3.  If a variable shows as "Not Set", please double-check its name in `.env.local` and ensure you have restarted the server.

> **Warning:** Never commit your `.env.local` file to Git. It contains secrets that provide administrative access to your Firebase project.
