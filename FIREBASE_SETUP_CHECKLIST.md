# Firebase & Backend Setup Checklist

This guide provides a step-by-step checklist to ensure your Firebase project and environment variables are configured correctly. Many of the recent server-side errors are caused by missing or incorrect configuration, especially for the Admin SDK (Step 4) and other API keys.

**Please follow these steps carefully to ensure a stable backend.**

---

### Step 1: Firebase Project & Web App

1.  **Create Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project if you haven't already.
2.  **Create Web App**: Inside your project, create a new "Web App" (</>).
3.  **Get Config**: During the setup, Firebase will provide a `firebaseConfig` object.
4.  **Verify Config**: Open `src/lib/firebase.ts`. Ensure the values in the `firebaseConfig` object in that file match the ones from your Firebase project. The existing values are placeholders and **must** be replaced with your project's unique keys.

---

### Step 2: Enable Authentication Method

1.  In the Firebase Console, go to **Build > Authentication**.
2.  Click the **Sign-in method** tab.
3.  Click on **Email/Password** from the list of providers and enable it.

---

### Step 3: Create Firestore Database

1.  In the Firebase Console, go to **Build > Firestore Database**.
2.  Click **Create database**.
3.  Choose **Start in production mode**. This is safer and aligns with the app's security rules.
4.  Select a location for your database servers (choose one close to your user base).
5.  The file `firestore.rules` in your project allows reads/writes only by authenticated users. This is a good default, but you can customize these rules later for more granular control.

---

### Step 4: Configure Firebase Admin SDK (CRITICAL)

This step is the most common source of server crashes when running locally.

1.  **Generate Key**: In the Firebase Console, click the gear icon next to "Project Overview" and go to **Project settings > Service accounts**.
2.  Click the **Generate new private key** button. A JSON file will be downloaded to your computer. **Treat this file like a password.**
3.  **Set Environment Variable**:
    *   Open the downloaded JSON file with a text editor.
    *   Copy the **entire content** of the file.
    *   You need to set this content as an environment variable named `GOOGLE_APPLICATION_CREDENTIALS_JSON`.
    *   **For Local Development**: Create a new file in your project's root directory named `.env.local`. Add the following line, pasting the JSON content you copied:
        ```
        GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type": "service_account", "project_id": "...", ...}'
        ```
        **Important:** Make sure the entire JSON is on a single line and enclosed in single quotes.
    *   **For Production Hosting**: Go to your hosting provider's settings (e.g., Vercel, Netlify, Firebase App Hosting) and add an environment variable with the name `GOOGLE_APPLICATION_CREDENTIALS_JSON` and paste the JSON content as its value.

> **Warning:** Never commit your service account JSON file or your `.env.local` file to Git. It provides administrative access to your entire Firebase project.

---

### Step 5: Configure Other API Keys & Secrets

These are also configured in your `.env.local` file for local development or as environment variables in your production hosting environment.

1.  **Google Maps API Key**:
    *   In the [Google Cloud Console](https://console.cloud.google.com/) for your project, go to **APIs & Services > Credentials**.
    *   Create a new API Key. **Restrict this key** to your website's domain to prevent unauthorized use.
    *   Ensure the **Maps JavaScript API**, **Places API**, and **Directions API** are enabled for your project.
    *   In your `.env.local` file, add the key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE`

2.  **Stripe API Keys**:
    *   In your [Stripe Dashboard](https://dashboard.stripe.com/), go to the Developers section to find your keys.
    *   In your `.env.local` file, add your secret key and your webhook signing secret:
        ```
        STRIPE_SECRET_KEY=sk_...
        STRIPE_WEBHOOK_SECRET=whsec_...
        ```

3.  **Final `.env.local` Example**: Your final `.env.local` file should look something like this:
    ```
    # Firebase Admin SDK
    GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type": "service_account", ...}'

    # Google Maps
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...

    # Stripe
    STRIPE_SECRET_KEY=sk_test_...
    STRIPE_WEBHOOK_SECRET=whsec_...
    ```

---

By completing this checklist, your backend and environment should be correctly configured, which should eliminate the source of the persistent startup and API errors.