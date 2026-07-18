import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initializeDatabaseSchema() {
  const client = await pool.connect();
  try {
    console.log('🛰️ Checking database schema for recent_rooms...');

    // 1. Create the table and unique constraints
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.recent_rooms (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        room_name TEXT NOT NULL,
        last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        CONSTRAINT unique_user_room UNIQUE (user_id, room_name)
      );
    `);

    // 2. Enable Row-Level Security (RLS)
    await client.query(`
      ALTER TABLE public.recent_rooms ENABLE ROW LEVEL SECURITY;
    `);

    // 3. Create the security policy so the frontend can query it directly
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to manage their own recent rooms'
        ) THEN
          CREATE POLICY "Allow users to manage their own recent rooms" 
          ON public.recent_rooms
          FOR ALL
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
        END IF;
      END
      $$;
    `);

    console.log('✅ Database schema and security rules are ready!');
  } catch (error) {
    console.error('❌ Failed to initialize schema in database:', error);
  } finally {
    client.release();
  }
}