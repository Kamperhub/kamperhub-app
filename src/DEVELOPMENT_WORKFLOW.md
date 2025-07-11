# KamperHub Development & Deployment Workflow

This document outlines the safe and standard process for developing new features, fixing bugs, and deploying changes to your live production application hosted on Firebase App Hosting.

---

## **Understanding Your Environments**

You have two distinct and separate environments:

1.  **Development (Your Workspace):** This is the environment you are currently working in.
    *   **Purpose:** A safe "sandbox" for building and testing.
    *   **Configuration:** Uses the keys and settings from your `.env.local` file.
    *   **Impact:** Changes made here **DO NOT** affect your live website. You can experiment, break things, and fix them without any user ever seeing it.

2.  **Production (Your Live Website):** This is the live `kamperhub.com` website that your users see.
    *   **Purpose:** To serve your stable, tested application to the public.
    *   **Configuration:** Uses the secure, production-specific environment variables you set up in the Firebase App Hosting console.
    *   **Impact:** This is the public-facing version of your app.

---

## **The Development-to-Live Workflow**

The process of getting a change from your development workspace to your live website is simple and safe. It ensures you are in full control of when updates go live.

### **Step 1: Develop and Test in Your Workspace**

*   Work with your AI partner or on your own to make code changes, add features, or fix bugs in this development environment.
*   Use the "Preview" window to thoroughly test your changes and ensure they work exactly as you expect.
*   This is the creative phase. Feel free to make as many changes as you need.

### **Step 2: Commit Your Changes**

*   Once you are satisfied that a feature or fix is complete and working correctly, you need to "commit" your changes using Git.
*   A commit is like a permanent, named snapshot of your work. It's a record of what you changed.
*   **Example command:** `git commit -am "feat: Add new Journeys feature to the trip manager"`

### **Step 3: Push to GitHub to Deploy**

*   This is the **only step that triggers a live deployment.**
*   Push your committed changes to your connected GitHub repository.
*   **Example command:** `git push`
*   Firebase App Hosting will automatically detect this push, start building a new version of your application with your latest changes, and then deploy it to your live website. You can monitor this process in the Firebase App Hosting console.

---

## **Troubleshooting**

*   **"I see an error on my live site, but not in development."**
    *   This almost always points to a configuration difference. Double-check that all necessary environment variables from your `.env.local` file have been correctly copied to your **production environment variables** in the Firebase App Hosting settings, using your **production keys**.
*   **"My latest change didn't appear on the live site."**
    *   Check your Firebase App Hosting console to see the build history. Ensure your latest `git push` triggered a new build and that the build completed successfully. If it failed, the logs there will tell you why.
*   **"I made a mistake and need to revert."**
    *   The safest way to revert a change is to use Git to go back to a previous commit and then `git push` that older, stable version. This will trigger a new deployment of the old code, effectively rolling back the change.

By following this workflow, you maintain a stable live application while having complete freedom to develop and test new ideas in a safe environment.
