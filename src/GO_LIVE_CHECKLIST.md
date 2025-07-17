
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
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `KamperHub Server Key`.
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
> [!WARNING]
> This is a critical step. Without this permission, your live application will not be able to read its API keys and will fail to start.

Your App Hosting backend needs permission to read the secrets you just created.

1.  Go to the [Google Cloud IAM page for kamperhub-s4hc2](https://console.cloud.google.com/iam-admin/iam?project=kamperhub-s4hc2).
2.  Find the principal (the "user") that looks like `service-PROJECT_NUMBER@gcp-sa-apphosting.iam.gserviceaccount.com`. This is your App Hosting backend's identity.
3.  Click the pencil icon ✏️ to edit its roles.
4.  Click **"+ ADD ANOTHER ROLE"**.
5.  In the "Select a role" filter, type **`Secret Manager Secret Accessor`** and select it from the list.
6.  Click **Save**.

### **Step 2.4: CRITICAL - Set Least-Privilege Roles for Security**
> [!IMPORTANT]
> For the best security, your service account should only have the permissions it absolutely needs. Overly broad roles like "Editor" or "Firebase Admin" should be removed in a production environment.

1.  Go to the [Google Cloud IAM page for kamperhub-s4hc2](https://console.cloud.google.com/iam-admin/iam?project=kamperhub-s4hc2).
2.  Find the service account you are using for the backend (its email address is in the `client_email` field of your `GOOGLE_APPLICATION_CREDENTIALS_JSON`). It usually looks like `firebase-adminsdk-...@...gserviceaccount.com`.
3.  Click the pencil icon ✏️ to edit its roles.
4.  **Ensure it has the following essential roles:**
    *   **`Cloud Datastore User`**: Allows reading and writing to the Firestore database.
    *   **`Firebase Authentication Admin`**: Allows managing users (needed for the admin page).
    *   **`Service Account Token Creator`**: Needed for some internal Google Cloud operations.
5.  **For maximum security, REMOVE the following broad roles if they exist:**
    *   `Editor`
    *   `Firebase Admin`
    *   `Owner`
6.  Click **Save**.

---

## **Phase 3: Update `apphosting.yaml` to Use Secrets**

> [!WARNING]
> ### Critical Security Notice: Where to Store Secrets
> **DO NOT** add your secret keys/values directly into the `apphosting.yaml` file. That file is for public infrastructure configuration and is committed to your repository.
>
> All secret keys **MUST** be added to **Google Secret Manager** as described in Phase 2. The `apphosting.yaml` file below is correctly configured to **reference** those secrets securely.

Your `apphosting.yaml` file tells Firebase App Hosting which secrets to load into your application as environment variables. It has been pre-filled for you with all the necessary secret references. You should not need to edit this file unless you add new secrets.

---

## **Phase 4: Connect Custom Domain & Go Live**

> [!CAUTION]
> **If you are seeing a `DNS_PROBE_FINISHED_NXDOMAIN` error, it means this step was done incorrectly or the DNS records were deleted.** Follow these instructions carefully to fix it.

### **Step 4.1: Find Your DNS Records in Firebase**

1.  Go to the [Firebase App Hosting Backends page for kamperhub-s4hc2](https://console.firebase.google.com/u/0/project/kamperhub-s4hc2/hosting/backends).
2.  Click on your backend's name to open its dashboard.
3.  Navigate to the **"Domains"** tab.
4.  Click **"Add custom domain"** (or view the existing domain if already added).
5.  Enter `kamperhub.com` as your domain. App Hosting will also provision `www.kamperhub.com`.
6.  Firebase will provide you with DNS records. You are looking for two **`A` records** and potentially a **`CNAME` record** for SSL verification. **Copy these values carefully.**

### **Step 4.2: Configure DNS at Your Domain Registrar (e.g., GoDaddy)**

1.  Log in to your domain registrar (e.g., GoDaddy).
2.  Navigate to your DNS Management page for `kamperhub.com`.
3.  **Delete any old or conflicting `A` or `CNAME` records** for `kamperhub.com` or `www.kamperhub.com` to avoid issues.

4.  **Add the `A` Records:**
    *   **First `A` Record:**
        *   **Type:** `A`
        *   **Name:** `@` (This symbol represents your root domain)
        *   **Value:** Paste the **first IP address** from Firebase.
        *   **TTL:** Leave as default.
    *   **Second `A` Record:**
        *   **Type:** `A`
        *   **Name:** `@`
        *   **Value:** Paste the **second IP address** from Firebase.
        *   **TTL:** Leave as default.

5.  **Add the SSL Verification `CNAME` Record (If Provided):**
    *   **CRITICAL:** This record proves you own the domain. Firebase will provide a `Name` (Host) and `Value` (Points to).
    *   **Type:** `CNAME`
    *   **Name/Host:** Paste **ONLY** the part of the name before `kamperhub.com`. For example, if Firebase gives you `_acme-challenge_xyz.kamperhub.com`, you will only enter `_acme-challenge_xyz`. Your DNS provider adds the rest automatically.
    *   **Value/Points To:** Paste the **entire** value provided by Firebase, which usually ends in `.goog.`.
    *   **TTL:** Leave as default.

6.  **`www` Record (Recommended):**
    *   Create a `CNAME` record to redirect `www.kamperhub.com` to `kamperhub.com`.
    *   **Type:** `CNAME`
    *   **Name:** `www`
    *   **Value:** `@`
    *   **TTL:** Leave as default.

7.  **Save all changes and wait for DNS Propagation.** This can take anywhere from a few minutes to 48 hours.

### **Step 4.3: Verify Domain and SSL in Firebase**

1.  Back in the Firebase App Hosting console ("Domains" tab), wait for the domain status to change to "Connected".
2.  Firebase will automatically provision and manage an SSL certificate for your domain, which may take some time.

---

## **Phase 5: Final Production Check**
1.  Once your domain is connected and SSL is active, navigate to `https://kamperhub.com`.
2.  The application should now display a "Production Mode" banner at the top (if `NEXT_PUBLIC_SHOW_ENV_BANNER` is enabled).
3.  Create a new user account to ensure the signup flow works in production.
4.  Test the Stripe subscription flow with a real payment method.
5.  Test the Google Tasks integration.
6.  Test the trip planner to ensure all Google Maps APIs are working correctly with the restricted keys.

**Congratulations! Your KamperHub application is now live.**
