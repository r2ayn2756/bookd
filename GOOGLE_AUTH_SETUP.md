# Google OAuth Setup for Bookd

To complete the Google OAuth integration, you need to configure Google OAuth in your Supabase project and Google Cloud Console.

## 1. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client IDs**
5. Configure the OAuth consent screen if prompted
6. For Application type, select **Web application**
7. Add these authorized redirect URIs (replace `herpcoohlxdqaggkwaqt` with your actual Supabase project reference):
   - `https://herpcoohlxdqaggkwaqt.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local development)

   **Important**: The Supabase redirect URI must be EXACTLY: `https://herpcoohlxdqaggkwaqt.supabase.co/auth/v1/callback`
   
   To find your correct Supabase project reference:
   - Go to your Supabase Dashboard
   - Look at your project URL or settings
   - The project ref is the subdomain (e.g., `herpcoohlxdqaggkwaqt` in your case)

8. Copy the **Client ID** and **Client Secret**

## 2. Supabase Configuration

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list and click **Configure**
4. Enable the Google provider
5. Paste your Google **Client ID** and **Client Secret**
6. Save the configuration

## 3. Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click the "Sign in with Google" button
4. You should be redirected to Google's OAuth consent screen

## Troubleshooting

### "App doesn't comply with Google's OAuth 2.0 policy" Error

If you see this error, it means the redirect URI isn't properly configured:

1. **Check your Google Cloud Console**:
   - Go to **APIs & Services** > **Credentials**
   - Click on your OAuth 2.0 Client ID
   - Verify the redirect URI is exactly: `https://herpcoohlxdqaggkwaqt.supabase.co/auth/v1/callback`
   - Make sure there are no extra spaces or characters

2. **Common mistakes**:
   - Using `/auth/callback` instead of `/auth/v1/callback`
   - Wrong project reference in the URL
   - Missing `https://` prefix
   - Extra trailing slashes

3. **After updating**:
   - Save the changes in Google Cloud Console
   - Wait a few minutes for changes to propagate
   - Try signing in again

## Notes

- The redirect URL in your Google OAuth setup must match exactly with your Supabase project URL
- For production, make sure to update the authorized redirect URIs with your production domain
- Users will be automatically created in your Supabase `auth.users` table upon successful sign-in
- Changes to OAuth settings in Google Cloud Console can take a few minutes to take effect