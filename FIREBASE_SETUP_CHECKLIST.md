# Firebase & Backend Setup Checklist

This guide provides a step-by-step checklist to ensure your Firebase project and environment variables are configured correctly.

**Please follow these steps carefully to ensure a stable backend.**

---

### Step 1: Create a `.env.local` File

The most important step is to create a `.env.local` file in the root directory of your project. This file will hold all your secret keys and is safely ignored by Git. If it doesn't exist, create it now.

The structure of your `.env.local` file should look like this:

```
# Firebase Admin SDK (for server-side functions)
GOOGLE_APPLICATION_CREDENTIALS_JSON='PASTE_YOUR_SERVICE_ACCOUNT_JSON_HERE'

# Firebase Client SDK (for browser-side functions)
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"

# Firebase App Check & reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY="your-recaptcha-enterprise-site-key"
NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN="your-app-check-debug-token"

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Stripe API Keys (for subscriptions)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App URL (for redirects)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

The next steps will guide you on where to find the values for these placeholders.

---

### Step 2: Configure Firebase Web App Keys (Client-Side)

1.  **Create Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project if you haven't already.
2.  **Create Web App**: Inside your project, create a new "Web App" (</>).
3.  **Get Config**: During the setup, Firebase will provide a `firebaseConfig` object with your project's keys.
4.  **Update `.env.local`**: Copy each value from the `firebaseConfig` object and paste it into the corresponding `NEXT_PUBLIC_FIREBASE_...` variable in your `.env.local` file.

---

### Step 3: Configure Firebase Admin SDK Key (Server-Side)

This step is critical and a common source of server crashes.

1.  **Generate Key**: In the Firebase Console, click the gear icon next to "Project Overview" and go to **Project settings > Service accounts**.
2.  **Generate New Private Key**: Click the button to generate a new key. A JSON file will be downloaded. **Treat this file like a password.**
3.  **Update `.env.local`**: Open the downloaded JSON file with a text editor. Copy the **entire JSON content**.
4.  Paste this content into the `GOOGLE_APPLICATION_CREDENTIALS_JSON` variable in your `.env.local` file, enclosed in single quotes.

> **Warning:** Never commit your `.env.local` file to Git. It provides administrative access to your entire Firebase project.

---

### Step 4: Configure Other API Keys & Secrets

Fill in the remaining placeholders in your `.env.local` file:

1.  **Google Maps API Key**:
    *   In the [Google Cloud Console](https://console.cloud.google.com/), go to **APIs & Services > Credentials** for your project.
    *   Create a new API Key. **Restrict this key** to your website's domain to prevent unauthorized use.
    *   Ensure the **Maps JavaScript API**, **Places API**, and **Directions API** are enabled for your project.
    *   Paste the key into the `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` variable.

2.  **reCAPTCHA Enterprise Key (for App Check)**:
    *   In the Google Cloud Console, find **reCAPTCHA Enterprise** and create a site key for your domain.
    *   Paste this key into `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY`.

3.  **Stripe API Keys**:
    *   In your [Stripe Dashboard](https://dashboard.stripe.com/), go to the Developers section to find your keys.
    *   Add your **Secret Key** to `STRIPE_SECRET_KEY` and your **Webhook Signing Secret** to `STRIPE_WEBHOOK_SECRET`.

---

### Step 5: Final Setup

1.  **Enable Auth Method**: In the Firebase Console, go to **Build > Authentication > Sign-in method** and enable **Email/Password**.
2.  **Create Firestore Database**: Go to **Build > Firestore Database** and create a database in **production mode**.
3.  **Restart Server**: Once your `.env.local` file is complete, stop your development server (`Ctrl+C`) and restart it (`npm run dev`) for all changes to take effect.
