# Leaked Password Protection Setup

Last updated: 2026-01-11

## Overview

Leaked password protection prevents users from signing up or resetting their password to a known-compromised password. This is a **mandatory launch requirement**.

---

## Step-by-Step: Enable via Supabase Dashboard

### Primary Path

1. Go to the Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** in the left sidebar
4. Click on **Settings** (or the gear icon)
5. Scroll down to the **Password security** section
6. Toggle **Enable leaked password protection** to **ON**
7. Click **Save** at the bottom of the page

### Alternate Path (if UI differs)

1. Go to **Project Settings** (gear icon in left sidebar)
2. Select the **Auth** tab
3. Look for **Security** or **Password security** section
4. Find and enable **Leaked password protection**
5. Save changes

---

## Verification

### How to confirm it's enabled

1. Go to **Authentication** → **Settings** in the dashboard
2. The toggle for "Enable leaked password protection" should show as **ON**

### Test verification

1. Go to your app's signup page
2. Attempt to sign up with a known compromised password (e.g., `password123`)
3. **Expected result:** Error message indicating the password has been compromised
4. **If signup succeeds:** The protection is NOT enabled — revisit the steps above

---

## Technical Details

- Uses HaveIBeenPwned's API (via Supabase) to check passwords
- Only the first 5 characters of the SHA-1 hash are sent (k-anonymity)
- Your users' actual passwords are never transmitted

---

## Troubleshooting

| Issue | Resolution |
|-------|------------|
| Toggle not visible | Ensure you're on the latest Supabase dashboard; try refreshing |
| Setting won't save | Check for browser extensions blocking requests |
| Still allows weak passwords | Verify the project ID matches; check auth settings are saved |

---

## Checklist

- [ ] Logged into Supabase Dashboard
- [ ] Navigated to Authentication → Settings
- [ ] Enabled leaked password protection toggle
- [ ] Clicked Save
- [ ] Verified by testing signup with `password123` (should be rejected)
