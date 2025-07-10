
# KamperHub Go-Live Production Checklist

> [!WARNING]
> This guide is for deploying your application to a **live, public production environment**. It assumes you have already completed the local development setup using `FIREBASE_SETUP_CHECKLIST.md`. The steps below are critical for security and functionality.

---

## **Phase 1: Firebase Project Configuration for Production**

Your Firebase project (`kamperhub-s4hc2`) needs to be configured for live traffic. This involves securing your database and creating production-ready API keys.

### **Step 1.1: Secure Your Firestore Database**

Your local development started in "test mode". For production, you must switch to secure rules.

1.  Go to the [Firebase Console Rules Editor for kamperhubv2](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/firestore/databases/-kamperhubv2-/rules).
2.  Ensure the **`kamperhubv2`** database is selected from the dropdown at the top.
3.  Replace any existing rules with the contents of the `firestore.rules` file from your project. This ensures only authenticated users can access their own data.
4.  Click **Publish**.

### **Step 1.2: CRITICAL - Create Production API Keys**

> [!CAUTION]
> **Do not reuse your unrestricted local development API key in production.** Your public (browser) key is visible in your website's code. If it's unrestricted, anyone could steal it and use it, potentially running up a large bill on your account. Creating new, restricted keys is a critical security step.

1.  Go to the [Google Cloud Credentials page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials?project=kamperhub-s4hc2).

2.  **Create a Browser Key (for the client-side):**
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**.
    *   Name it `KamperHub Browser Key`.
    *   Under **"Application restrictions"**, select **"Websites"**.
    *   Click **"ADD"** and enter your production domain (e.g., `https://kamperhub.com/*`). This locks the key so it only works on your website.
    *   Under **"API restrictions"**, select **"Restrict key"** and choose only the APIs the browser needs:
        *   Maps JavaScript API
        *   Places API
    *   Click **Save**.
    *   Copy this key. You will use it for `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in your App Hosting configuration.

3.  **Create a Server Key (for the backend):**
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**.
    *   Name it `KamperHub Server Key (No Referrer Restrictions)`.
    *   Under **"Application restrictions"**, select **"None"**. **Do NOT add website or IP restrictions to this key.** Server-to-server calls do not have an HTTP referrer and will be blocked if you add one. Its security comes from being kept secret on the server.
    *   Under **"API restrictions"**, select **"Restrict key"** and choose only the APIs the server needs:
        *   Routes API
        *   Generative Language API
        *   Google Tasks API
    *   Click **Save**.
    *   Copy this key. You will use it for `GOOGLE_API_KEY` in your App Hosting configuration.

> [!NOTE]
> The `GOOGLE_APPLICATION_CREDENTIALS_JSON` service account key that you used for local development **does not need to change**. It is already secure and should be copied directly from your `.env.local` file to your App Hosting secret configuration.

---

## **Phase 2: Stripe Account Configuration for Production**

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

## **Phase 3: Deployment to Firebase App Hosting**

### **Step 3.1: Connect Your GitHub Repository**

1.  Go to the [Firebase App Hosting console for kamperhub-s4hc2](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/hosting/backends).
2.  Follow the prompts to connect to GitHub and select the repository for your KamperHub application.

### **Step 3.2: Configure the Production Backend**

1.  Once connected, a backend will be created. Click on it to manage its configuration.
2.  Navigate to the **"Settings"** tab for your backend.
3.  This is where you will add all the environment variables from your `.env.local` file, but with your **production keys**.
    *   `NEXT_PUBLIC_FIREBASE_*`: Use the values from your Firebase Console project settings.
    *   `GOOGLE_APPLICATION_CREDENTIALS_JSON`: **Use the same one-line JSON string** for your service account key that you used in local development.
    *   `GOOGLE_API_KEY`: Use the **KamperHub Server Key** you created in Step 1.2.
    *   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Use the **KamperHub Browser Key** you created in Step 1.2.
    *   `NEXT_PUBLIC_APP_URL`: Set this to `https://kamperhub.com`
    *   `STRIPE_SECRET_KEY`: Use the **live** secret key (`sk_live_...`) from Step 2.4.
    *   `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`: Use the **live** payment link URL from Step 2.3.
    *   `STRIPE_WEBHOOK_SECRET`: Use the **live** webhook signing secret (`whsec_...`) from Step 2.5.
    *   `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: These remain the same as your dev setup.

4.  **Save** the environment variables. This will trigger a new build and deployment of your application.

---

## **Phase 4: Connect Custom Domain & Go Live**

### **Step 4.1: Add Your Custom Domain**

1.  In the App Hosting console for your backend, navigate to the **"Domains"** tab.
2.  Click **"Add custom domain"**.
3.  Enter `kamperhub.com` as your domain. App Hosting will also provision `www.kamperhub.com`.
4.  Firebase will provide you with DNS records (usually two `A` records) that you need to add to your domain registrar (GoDaddy).

### **Step 4.2: Configure DNS at GoDaddy**

1.  Log in to your GoDaddy account.
2.  Navigate to your DNS Management page for `kamperhub.com`.
3.  Add or update the `A` records for both `kamperhub.com` and `www.kamperhub.com` to point to the IP addresses provided by Firebase App Hosting.
4.  Save your changes. DNS propagation can take anywhere from a few minutes to 48 hours.

### **Step 4.3: Verify Domain and SSL**

1.  Back in the Firebase App Hosting console, wait for the domain status to change to "Connected". Firebase will automatically provision and manage an SSL certificate for your domain, which may take some time.

### **Step 4.4: Final Production Check**

1.  Once your domain is connected and SSL is active, navigate to `https://kamperhub.com`.
2.  Create a new user account to ensure the signup flow works in production.
3.  Test the Stripe subscription flow with a real payment method.
4.  Test the Google Tasks integration.
5.  Test the trip planner to ensure all Google Maps APIs are working correctly with the restricted keys.

**Congratulations! Your KamperHub application is now live.**
