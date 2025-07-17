
# KamperHub Go-Live Production Checklist

> [!CAUTION]
> **This checklist has been updated to use Google Secret Manager, the official and most secure way to handle production secrets for Firebase App Hosting.** It replaces all previous instructions about a "secret config" page.

---

## **Phase 1: Firebase Project Configuration for Production**

### **Step 1.1: Secure Your Firestore Database (Est. 2 mins)**

1.  Go to the [Firebase Console Rules Editor for kamperhubv2](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/firestore/databases/-kamperhubv2-/rules).
2.  Ensure the **`kamperhubv2`** database is selected.
3.  Replace any existing rules with the contents of the `firestore.rules` file from your project.
4.  Click **Publish**.

### **Step 1.2: CRITICAL - Create Production API Keys (Est. 10 mins)**

1.  Go to the [Google Cloud Credentials page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials?project=kamperhub-s4hc2).
2.  **Create a Browser Key (for `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):**
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `Kamperhub Browser Key`.
    *   Under **"Application restrictions"**, select **"Websites"**. Remove any `localhost` URLs and add your production domain (e.g., `https://kamperhub.com/*`).
    *   Under **"API restrictions"**, restrict the key to **Maps JavaScript API** and **Places API**.
    *   Copy this key. You will use it in Step 1.4.

3.  **Create a Server Key (for `GOOGLE_API_KEY`):**
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `Kamperhub Server Key`.
    *   Under **"Application restrictions"**, select **"None"**.
    *   Under **"API restrictions"**, restrict the key to **Routes API** and **Gemini API**.
    *   Copy this key. You will use it in Step 1.4.

### **Step 1.3: CRITICAL - Configure Production App Check (Est. 5 mins)**
(This section remains the same)

1.  Go to the [Firebase App Check page for kamperhub-s4hc2](https://console.firebase.google.com/project/kamperhub-s4hc2/appcheck/apps).
2.  Select your web app, go to the **Providers** tab, and enable **reCAPTCHA Enterprise**.
3.  Go to the [reCAPTCHA Enterprise page](https://console.cloud.google.com/security/recaptcha?project=kamperhub-s4hc2).
4.  Click **"+ CREATE KEY"**, give it a label (e.g., `KamperHub Production Key`), select **Website**, add your production domain, and uncheck the checkbox challenge.
5.  Copy the **Site Key ID**. You will use this in the next step.

---

## **Phase 2: Securely Store All Your Production Secrets**

> [!IMPORTANT]
> This is the official process for managing secrets. You will add each secret key/value from your `.env.local` file (but using your live production keys) into **Google Secret Manager**.

### **Step 2.1: Go to Google Secret Manager**
1.  Open the [Google Cloud Secret Manager page for kamperhub-s4hc2](https://console.cloud.google.com/security/secret-manager?project=kamperhub-s4hc2).

### **Step 2.2: Create a Secret for Each Environment Variable**
You will repeat this process for **every single variable** in your `.env.local` file.

1.  Click **"+ CREATE SECRET"** at the top.
2.  **Name:** Enter the **exact variable name** from your `.env.local` file (e.g., `STRIPE_SECRET_KEY`).
3.  **Secret value:** Paste the corresponding **live production value** (e.g., your `sk_live_...` key).
4.  Leave all other settings as default and click **"Create secret"**.
5.  **Repeat this for all variables**, including `GOOGLE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS_JSON` (paste the entire one-line JSON string as the value), etc.

### **Step 2.3: Grant Permissions to Your App Hosting Backend**
Your App Hosting backend needs permission to read the secrets you just created.

1.  Go to the [Google Cloud IAM page for kamperhub-s4hc2](https://console.cloud.google.com/iam-admin/iam?project=kamperhub-s4hc2).
2.  Find the principal (the "user") that looks like `service-PROJECT_NUMBER@gcp-sa-apphosting.iam.gserviceaccount.com`. This is your App Hosting backend's identity.
3.  Click the pencil icon to edit its roles.
4.  Click **"+ ADD ANOTHER ROLE"**.
5.  In the "Select a role" filter, type **`Secret Manager Secret Accessor`** and select it.
6.  Click **Save**.

---

## **Phase 3: Update `apphosting.yaml` to Use Secrets**

Your `apphosting.yaml` file tells Firebase App Hosting which secrets to load into your application as environment variables. It has been pre-filled for you with all the necessary secret references. You do not need to edit this file unless you add new secrets.

---

## **Phase 4: Final Configuration & Deployment**

### **Step 4.1: Finalize Stripe and Google Cloud Settings**
*   **Stripe:** Create your live product, payment link, and webhook (pointing to `https://kamperhub.com/api/stripe-webhook`).
*   **Google Cloud:** Ensure your production browser API key has the correct "HTTP Referrer" restriction for `kamperhub.com`. Ensure your OAuth Redirect URI is set to `https://kamperhub.com/api/auth/google/callback`.

### **Step 4.2: Deploy Your Application**
1.  Commit all your latest code changes.
2.  Push your changes to your GitHub repository by running `git push`.
3.  Firebase App Hosting will automatically detect the push, build your application, securely inject the secrets you configured, and deploy the new version to your custom domain.
