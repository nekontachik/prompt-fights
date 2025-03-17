# Prompt Engineering Game - Database Schema

This directory contains the database schema for the Prompt Engineering Game application.

## Tables

### profiles
Stores user profile information, linked to Supabase Auth users.
- `id`: UUID (Primary Key, references auth.users)
- `username`: TEXT (Unique)
- `display_name`: TEXT
- `avatar_url`: TEXT
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### games
Stores game history and results.
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to auth.users)
- `prompt`: TEXT (The final prompt created in the game)
- `score`: INTEGER (Evaluation score 0-100)
- `game_mode`: TEXT (easy, standard, expert)
- `model`: TEXT (The LLM model used)
- `word_count`: INTEGER (Number of words in the prompt)
- `created_at`: TIMESTAMP

### prompts
Stores saved prompts that users can share.
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to auth.users)
- `title`: TEXT
- `content`: TEXT (The prompt content)
- `is_public`: BOOLEAN (Whether the prompt is publicly viewable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### achievements
Stores user achievements.
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to auth.users)
- `achievement_type`: TEXT (Type of achievement)
- `achievement_data`: JSONB (Additional achievement data)
- `created_at`: TIMESTAMP

## Views

### leaderboard
A view that combines game scores with user profiles for the leaderboard.

## Row Level Security (RLS)

All tables have Row Level Security enabled to ensure data privacy:

- Users can view all public data
- Users can only modify their own data
- Achievements are only visible to the user who earned them

## Triggers

- `update_updated_at_column`: Updates the `updated_at` timestamp on record updates
- `handle_new_user`: Creates a profile record when a new user signs up

## How to Apply Migrations

1. Connect to your Supabase project
2. Run the migration script:

```bash
supabase db push
```

Or manually apply the SQL script through the Supabase SQL Editor. 