/**
 * Application Configuration — EXAMPLE FILE
 *
 * HOW TO SET UP:
 * 1. Copy this file and rename it to: config.js
 * 2. Replace all placeholder values below with your real keys
 * 3. Never commit config.js to GitHub (it is in .gitignore)
 *
 * WHERE TO GET YOUR KEYS:
 * - Supabase URL + Anon Key → https://supabase.com → Project Settings → API
 * - Formspree Endpoint      → https://formspree.io → Your Form → Integration
 */
const CONFIG = {
  // Supabase Project URL (from Supabase → Settings → API → Project URL)
  SUPABASE_URL: 'YOUR_SUPABASE_PROJECT_URL',

  // Supabase Anon/Publishable Key (from Supabase → Settings → API → anon key)
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',

  // Formspree Form ID and Endpoint (from formspree.io dashboard)
  FORMSPREE_FORM_ID: 'YOUR_FORMSPREE_FORM_ID',
  FORMSPREE_ENDPOINT: 'https://formspree.io/f/YOUR_FORMSPREE_FORM_ID',

  // Notification email for admin alerts
  NOTIFICATION_EMAIL: 'your-email@example.com',

  // Default admin PIN (change this before deploying!)
  DEFAULT_ADMIN_PIN: 'admin123'
};
