# 🚀 Deploying Payment Reminder SaaS to Vercel

This guide outlines the step-by-step process to deploy your **Payment Reminder SaaS** (Next.js & Supabase) to Vercel. Because the Next.js application resides within the `collection` subdirectory of your repository, we need to apply specific settings to ensure Vercel builds the correct folder.

---

## 📋 Prerequisites

Before you start, make sure you have:
1. A **GitHub**, **GitLab**, or **Bitbucket** repository with your code pushed.
2. A **Vercel** account (you can sign up for free at [vercel.com](https://vercel.com)).
3. Access to your **Supabase** project dashboard.

---

## 🛠️ Step-by-Step Deployment Guide

### Step 1: Connect your Git Repository to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click the **"Add New..."** button and select **"Project"**.
3. Locate your Git repository in the list and click **"Import"**.

---

### Step 2: Configure the Root Directory ⚠️ (CRITICAL STEP)
Since your Next.js application is located in the `collection` folder rather than the root of the repository, you must specify the **Root Directory**:

1. Under the **"Configure Project"** screen, locate the **"Root Directory"** field.
2. Click **"Edit"** or type `collection` (or browse and select the `collection` folder).
3. Ensure that Vercel recognizes the framework preset as **Next.js**.

> [!IMPORTANT]
> If you do not set the Root Directory to `collection`, Vercel will attempt to build from the root folder of the repository, which will fail because there is no `package.json` at the root.

---

### Step 3: Configure Environment Variables
You need to add the environment variables that connect your Next.js frontend with your Supabase backend.

1. Expand the **"Environment Variables"** section in Vercel.
2. Add the following keys and values (copy them from your local `.env.local` file or Supabase API settings):

| Key | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | Your Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Your Supabase Anonymous API Key |

3. Click **"Add"** for each variable.

---

### Step 4: Deploy! 🎉
1. Click the **"Deploy"** button at the bottom of the page.
2. Vercel will clone your repository, navigate to the `collection` directory, install your dependencies, compile the TypeScript code, and generate static pages.
3. Once the build finishes successfully (usually under 2 minutes), you will receive a production URL (e.g., `https://collection-nine-iota.vercel.app`).

---

### Step 5: Update Supabase Auth Redirect URLs 🔒 (CRITICAL STEP)
To make sure authentication (login, signup, password resets, and session recovery) works in production, you must register your new Vercel deployment URL in your Supabase dashboard:

1. Copy your Vercel production URL (e.g., `https://your-app.vercel.app`).
2. Go to your [Supabase Dashboard](https://database.supabase.com) and select your project.
3. Navigate to **Authentication** > **URL Configuration** in the left sidebar.
4. Update the **Site URL** if this will be your primary domain (or keep it as `http://localhost:3000` for development and use Redirect URLs for production).
5. Under **Redirect URLs**, click **"Add URL"** and add:
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/auth/callback` (if you implement OAuth or email link confirmations in the future)
6. Click **Save**.

> [!WARNING]
> If you do not add your Vercel URL to the Redirect URLs list in Supabase, users signing up or logging in might be redirected back to `localhost:3000` instead of your Vercel application, or auth tokens might fail to save correctly.

---

## ⚡ Local Development vs. Production

We have set up the Next.js `proxy.ts` to automatically handle session management and page route protections. It is fully compatible with both environments:
- **Local Dev Server:** `http://localhost:3000` (uses `.env.local`)
- **Production Server:** `https://your-app.vercel.app` (uses Vercel environment variables)

Whenever you push new changes to your Git repository's main branch, Vercel will automatically trigger a preview build, run compilation checks, and update your live site!

---

## 🔍 Troubleshooting

* **Build Fails with "No package.json found"**: Double-check that your **Root Directory** in the Vercel project settings is set to `collection`.
* **Users get redirected to localhost on Sign-in/Sign-up**: Ensure your Supabase Auth Redirect URLs contain your Vercel production domain.
* **Database queries fail on Vercel but work locally**: Verify that your production database is active and that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are typed correctly in Vercel.
