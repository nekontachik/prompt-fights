-- Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create error_events table
CREATE TABLE IF NOT EXISTS public.error_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb NOT NULL,
  url TEXT,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create analytics_metrics view for dashboards
CREATE OR REPLACE VIEW public.analytics_metrics AS
SELECT
  date_trunc('day', timestamp) AS day,
  event_type,
  COUNT(*) AS event_count
FROM
  public.analytics_events
GROUP BY
  date_trunc('day', timestamp),
  event_type
ORDER BY
  day DESC,
  event_count DESC;

-- Create game_metrics view
CREATE OR REPLACE VIEW public.game_metrics AS
SELECT
  date_trunc('day', timestamp) AS day,
  properties->>'game_mode' AS game_mode,
  properties->>'model' AS model,
  COUNT(*) AS game_count,
  AVG((properties->>'score')::numeric) AS avg_score,
  AVG((properties->>'word_count')::numeric) AS avg_word_count,
  AVG((properties->>'duration')::numeric) AS avg_duration
FROM
  public.analytics_events
WHERE
  event_type = 'game_end'
GROUP BY
  date_trunc('day', timestamp),
  properties->>'game_mode',
  properties->>'model'
ORDER BY
  day DESC;

-- Create error_metrics view
CREATE OR REPLACE VIEW public.error_metrics AS
SELECT
  date_trunc('day', timestamp) AS day,
  error_message,
  COUNT(*) AS error_count
FROM
  public.error_events
GROUP BY
  date_trunc('day', timestamp),
  error_message
ORDER BY
  day DESC,
  error_count DESC;

-- Set up RLS policies

-- Analytics events: Only admins can read, system can insert
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read analytics events"
  ON public.analytics_events
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE auth.users.raw_app_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "System can insert analytics events"
  ON public.analytics_events
  FOR INSERT
  WITH CHECK (true);

-- Error events: Only admins can read, system can insert
ALTER TABLE public.error_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read error events"
  ON public.error_events
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE auth.users.raw_app_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "System can insert error events"
  ON public.error_events
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx ON public.analytics_events (event_type);
CREATE INDEX IF NOT EXISTS analytics_events_timestamp_idx ON public.analytics_events (timestamp);
CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx ON public.analytics_events (user_id);
CREATE INDEX IF NOT EXISTS analytics_events_session_id_idx ON public.analytics_events (session_id);

CREATE INDEX IF NOT EXISTS error_events_timestamp_idx ON public.error_events (timestamp);
CREATE INDEX IF NOT EXISTS error_events_user_id_idx ON public.error_events (user_id);
CREATE INDEX IF NOT EXISTS error_events_session_id_idx ON public.error_events (session_id); 