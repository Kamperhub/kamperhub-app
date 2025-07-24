
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

2.  **A) Create the Firebase Browser Key (for `NEXT_PUBLIC_FIREBASE_API_KEY`):**
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `KamperHub Production Firebase Key`.
    *   **WEBSITE RESTRICTIONS:** Under "Application restrictions", select **"Websites"**. Add every domain where your app will run (add `/*` at the end):
        *   `kamperhub.com/*`
        *   `*.kamperhub.com/*`
        *   `kamperhub-s4hc2.firebaseapp.com/*`
        *   `kamperhub-s4hc2.web.app/*`
        *   (Add any other custom domains or App Hosting URLs here)
    *   **API RESTRICTIONS:** Select **"Restrict key"**. To ensure all Firebase services work correctly, it's safest to allow all the APIs that Firebase has enabled in your project for this key. You can refine this list later if you have a deep understanding of every API the Firebase Web SDK uses, but for go-live, **it is recommended to not remove the default list of APIs Firebase provides**. A typical list will include `Cloud Firestore API`, `Identity Toolkit API`, `Token Service API`, `Firebase Installations API`, etc.
    *   Click **Save**. Copy this new key. You will use it in your App Hosting configuration.

3.  **B) Create the Google Maps Browser Key (for `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):**
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `KamperHub Production Maps Key`.
    *   **API RESTRICTIONS:** Select **"Restrict key"** and choose only these two APIs:
        *   **Maps JavaScript API**
        *   **Places API (New)**
    *   **WEBSITE RESTRICTIONS:** Add the same list of production domains as in the previous step.
    *   Click **Save**. Copy this new key. You will use it in your App Hosting configuration.

4.  **C) Create the Server Key (for `GOOGLE_API_KEY`):**
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `Kamperhub Production Server Key`.
    *   **APPLICATION RESTRICTIONS:** Select **"None"**. This is critical. Do not add website restrictions.
    *   **API RESTRICTIONS:** Select **"Restrict key"** and choose only these three APIs:
        *   **Routes API**
        *   **Generative Language API (Gemini)**
        *   **Places API (New)**
    *   Click **Save**. Copy this new key. You will use it in your App Hosting configuration.

### **Step 1.3: CRITICAL - Configure App Check for Production (Est. 5 mins)**
(This section remains unchanged and correct)

---

## **Phase 2: Stripe Account Configuration for Production (Est. 10 mins)**
(This section remains unchanged and correct)

---

## **Phase 3: Firebase & Google Cloud Final Configuration**
(This section remains unchanged and correct)

---

## **Phase 4: Deployment to Firebase App Hosting**
(This section remains unchanged and correct)

---

## **Phase 5: Connect Custom Domain & Go Live**
(This section remains unchanged and correct)
