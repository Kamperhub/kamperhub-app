# KamperHub Go-Live Production Checklist

> [!WARNING]
> This guide is for deploying your application to a **live, public production environment**. It assumes you have already completed the local development setup using `FIREBASE_SETUP_CHECKLIST.md`. The steps below are critical for security and functionality.

---

## **Phase 1: Firebase Project Configuration for Production**

Your Firebase project (`kamperhub-s4hc2`) needs to be configured for live traffic. This involves securing your database, creating production-ready API keys, and setting up App Check.

### **Step 1.1: Secure Your Firestore Database (Est. 2 mins)**

Your local development started in "test mode". For production, you must switch to secure rules.

1.  Go to the [Firebase Console Rules Editor for your project](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/firestore/rules).
2.  Ensure the **`(default)`** database is selected from the dropdown at the top.
3.  Replace any existing rules with the contents of the `firestore.rules` file from your project. This ensures only authenticated users can access their own data.
4.  Click **Publish**.

### **Step 1.2: CRITICAL - Create Production API Keys (Est. 10 mins)**

> [!CAUTION]
> **Do not reuse your unrestricted local development API key in production.** Your public (browser) key is visible in your website's code. If it's unrestricted, anyone could steal it and use it, potentially running up a large bill on your account. Creating new, restricted keys is a critical security step.

1.  Go to the [Google Cloud Credentials page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials?project=kamperhub-s4hc2).

2.  **A) Create the Firebase Browser Key (for `NEXT_PUBLIC_FIREBASE_API_KEY`):**
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `KamperHub Production Firebase Key`.
    *   **API RESTRICTIONS:** Select **"Restrict key"**. To ensure all Firebase services work, it's safest to allow all APIs that are enabled in your project. You can refine this list later if you have a deep understanding of every API the Firebase Web SDK uses, but for now, **do not remove the default list**.
    *   **WEBSITE RESTRICTIONS:** Under "Application restrictions", select **"Websites"**. Add every domain where your app will run (add `/*` at the end):
        *   `kamperhub.com/*`
        *   `*.kamperhub.com/*`
        *   `kamperhub-s4hc2.firebaseapp.com/*`
        *   `kamperhub-s4hc2.web.app/*`
        *   (Add any other custom domains or App Hosting URLs here)
    *   Click **Save**. Copy this new key. You will use it in your App Hosting configuration.

3.  **B) Create the Google Maps Browser Key (for `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):**
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `KamperHub Production Maps Key`.
    *   **API RESTRICTIONS:** Select **"Restrict key"** and choose only these two APIs:
        *   **Maps JavaScript API**
        *   **Places API (New)**
    *   **WEBSITE RESTRICTIONS:** Add the same list of production domains as in the previous step.
    *   Click **Save**. Copy this new key. You will use it in your App Hosting configuration.

4.  **C) Create the Server Key (for `GOOGLE_API_KEY`)**
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `Kamperhub Production Server Key`.
    *   **APPLICATION RESTRICTIONS:** Select **"None"**. This is critical. Do not add website restrictions.
    *   **API RESTRICTIONS:** Select **"Restrict key"** and choose only these three APIs:
        *   **Routes API**
        *   **Gemini API**
        *   **Places API (New)**
    *   Click **Save**. Copy this new key. You will use it in your App Hosting configuration.

### **Step 1.3: CRITICAL - Configure App Check for Production (Est. 5 mins)**
App Check protects your backend resources from abuse.

1.  In the Firebase Console for `kamperhub-s4hc2`, go to **App Check** in the "Build" menu.
2.  In the "Apps" tab, click your web application's name.
3.  Click **reCAPTCHA Enterprise** and then click **"Save"**.
4.  In the "APIs" tab, select **Firestore** and click **"Enforce"**. Acknowledge the warning. Repeat for **Cloud Storage**.
5.  **Important:** You will need to get a new reCAPTCHA Enterprise Site Key for your live domain (`kamperhub.com`) and add it to your production environment variables.

---

## **Phase 2: Stripe Account Configuration for Production (Est. 10 mins)**
You must switch from "Test mode" to "Live mode" in Stripe.

1.  In your [Stripe Dashboard](https://dashboard.stripe.com/), toggle the switch in the top-right corner from "Test mode" to **"Live mode"**.
2.  **Get Live Secret Key:** Go to the "Developers" -> "API keys" section. Copy your **Live Secret Key** (it starts with `sk_live_...`). This is the value for your `STRIPE_SECRET_KEY` secret in production.
3.  **Re-create Your Product:** Go to the **Product catalogue** and re-create your "KamperHub Pro" product and price, just as you did in test mode.
4.  **Create a Live Payment Link:**
    *   Create a new Payment Link for your live product.
    *   **CRITICAL:** Under "After payment", set the redirect to your **live production URL**, e.g., `https://kamperhub.com/subscribe/success`.
    *   Copy this new live payment link. This is the value for your `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` secret.
5.  **Create a Live Webhook Endpoint:**
    *   Go to "Developers" -> "Webhooks". Click **"+ Add endpoint"**.
    *   **Endpoint URL:** Enter your live application URL followed by the webhook path: `https://kamperhub.com/api/stripe-webhook`.
    *   **Events:** Listen for the same events as in development (e.g., `checkout.session.completed`, `customer.subscription.deleted`, etc.).
    *   Click **Add endpoint**.
    *   On the endpoint details page, reveal and copy the **Signing secret** (it starts with `whsec_...`). This is the value for your `STRIPE_WEBHOOK_SECRET` secret.

---

## **Phase 3: Firebase & Google Cloud Final Configuration**

### **Step 3.1: Configure Production Google OAuth (Est. 5 mins)**

Your Google login needs to trust your live domain.

1.  Go to the [Google Cloud Credentials page for your project](https://console.cloud.google.com/apis/credentials).
2.  Click on the name of your **OAuth 2.0 Client ID**.
3.  Under **"Authorized redirect URIs"**, click **"+ ADD URI"**.
4.  Enter your live application's redirect URI: `https://kamperhub.com/api/auth/google/callback` (and any other domains, like `https://www.kamperhub.com/...`).
5.  Click **Save**.

### **Step 3.2: Confirm Firestore Backups (Est. 2 mins)**

1.  In the Firebase Console, go to the **Firestore Database** section.
2.  Select the **`(default)`** database.
3.  Click the **"Backups"** tab.
4.  Ensure that automated daily backups are enabled and configured to a schedule you are comfortable with.

---

## **Phase 4: Deployment to Firebase App Hosting**

### **Step 4.1: Create a Production Backend in App Hosting (Est. 5 mins)**

1.  In the Firebase Console, go to **App Hosting**.
2.  Click **"Create backend"**. Give it a name like `kamperhub-prod`.
3.  Connect it to your GitHub repository.
4.  **CRITICAL - Set Environment Variables:**
    *   This is where you will add all the **production keys** you created in the steps above.
    *   For each variable in your `.env.local` file (like `STRIPE_SECRET_KEY`), you will add it as a secret in the App Hosting setup.
    *   **Set `NEXT_PUBLIC_APP_ENV` to `production`**.
    *   **Set `NEXT_PUBLIC_SHOW_ENV_BANNER` to `false`**.
    *   For the `GOOGLE_APPLICATION_CREDENTIALS_JSON`, you will paste the entire single-line Base64 encoded string of your production service account key.

### **Step 4.2: Trigger Your First Production Deployment**

1.  Commit all your latest, stable code changes to your main branch.
2.  Push your commit to GitHub: `git push origin main`.
3.  App Hosting will automatically detect the push, build your application using the production environment variables, and deploy it. You can monitor the progress in the App Hosting dashboard.

---

## **Phase 5: Connect Custom Domain & Go Live**

1.  Once your backend is deployed and running, go to the App Hosting dashboard for your production backend.
2.  Click **"Add custom domain"**.
3.  Follow the instructions to add `kamperhub.com` (and `www.kamperhub.com`). This will involve adding DNS records (like A records and TXT records) at your domain registrar (e.g., GoDaddy, Namecheap, Google Domains).
4.  Firebase will automatically provision an SSL certificate for your domain. This can take a few minutes to a few hours.
5.  Once the domain is verified and connected, your site will be live to the world!

Congratulations on your launch!
