-- Sample gigs for testing the gigs functionality
-- Run this in your Supabase SQL editor to populate some test data

-- First, let's get your current user ID (this will be the authenticated user)
-- Replace this approach with direct user ID if you know it

-- Method 1: If you know your user ID, replace '00000000-0000-0000-0000-000000000000' below
-- Method 2: Use this query first to find your user ID: SELECT auth.uid();

INSERT INTO public.gigs (
  posted_by_user_id,
  title,
  description,
  gig_type,
  instruments_needed,
  genres,
  experience_level,
  venue_name,
  venue_address,
  city,
  state_province,
  country,
  start_date,
  start_time,
  end_time,
  compensation_type,
  pay_rate_type,
  pay_amount_min,
  pay_amount_max,
  currency,
  application_method,
  contact_email,
  status,
  published_at,
  tags
) VALUES 
-- Sample Gig 1: Wedding
(
  auth.uid(), -- This will use the current authenticated user
  'Classical Duo for Wedding Ceremony',
  'Looking for violin and cello duo for outdoor wedding ceremony. Classical and contemporary pieces. Music for 30-min ceremony and 1-hour cocktail reception. Professional attire required.',
  'one_time',
  ARRAY['Violin', 'Cello'],
  ARRAY['Classical', 'Contemporary'],
  'professional',
  'Riverbanks Botanical Garden',
  '1300 Riverbanks Zoo Pkwy',
  'Columbia',
  'SC',
  'United States',
  '2025-01-15',
  '14:00',
  '16:00',
  'paid',
  'flat_fee',
  450,
  450,
  'USD',
  'email',
  'events@riverbanks.org',
  'open',
  NOW(),
  ARRAY['Wedding', 'Classical', 'Outdoor']
),

-- Sample Gig 2: Corporate Event
(
  auth.uid(),
  'Jazz Quartet for Corporate Gala',
  'Seeking professional jazz quartet for upscale corporate dinner. Smooth jazz, standards, and light contemporary. Professional attire required. Sound system provided.',
  'one_time',
  ARRAY['Piano', 'Bass', 'Drums', 'Saxophone'],
  ARRAY['Jazz'],
  'professional',
  'Columbia Metropolitan Convention Center',
  '1333 Main St',
  'Columbia',
  'SC',
  'United States',
  '2024-12-20',
  '18:00',
  '21:00',
  'paid',
  'flat_fee',
  800,
  800,
  'USD',
  'email',
  'events@techcorp.com',
  'open',
  NOW(),
  ARRAY['Corporate', 'Jazz', 'Dinner']
),

-- Sample Gig 3: Recording Session
(
  auth.uid(),
  'Session Guitarist Needed',
  'Need experienced session guitarist for indie-folk album. Lead and rhythm parts for 3 songs. Must read charts and be comfortable with multiple takes. Studio experience preferred.',
  'session',
  ARRAY['Guitar'],
  ARRAY['Folk', 'Indie'],
  'advanced',
  'Harmony Recording Studio',
  '1234 Music Row',
  'Columbia',
  'SC',
  'United States',
  '2024-12-18',
  '10:00',
  '16:00',
  'paid',
  'flat_fee',
  300,
  300,
  'USD',
  'email',
  'booking@harmonystudio.com',
  'open',
  NOW(),
  ARRAY['Recording', 'Session', 'Folk']
),

-- Sample Gig 4: Church Service
(
  auth.uid(),
  'Substitute Organist Position',
  'Need substitute organist for Sunday morning service. Traditional hymns and liturgical music. Pipe organ experience preferred. One service plus brief rehearsal.',
  'one_time',
  ARRAY['Organ'],
  ARRAY['Sacred', 'Traditional'],
  'intermediate',
  'St. Matthew''s Episcopal Church',
  '1520 Richland St',
  'Columbia',
  'SC',
  'United States',
  '2024-12-22',
  '10:00',
  '12:00',
  'paid',
  'flat_fee',
  150,
  150,
  'USD',
  'email',
  'music@stmatthewscolumbia.org',
  'open',
  NOW(),
  ARRAY['Church', 'Sacred', 'Organ']
),

-- Sample Gig 5: Private Party
(
  auth.uid(),
  'Holiday Party Entertainment',
  'Looking for solo pianist or small ensemble for intimate holiday party. Mix of holiday standards, jazz, and light classical. 25 guests. Piano provided.',
  'one_time',
  ARRAY['Piano'],
  ARRAY['Jazz', 'Classical', 'Holiday'],
  'professional',
  'Private Residence',
  null,
  'Forest Acres',
  'SC',
  'United States',
  '2024-12-21',
  '19:00',
  '22:00',
  'paid',
  'flat_fee',
  400,
  400,
  'USD',
  'email',
  'sarah.johnson@email.com',
  'open',
  NOW(),
  ARRAY['Holiday', 'Private', 'Party']
),

-- Sample Gig 6: Teaching
(
  auth.uid(),
  'Private Piano Instructor',
  'Seeking experienced piano instructor for advanced high school student preparing for college auditions. Classical focus with theory knowledge required. Weekly lessons ongoing.',
  'teaching',
  ARRAY['Piano'],
  ARRAY['Classical'],
  'professional',
  'Student''s Home',
  null,
  'Lexington',
  'SC',
  'United States',
  '2025-01-07',
  '16:00',
  '17:00',
  'paid',
  'hourly',
  75,
  75,
  'USD',
  'email',
  'music.parent@email.com',
  'open',
  NOW(),
  ARRAY['Teaching', 'Classical', 'Private']
);

-- Note: These gigs will be created with the currently authenticated user's ID
-- Make sure you're logged into Supabase when running this script
-- The RLS policies will allow you to see these gigs since you're the owner

-- If you get permission errors, you might need to temporarily disable RLS:
-- ALTER TABLE public.gigs DISABLE ROW LEVEL SECURITY;
-- (Remember to re-enable it after testing: ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;)
