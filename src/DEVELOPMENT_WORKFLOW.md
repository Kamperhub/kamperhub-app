
# KamperHub Development & Deployment Workflow

This document outlines the safe and standard process for developing new features, fixing bugs, and deploying changes to your live production application hosted on Firebase App Hosting.

---

## 1. Understanding Your Environments

You have two distinct and separate environments:

1.  **Development (Your Workspace):** This is the environment you are currently working in.
    *   **Purpose:** A safe "sandbox" for building and testing.
    *   **Configuration:** Uses the keys and settings from your `.env.local` file.
    *   **Impact:** Changes made here **DO NOT** affect your live website. You can experiment, break things, and fix them without any user ever seeing it.

2.  **Production (Your Live Website):** This is the live `kamperhub.com` website that your users see.
    *   **Purpose:** To serve your stable, tested application to the public.
    *   **Configuration:** Uses the secure, production-specific environment variables you set up in **Google Secret Manager**.
    *   **Impact:** This is the public-facing version of your app.

---

## 2. CRITICAL: How to Manage Your Keys (Secrets)

This is the most important concept for security and managing your application correctly.

*   ### **For Development, use `.env.local`**
    *   This file is **only** for your local development environment.
    *   It should contain your **test keys** from Stripe and your unrestricted (or `localhost` / `*.cloudworkstations.dev`-enabled) keys from Google.
    *   It is fast and easy to edit for local testing.
    *   It is **never** committed to your GitHub repository, so it stays on your machine.

*   ### **For Production, use Google Secret Manager**
    *   This is the **single source of truth** for your live application's secrets.
    *   It should contain your **live keys** from Stripe and your production-restricted keys from Google.
    *   To update a key for your live website (e.g., changing your Stripe key), you will make the change in Google Secret Manager. Your live app will securely load the new key on its next deployment or restart.
    *   **NEVER put live production keys in your `.env.local` file.**

---

## 3. The Development-to-Live Workflow

The process of getting a code change from your development workspace to your live website is simple and safe.

### Step 3.1: Develop and Test in Your Workspace

*   Work with your AI partner or on your own to make code changes, add features, or fix bugs in this development environment.
*   Use the "Preview" window to thoroughly test your changes and ensure they work exactly as you expect.
*   This is the creative phase. Feel free to make as many changes as you need.

### Step 3.2: Commit Your Changes

*   Once you are satisfied that a feature or fix is complete and working correctly, you need to "commit" your changes using Git.
*   A commit is like a permanent, named snapshot of your work. It's a record of what you changed.
*   **Example command:** `git commit -am "feat: Add new Journeys feature to the trip manager"`

### Step 3.3: Push to GitHub to Deploy

*   This is the **only step that triggers a live deployment.**
*   Push your committed changes to your connected GitHub repository.
*   **Example command:** `git push`
*   Firebase App Hosting will automatically detect this push, start building a new version of your application with your latest changes, securely inject the secrets from **Google Secret Manager**, and then deploy it to your live website. You can monitor this process in the Firebase App Hosting console.

---

## 4. Troubleshooting

*   **"I see an error on my live site, but not in development."**
    *   This almost always points to a configuration difference. Double-check that all necessary environment variables from your `.env.local` file have a corresponding secret in **Google Secret Manager** and that the values are the correct **production keys**.
*   **"My latest change didn't appear on the live site."**
    *   Check your Firebase App Hosting console to see the build history. Ensure your latest `git push` triggered a new build and that the build completed successfully. If it failed, the logs there will tell you why.
*   **"I made a mistake and need to revert."**
    *   The safest way to revert a change is to use Git to go back to a previous commit and then `git push` that older, stable version. This will trigger a new deployment of the old code, effectively rolling back the change.

By following this workflow, you maintain a stable live application while having complete freedom to develop and test new ideas in a safe environment.
