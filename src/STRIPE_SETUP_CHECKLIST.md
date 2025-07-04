# Stripe Setup & Verification Checklist

> [!IMPORTANT]
> This guide covers setting up Stripe for **local development**. Production setup involves similar steps but uses "Live Mode" keys and webhooks configured in the Stripe Dashboard directly.

---

### Step 1: Find Your Stripe Secret Key (`sk_test_...`)

1.  Go to your [Stripe Developer Dashboard](https://dashboard.stripe.com/developers).

2.  **CRITICAL: Ensure "Test mode" is enabled.** The toggle is usually in the top-right corner. All keys for local development must come from Test Mode.

3.  Find your secret key:
    *   **`STRIPE_SECRET_KEY`**: This is your "Secret key". It will start with `sk_test_...`. **Never expose this key to the browser.**

4.  Copy and paste this key into the corresponding `STRIPE_SECRET_KEY` variable in your `.env.local` file.

---

### Step 2: Create a Product and Get the Payment Link (`https://buy.stripe.com/...`)

Instead of just getting a Price ID, you will now create a shareable Payment Link for your product.

1.  In your Stripe Dashboard (still in **Test Mode**), go to the **Product catalogue**.

2.  Click **+ Add product**.
    *   **Name:** `KamperHub Pro` (or similar).
    *   Scroll down to "Pricing" and add a recurring price.
    *   **Price:** e.g., $10
    *   **Billing period:** Monthly
    *   Click **Save product**.

3.  Find and Create the **Payment Link**:
    *   After saving the product, you'll be on its detail page.
    *   In the top right of the page, click the **Create payment link** button.
    *   **CRITICAL: Configure the Confirmation Page:**
        *   On the Payment Link creation page, find the **"After payment"** section.
        *   Select the option to **Redirect customers to your website**.
        *   In the URL box, enter: `http://localhost:8083/subscribe/success`
        *   This ensures users are sent back to the app after a successful subscription.
    *   Click **Create link** in the top right.

4.  Copy the Payment Link URL:
    *   After creating the link, you will be taken to its detail page.
    *   Click the **Copy** button to copy the full URL. It will start with `https://buy.stripe.com/...`.

5.  Paste this full URL into the `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` variable in your `.env.local` file.

---

### Step 3: Get Your Webhook Secret with the Stripe CLI (`whsec_...`)

This is the most common point of failure. The webhook secret for local development comes from the **Stripe CLI terminal output**, not the Stripe Dashboard website.

1.  **Install & Login to Stripe CLI:** If you haven't already, [install the Stripe CLI](https://stripe.com/docs/stripe-cli) and log in by running `stripe login` in your terminal.

2.  **Start Your App:** Make sure your Next.js application is running (`npm run dev`). It must be running on port `8083`.

3.  **Start Event Forwarding:** Open a **new, separate terminal window** (do not stop your Next.js app) and run this exact command:
    ```bash
    stripe listen --forward-to localhost:8083/api/stripe-webhook
    ```

4.  **CRITICAL - Find Your Secret:** The CLI will immediately print your webhook signing secret **in the terminal**. It will look like this:

    ```text
    > Ready! Your webhook signing secret is whsec_...  <-- THIS IS YOUR SECRET
    ```
    
    This `whsec_...` key is your `STRIPE_WEBHOOK_SECRET` for local development.

5.  Paste this secret into your `.env.local` file.

6.  **Keep it running:** You must leave this `stripe listen` terminal running in the background while you test Stripe functionality. It's the bridge between Stripe and your local app. When you perform actions, you will see event logs appear in this terminal.


---

### Step 4: Final Verification Checklist

After you believe everything is set up, run through this checklist to catch common issues.

1.  **Restart Your Development Server:** Have you stopped (`Ctrl+C`) and restarted (`npm run dev`) your Next.js application since you last saved your `.env.local` file? The server only reads these variables on startup.

2.  **Check Your `.env.local` File:**
    *   `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` must start with `https://buy.stripe.com/`.
    *   `STRIPE_SECRET_KEY` must start with `sk_test_`.
    *   `STRIPE_WEBHOOK_SECRET` must start with `whsec_` and be the one provided by the `stripe listen` command, NOT one from the Stripe Dashboard.

3.  **Check Your Stripe CLI Terminal:**
    *   Is the `stripe listen --forward-to localhost:8083/api/stripe-webhook` command still running in its own terminal window? It must be running for your local app to receive events.
    *   When you perform actions in the app (like clicking the subscribe button), do you see event logs appearing in this terminal? If not, the connection isn't working.

4.  **Check Your Stripe Dashboard:**
    *   Are you in **Test Mode**? (The toggle is in the top-right corner). All your `sk_test_` keys and payment links must come from this mode.
    *   Does the product and payment link you created still exist?
