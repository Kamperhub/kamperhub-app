
# KamperHub Go-Live Production Checklist

> [!WARNING]
> This guide is for deploying your application to a **live, public production environment**. It assumes you have already completed the local development setup using `FIREBASE_SETUP_CHECKLIST.md`. The steps below are critical for security and functionality.

---

## **Phase 1: Firebase Project Configuration for Production**

Your Firebase project (`kamperhub-s4hc2`) needs to be configured for live traffic. This involves securing your database, creating production-ready API keys, and setting up App Check.

### **Step 1.1: Secure Your Firestore Database (Est. 2 mins)**

Your local development started in "test mode". For production, you must switch to secure rules.

1.  Go to the [Firebase Console Rules Editor for kamperhubv2](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/firestore/databases/-kamperhubv2-/rules).
2.  Ensure the **`kamperhubv2`** database is selected from the dropdown at the top.
3.  Replace any existing rules with the contents of the `firestore.rules` file from your project. This ensures only authenticated users can access their own data.
4.  Click **Publish**.

### **Step 1.2: CRITICAL - Create Production API Keys (Est. 10 mins)**

> [!CAUTION]
> **Do not reuse your unrestricted local development API key in production.** Your public (browser) key is visible in your website's code. If it's unrestricted, anyone could steal it and use it, potentially running up a large bill on your account. Creating new, restricted keys is a critical security step.

1.  Go to the [Google Cloud Credentials page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials?project=kamperhub-s4hc2).

2.  **Create a Browser Key (for `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):**
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**.
    *   Name it `Kamperhub Browser Key`.
    *   Under **"Application restrictions"**, select **"Websites"**.
    *   Click **"ADD"** and enter your production domain (e.g., `https://kamperhub.com/*`). This locks the key so it only works on your website.
    *   Under **"API restrictions"**, select **"Restrict key"** and choose only the APIs the browser needs:
        *   Maps JavaScript API
        *   Places API (New)
    *   Click **Save**.
    *   Copy this key. You will use it for `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in your App Hosting configuration.

3.  **Create a Server Key (for `GOOGLE_API_KEY`):**
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**.
    *   Name it `Kamperhub Server Key`.
    *   Under **"Application restrictions"**, select **"None"**. **Do NOT add website or IP restrictions to this key.** Server-to-server calls do not have an HTTP referrer and will be blocked if you add one. Its security comes from being kept secret on the server.
    *   Under **"API restrictions"**, select **"Restrict key"** and choose only the APIs the server needs:
        *   Routes API
        *   Gemini API (also known as Generative Language API)
        *   Places API (New)
    *   Click **Save**.
    *   Copy this key. You will use it for `GOOGLE_API_KEY` in your App Hosting configuration.

### **Step 1.3: CRITICAL - Configure App Check for Production (Est. 5 mins)**

1.  **Enforce App Check for Services:**
    *   Go to the [Firebase App Check page for kamperhub-s4hc2](https://console.firebase.google.com/project/kamperhub-s4hc2/appcheck).
    *   In the "Services" tab, enforce App Check for **Cloud Firestore** and **Cloud Storage**. This is a critical security step to protect your backend.

2.  **Create and Configure the reCAPTCHA Key:**
    *   Go to the [Google Cloud reCAPTCHA Enterprise page for kamperhub-s4hc2](https://console.cloud.google.com/security/recaptcha?project=kamperhub-s4hc2).
    *   Click **"+ CREATE KEY"** at the top.
    *   **Label:** Give it a name like `KamperHub Production Key`.
    *   **Choose integration type:** Select **Website**.
    *   **Domains:**
        *   **CRITICAL:** Add your live production domain (e.g., `kamperhub.com`).
        *   **CRITICAL:** Remove `localhost` if it exists. Production keys should not work on local development.
    *   **Use reCAPTCHA checkbox:** Uncheck this box for score-based, invisible protection.
    *   **Click "CREATE KEY"**.

3.  **Get and Set the Site Key:**
    *   After creation, copy the **site key ID**.
    *   You will use this key for the `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY` variable in your **App Hosting backend configuration**.

> [!NOTE]
> The `GOOGLE_APPLICATION_CREDENTIALS_JSON` service account key that you used for local development **does not need to change**. It is already secure and should be copied directly from your `.env.local` file to your App Hosting secret configuration.

---

## **Phase 2: Stripe Account Configuration for Production (Est. 10 mins)**

Now, you'll switch Stripe from "Test mode" to "Live mode" and configure your real product and webhooks.

### **Step 2.1: Switch to Live Mode**

1.  Go to your [Stripe Dashboard](https://dashboard.stripe.com/login).
2.  In the top-right corner, toggle the switch from **"Test mode"** to **"Live mode"**. All actions from this point must be in Live mode.

### **Step 2.2: Create Your Live Product**

1.  Go to the **Product catalogue**.
2.  Click **+ Add product** and create your `KamperHub Pro` subscription product with its live price, just as you did in the test mode checklist.

### **Step 2.3: Create and Configure the Live Payment Link**

1.  From your new live product page, click **Create payment link**.
2.  **CRITICAL:** Under the **"After payment"** section, select **"Redirect customers to your website"**.
3.  Enter the production URL for the success page: `https://kamperhub.com/subscribe/success`
4.  Click **Create link**.
5.  Copy the live payment link URL (it will start with `https://buy.stripe.com/...`).

### **Step 2.4: Get Your Live API Keys**

1.  Go to the [Stripe Developer Dashboard API Keys page](https://dashboard.stripe.com/apikeys).
2.  Ensure you are still in **"Live mode"**.
3.  Copy your **"Publishable key"** (starts with `pk_live_...`). This is not used by the backend but is good practice to note.
4.  Reveal and copy your **"Secret key"** (starts with `sk_live_...`).

### **Step 2.5: Configure the Live Webhook**

This step is different from local development. You will *not* use the Stripe CLI.

1.  Go to the [Stripe Webhooks dashboard](https://dashboard.stripe.com/webhooks).
2.  Click **"+ Add endpoint"**.
3.  For **"Endpoint URL"**, enter your production webhook URL: `https://kamperhub.com/api/stripe-webhook`
4.  For **"Version"**, select the latest API version.
5.  Click **"+ Select events"** and select the following events to ensure all subscription status changes are captured:
    *   `checkout.session.completed`
    *   `customer.subscription.updated`
    *   `customer.subscription.deleted`
    *   `invoice.paid`
    *   `invoice.payment_failed`
6.  Click **Add endpoint**.
7.  On the next page, under **"Signing secret"**, click **"Click to reveal"**.
8.  Copy this signing secret (starts with `whsec_...`). This is your production webhook secret.

---

## **Phase 3: Firebase & Google Cloud Final Configuration**

### **Step 3.5: CRITICAL - Verify Google Cloud APIs Are Enabled (Est. 5 mins)**

> [!IMPORTANT]
> **Understanding Costs:** Simply **enabling** these APIs does **not** incur any costs. Billing is based on **usage**. Google provides a generous monthly free tier for most services (e.g., a $200 recurring credit for Maps Platform). For a new application, your usage will very likely fall within this free tier. However, you must still have a billing account enabled on your project to use them.

1.  **Go to the [Google Cloud APIs & Services Dashboard for kamperhub-s4hc2](https://console.cloud.google.com/apis/dashboard?project=kamperhub-s4hc2).**

2.  Click **"Enable APIs and Services"** at the top. You must search for and enable the following APIs if they are not already enabled.

3.  **Client-Side APIs** (Used by `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):
    *   **Maps JavaScript API**
    *   **Places API (New)** (Note: Ensure you enable the one named exactly "Places API (New)").

4.  **Server-Side APIs** (Used by `GOOGLE_API_KEY`):
    *   **Routes API**
    *   **Gemini API** (may be listed as "Generative Language API")
    *   **Places API (New)** (The same "Places API (New)" is required by the server).

5.  **OAuth API** (Does not use an API key):
    *   **Google Tasks API**

### **Step 3.6: CRITICAL - Configure OAuth Consent Screen & Credentials (Est. 5 mins)**

> [!WARNING]
> **If you see a `403 That's an error... you do not have access` or `redirect_uri_mismatch` page from Google when trying to connect your account, it means this step was missed or done incorrectly.**

This step is mandatory for allowing users to connect their Google Accounts (for features like Google Tasks).

1.  **Go to the [OAuth Consent Screen page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials/consent?project=kamperhub-s4hc2).**
2.  **Set User Type:** If prompted, select **"External"** and click **Create**.
3.  **Fill in App Information:**
    *   **App name:** KamperHub
    *   **User support email:** Select your email address.
    *   **Developer contact information:** Enter your email address again.
    *   Click **"SAVE AND CONTINUE"** through the "Scopes" and "Optional Info" pages. You do not need to add scopes here.
4.  **Publishing Status - VERY IMPORTANT**:
    *   On the OAuth Consent Screen summary page, check the "Publishing status".
    *   If it says **"Testing"**, you can ONLY log in with Google accounts you have explicitly added as "Test users".
    *   If it says **"In production"**, any Google user can connect to the app. You should click the **"Publish App"** button to move it to production.
5.  **Verify OAuth Client ID Settings:**
    *   Go to the [Credentials page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials?project=kamperhub-s4hc2).
    *   Click on the name of your **OAuth 2.0 Client ID** (the one you used for `GOOGLE_CLIENT_ID`).
    *   **Part A: Authorized JavaScript origins:** This tells Google which web pages are allowed to *start* the sign-in flow.
        *   Under **"Authorized JavaScript origins"**, click **"+ ADD URI"**.
        *   Enter your app's production domain: `https://kamperhub.com`
    *   **Part B: Authorized redirect URIs:** This tells Google where it is allowed to *send the user back to* after they sign in.
        *   Under **"Authorized redirect URIs"**, click **"+ ADD URI"**.
        *   Enter the full callback URL for production: `https://kamperhub.com/api/auth/google/callback`
    *   Click **Save**.

---

## **Phase 4: Deployment to Firebase App Hosting**

### **Step 4.1: Connect Your GitHub Repository**

1.  Go to the [Firebase App Hosting console for kamperhub-s4hc2](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/hosting/backends).
2.  Follow the prompts to connect to GitHub and select the repository for your KamperHub application.

### **Step 4.2: Configure the Production Backend**

1.  Once connected, a backend will be created. Click on it to manage its configuration.
2.  Navigate to the **"Settings"** tab for your backend.
3.  This is where you will add all the environment variables from your `.env.local` file, but with your **production keys**.
    *   **CRITICAL: Set `NEXT_PUBLIC_APP_ENV` to `"production"`.** This tells the app it's in live mode.
    *   `NEXT_PUBLIC_FIREBASE_*`: Use the values from your Firebase Console project settings.
    *   `GOOGLE_APPLICATION_CREDENTIALS_JSON`: **Use the same one-line JSON string** for your service account key that you used in local development.
    *   `GOOGLE_API_KEY`: Use the **Kamperhub Server Key** you created in Step 1.2.
    *   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Use the **Kamperhub Browser Key** you created in Step 1.2.
    *   `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY`: Use the **production** site key from Step 1.3.
    *   `NEXT_PUBLIC_APP_URL`: Set this to `https://kamperhub.com`
    *   `STRIPE_SECRET_KEY`: Use the **live** secret key (`sk_live_...`) from Step 2.4.
    *   `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`: Use the **live** payment link URL from Step 2.3.
    *   `STRIPE_WEBHOOK_SECRET`: Use the **live** webhook signing secret (`whsec_...`) from Step 2.5.
    *   `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: These remain the same as your dev setup.

4.  **Save** the environment variables. This will trigger a new build and deployment of your application.

---

## **Phase 5: Connect Custom Domain & Go Live**

> [!CAUTION]
> **If you are seeing a `DNS_PROBE_FINISHED_NXDOMAIN` error, it means this step was done incorrectly or the DNS records were deleted.** Follow these instructions carefully to fix it.

### **Step 5.1: Find Your DNS Records in Firebase**

1.  Go to the [Firebase App Hosting Backends page for kamperhub-s4hc2](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/hosting/backends).
2.  Click on your backend's name to open its dashboard.
3.  Navigate to the **"Domains"** tab.
4.  Click **"Add custom domain"** (or view the existing domain if already added).
5.  Enter `kamperhub.com` as your domain. App Hosting will also provision `www.kamperhub.com`.
6.  Firebase will provide you with DNS records. You are looking for two **`A` records**. They will be two different IP addresses (e.g., `199.36.158.100` and `199.36.158.101`). **Copy these two IP addresses.**

### **Step 5.2: Configure DNS at GoDaddy**

1.  Log in to your GoDaddy account.
2.  Navigate to your DNS Management page for `kamperhub.com`.
3.  You need to create **two `A` records** to point your domain to Firebase. Delete any old `A` records for `kamperhub.com` first.
4.  **First `A` Record:**
    *   **Type:** `A`
    *   **Name:** `@` (This symbol represents your root domain, `kamperhub.com`)
    *   **Value:** Paste the **first IP address** you copied from Firebase.
    *   **TTL:** Leave as default (usually 1 hour).
    *   Click **Save**.
5.  **Second `A` Record:**
    *   **Type:** `A`
    *   **Name:** `@`
    *   **Value:** Paste the **second IP address** you copied from Firebase.
    *   **TTL:** Leave as default.
    *   Click **Save**.
6.  **`www` Record (Optional but Recommended):**
    *   Create a `CNAME` record to redirect `www.kamperhub.com` to `kamperhub.com`.
    *   **Type:** `CNAME`
    *   **Name:** `www`
    *   **Value:** `@`
    *   **TTL:** Leave as default.
    *   Click **Save**.

7.  **Wait for DNS Propagation.** DNS changes can take anywhere from a few minutes to 48 hours to take effect globally, but it is often much faster.

### **Step 5.3: Verify Domain and SSL in Firebase**

1.  Back in the Firebase App Hosting console ("Domains" tab), wait for the domain status to change to "Connected".
2.  Firebase will automatically provision and manage an SSL certificate for your domain, which may take some time.

### **Step 5.4: Final Production Check**

1.  Once your domain is connected and SSL is active, navigate to `https://kamperhub.com`.
2.  The application should now display a "Production Mode" banner at the top.
3.  Create a new user account to ensure the signup flow works in production.
4.  Test the Stripe subscription flow with a real payment method.
5.  Test the Google Tasks integration.
6.  Test the trip planner to ensure all Google Maps APIs are working correctly with the restricted keys.

**Congratulations! Your KamperHub application is now live.**

