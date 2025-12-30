-- =================================================================
-- 002_add_halls.sql
-- Add Halls support and update Tables/Sessions relationships
-- =================================================================

-- 1. Create HALLS table
CREATE TABLE public.halls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity_min INTEGER NOT NULL DEFAULT 1,
  capacity_max INTEGER NOT NULL DEFAULT 10,
  price_per_hour DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add hall_id to TABLES
ALTER TABLE public.tables ADD COLUMN hall_id UUID REFERENCES public.halls(id) ON DELETE SET NULL;

-- 3. Update SESSIONS table
ALTER TABLE public.sessions ADD COLUMN hall_id UUID REFERENCES public.halls(id) ON DELETE SET NULL;
ALTER TABLE public.sessions ADD COLUMN table_ids JSONB DEFAULT '[]'::jsonb; -- Store array of table IDs for multi-table sessions
ALTER TABLE public.sessions ALTER COLUMN table_id DROP NOT NULL; -- Make table_id nullable

-- 4. RLS Policies for Halls
ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view halls" ON public.halls FOR SELECT USING (true);
CREATE POLICY "Admins can manage halls" ON public.halls FOR ALL USING (is_admin(auth.uid()));

-- 5. Trigger for updated_at
CREATE TRIGGER update_halls_updated_at BEFORE UPDATE ON public.halls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Insert Default Halls (matching the Mock Data)
INSERT INTO public.halls (name, capacity_min, capacity_max, price_per_hour) VALUES
('القاعة الرئيسية', 10, 50, 200),
('قاعة VIP', 5, 20, 350),
('قاعة الحديقة', 20, 100, 500);

-- 7. Update existing tables to link to halls (Optional - best effort mapping based on names if they existed)
-- This part is left manual or for a separate script as we are transitioning from mock data.
