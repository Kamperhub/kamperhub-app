
# KamperHub Go-Live Production Checklist

> [!WARNING]
> This guide is for deploying your application to a **live, public production environment**. It assumes you have already completed the local development setup using `FIREBASE_SETUP_CHECKLIST.md`. The steps below are critical for security and functionality.

---

## **Phase 1: Firebase Project Configuration for Production**

Your Firebase project (`kamperhub-s4hc2`) needs to be configured for live traffic. This involves securing your database, creating production-ready API keys, and setting up App Check.

### **Step 1.1: Secure Your Firestore Database (Est. 2 mins)**
(Unchanged and Correct)

### **Step 1.2: CRITICAL - Create Production API Keys (Est. 10 mins)**

> [!CAUTION]
> **Do not reuse your local development API keys in production.** Your public (browser) keys are visible in your website's code. If they are not restricted to your live domain, anyone could steal them and use them, potentially running up a large bill on your account.

1.  Go to the [Google Cloud Credentials page for kamperhub-s4hc2](https://console.cloud.google.com/apis/credentials?project=kamperhub-s4hc2).

2.  **A) Create the Firebase Browser Key (for `NEXT_PUBLIC_FIREBASE_API_KEY`):**
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `KamperHub Production Firebase Key`.
    *   **WEBSITE RESTRICTIONS:** Under "Application restrictions", select **"Websites"**. Add every single domain where your web app will run (add `/*` at the end of each):
        *   `kamperhub.com/*` (your primary custom domain)
        *   `*.kamperhub.com/*` (to cover subdomains like `www`)
        *   `kamperhub-s4hc2.firebaseapp.com/*` (Firebase Hosting default domain)
        *   `kamperhub-s4hc2.web.app/*` (Firebase Hosting default domain)
    *   **API RESTRICTIONS:** Select **"Restrict key"** and choose only these two APIs:
        *   **Identity Toolkit API**
        *   **Firebase App Check API**
    *   Click **Save**. Copy this new key. You will use it in your App Hosting configuration.

3.  **B) Create the Google Maps Browser Key (for `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):**
    *   Click **"+ CREATE CREDENTIALS"** -> **"API Key"**. Name it `KamperHub Production Maps Key`.
    *   **WEBSITE RESTRICTIONS:** Under "Application restrictions", select **"Websites"**. Add the same list of production domains as in the previous step.
    *   **API RESTRICTIONS:** Select **"Restrict key"** and choose only these two APIs:
        *   **Maps JavaScript API**
        *   **Places API (New)**
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
(Unchanged and Correct)

---

(The remaining phases of this document are correct and do not need changes.)
