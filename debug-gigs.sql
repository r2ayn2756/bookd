-- Debug script for gigs table issues
-- Run these queries in Supabase SQL editor to diagnose the problem

-- 1. Check if gigs table exists and has data
SELECT 'Gigs table row count' as check_type, COUNT(*) as result FROM public.gigs;

-- 2. Check RLS policies
SELECT 'RLS enabled' as check_type, 
       CASE WHEN relrowsecurity THEN 'YES' ELSE 'NO' END as result
FROM pg_class 
WHERE relname = 'gigs';

-- 3. Check current user
SELECT 'Current user' as check_type, auth.uid() as result;

-- 4. Check if current user has any gigs
SELECT 'User gigs count' as check_type, COUNT(*) as result 
FROM public.gigs 
WHERE posted_by_user_id = auth.uid();

-- 5. Check published gigs count
SELECT 'Published gigs count' as check_type, COUNT(*) as result 
FROM public.gigs 
WHERE published_at IS NOT NULL AND status = 'open';

-- 6. Check all gigs without RLS
SELECT 'All gigs (bypassing RLS)' as check_type, COUNT(*) as result 
FROM public.gigs;

-- 7. Try to select some basic gig data
SELECT id, title, status, published_at, posted_by_user_id
FROM public.gigs 
LIMIT 5;

-- 8. If no data, create a simple test gig
INSERT INTO public.gigs (
  posted_by_user_id,
  title,
  description,
  gig_type,
  instruments_needed,
  city,
  country,
  start_date,
  compensation_type,
  application_method,
  status,
  published_at
) VALUES (
  auth.uid(),
  'Test Gig',
  'This is a test gig for debugging',
  'one_time',
  ARRAY['Piano'],
  'Test City',
  'United States',
  CURRENT_DATE + INTERVAL '7 days',
  'paid',
  'email',
  'open',
  NOW()
) ON CONFLICT DO NOTHING;

-- 9. Verify the test gig was created
SELECT 'Test gig created' as check_type, 
       CASE WHEN EXISTS(SELECT 1 FROM public.gigs WHERE title = 'Test Gig') 
            THEN 'YES' ELSE 'NO' END as result;
