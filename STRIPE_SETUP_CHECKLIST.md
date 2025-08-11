
# Stripe Setup & Verification Checklist

> [!CAUTION]
> **Stuck on a Stripe Loading Page? Start Here!**
> If you click the "Go Pro" button and the Stripe page never finishes loading, the issue is almost always a misconfiguration in your Stripe Dashboard or your `.env.local` file. Please verify the following steps **exactly**.

---

### Step 1: Find Your Stripe Secret Key (`sk_test_...`)

1.  Go to your [Stripe Developer Dashboard](https://dashboard.stripe.com/developers).
2.  **CRITICAL: Ensure "Test mode" is enabled.** The toggle is in the top-right corner. All keys for local development must come from Test Mode.
3.  Find your secret key: **`STRIPE_SECRET_KEY`**. It starts with `sk_test_...`.
4.  Copy this key into the `STRIPE_SECRET_KEY` variable in your `.env.local` file.

---

### Step 2: Create a Product and Get the Payment Link (`https://buy.stripe.com/...`)

1.  In your Stripe Dashboard (in **Test Mode**), go to the **Product catalogue**.
2.  Click **+ Add product**. Name it `KamperHub Pro` and add a recurring monthly price (e.g., $10). Click **Save product**.
3.  On the product page, click **Create payment link**.
4.  **CRITICAL: Configure the Confirmation Page:**
    *   On the Payment Link creation page, find the **"After payment"** section.
    *   Select the option to **Redirect customers to your website**.
    *   In the URL box, enter the URL from your `.env.local` file's `NEXT_PUBLIC_APP_URL` variable, followed by `/subscribe/success`.
    *   **Example:** `https://6000-....cloudworkstations.dev/subscribe/success`. This MUST match your `NEXT_PUBLIC_APP_URL`.
    *   Click **Create link**.
5.  **CRITICAL - Verify and Copy the Link**:
    *   After creating the link, you will be on its detail page. Click the link URL to test it.
    *   Once verified, click the **Copy** button to copy the full URL.
6.  Paste this full URL into the `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` variable in your `.env.local` file.

---

### Step 3: Get Your Webhook Secret with the Stripe CLI (`whsec_...`)

The webhook secret for local development comes from the **Stripe CLI terminal output**, not the Stripe Dashboard website.

1.  **Install & Login to Stripe CLI:** If you haven't already, [install the Stripe CLI](https://stripe.com/docs/stripe-cli) and run `stripe login`.
2.  **Start Your App:** Make sure your Next.js application is running (`npm run dev`).
3.  **Start Event Forwarding:** Open a **new, separate terminal window** and run this command. **CRITICAL:** The port number must match the one in your `NEXT_PUBLIC_APP_URL`.
    ```bash
    # If NEXT_PUBLIC_APP_URL is https://6000-..., the internal port is likely 3000.
    # Check the `npm run dev` terminal output for "started server on ... http://localhost:3000"
    stripe listen --forward-to localhost:3000/api/stripe-webhook
    ```
4.  **Find Your Secret:** The CLI will immediately print your webhook signing secret in the terminal. It will look like this:
    ```text
    > Ready! Your webhook signing secret is whsec_...  <-- THIS IS YOUR SECRET
    ```
5.  Paste this `whsec_...` key into the `STRIPE_WEBHOOK_SECRET` variable in your `.env.local` file.
6.  **Keep it running:** You must leave this `stripe listen` terminal running while testing Stripe functionality.

---

### Step 4: Final Verification Checklist

1.  **Restart Your Development Server:** Have you stopped (`Ctrl+C`) and restarted (`npm run dev`) your Next.js application since you last saved your `.env.local` file? The server only reads these variables on startup.
2.  **Check Your `.env.local` File:**
    *   `NEXT_PUBLIC_APP_URL` must match your exposed server URL (e.g., `https://6000-....cloudworkstations.dev`).
    *   `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` must start with `https://buy.stripe.com/` and not be in quotes.
    *   `STRIPE_SECRET_KEY` must start with `sk_test_`.
    *   `STRIPE_WEBHOOK_SECRET` must start with `whsec_` and come from the `stripe listen` command.
3.  **Check Your Stripe CLI Terminal:** Is the `stripe listen` command still running? When you perform actions, do you see event logs appearing in this terminal?
4.  **Check Your Stripe Dashboard:** Are you in **Test Mode**? Is your `KamperHub Pro` product **Active**? Is your payment link **Active**?
