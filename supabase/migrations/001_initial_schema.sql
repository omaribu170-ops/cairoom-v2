-- =================================================================
-- CAIROOM (Somaida Hub) - Complete Database Schema
-- 18 Tables with RLS (Row Level Security)
-- قاعدة بيانات كيروم الكاملة
-- =================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- 1. USERS - المستخدمين
-- =================================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'moderator', 'user')),
  cairoom_wallet_balance DECIMAL(10,2) DEFAULT 0,
  affiliate_balance DECIMAL(10,2) DEFAULT 0,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES public.users(id),
  avatar_url TEXT,
  nickname TEXT,
  game_stats JSONB DEFAULT '{"wins": 0, "attended": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_referral_code ON public.users(referral_code);
CREATE INDEX idx_users_role ON public.users(role);

-- =================================================================
-- 2. TABLES - الطاولات
-- =================================================================
CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image_url TEXT,
  capacity_min INTEGER DEFAULT 1,
  capacity_max INTEGER DEFAULT 10,
  price_per_hour_per_person DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'busy')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tables_status ON public.tables(status);

-- =================================================================
-- 3. SESSIONS - الجلسات
-- =================================================================
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'visa', 'mobile_wallet', 'cairoom_wallet')),
  attendees JSONB DEFAULT '[]'::jsonb,
  guest_count INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_table_id ON public.sessions(table_id);
CREATE INDEX idx_sessions_status ON public.sessions(status);
CREATE INDEX idx_sessions_start_time ON public.sessions(start_time);

-- =================================================================
-- 4. PRODUCTS - المنتجات (المخزن)
-- =================================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('food', 'drink', 'cleaning', 'asset')),
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_type ON public.products(type);
CREATE INDEX idx_products_is_active ON public.products(is_active);

-- =================================================================
-- 5. ORDERS - الطلبات
-- =================================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_time DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_session_id ON public.orders(session_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- =================================================================
-- 6. BOOKINGS - الحجوزات
-- =================================================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  guests_count INTEGER DEFAULT 1,
  total_price DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_date ON public.bookings(date);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- =================================================================
-- 7. WALLET_TRANSACTIONS - معاملات المحفظة
-- =================================================================
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'session_payment', 'referral_bonus', 'withdrawal_deduct', 'admin_adjustment', 'tournament_entry', 'tournament_prize')),
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON public.wallet_transactions(type);
CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions(created_at);

-- =================================================================
-- 8. WITHDRAWAL_REQUESTS - طلبات السحب
-- =================================================================
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  request_date TIMESTAMPTZ DEFAULT NOW(),
  processed_date TIMESTAMPTZ,
  processed_by UUID REFERENCES public.users(id)
);

CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);

-- =================================================================
-- 9. TOURNAMENTS - البطولات
-- =================================================================
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  time TIME NOT NULL,
  entry_fee DECIMAL(10,2) DEFAULT 0,
  prizes_json JSONB DEFAULT '{"first": 0, "second": 0, "third": 0}'::jsonb,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  participants JSONB DEFAULT '[]'::jsonb,
  winner_first UUID REFERENCES public.users(id),
  winner_second UUID REFERENCES public.users(id),
  winner_third UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_tournaments_start_date ON public.tournaments(start_date);

-- =================================================================
-- 10. CLEANING_CHECKLIST - قائمة النظافة
-- =================================================================
CREATE TABLE public.cleaning_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time_slot TEXT NOT NULL, -- e.g., "10:00", "11:00"
  area TEXT NOT NULL CHECK (area IN ('bathroom', 'hall', 'kitchen', 'entrance', 'tables')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('checked', 'missed', 'pending')),
  checked_by UUID REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_cleaning_unique ON public.cleaning_checklist(date, time_slot, area);
CREATE INDEX idx_cleaning_date ON public.cleaning_checklist(date);
CREATE INDEX idx_cleaning_status ON public.cleaning_checklist(status);

-- =================================================================
-- 11. STAFF_REQUESTS - طلبات الموظفين
-- =================================================================
CREATE TABLE public.staff_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  items_needed TEXT NOT NULL,
  estimated_cost DECIMAL(10,2) DEFAULT 0,
  actual_cost DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ
);

CREATE INDEX idx_staff_requests_requester ON public.staff_requests(requester_id);
CREATE INDEX idx_staff_requests_status ON public.staff_requests(status);

-- =================================================================
-- 12. EXPENSES - المصروفات
-- =================================================================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  added_by UUID NOT NULL REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_expenses_category ON public.expenses(category);

-- =================================================================
-- 13. STAFF_MEMBERS - الموظفين
-- =================================================================
CREATE TABLE public.staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  national_id_image TEXT,
  address TEXT,
  salary DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_staff_user ON public.staff_members(user_id);
CREATE INDEX idx_staff_is_active ON public.staff_members(is_active);

-- =================================================================
-- 14. TASKS - المهام
-- =================================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL REFERENCES public.users(id),
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'overdue')),
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_deadline ON public.tasks(deadline);

-- =================================================================
-- 15. NOTIFICATIONS - الإشعارات
-- =================================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL for broadcast
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('push', 'email', 'sms')),
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(target_user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- =================================================================
-- 16. TABLE_AUDIO - صوتيات الطاولات
-- =================================================================
CREATE TABLE public.table_audio (
  table_id UUID PRIMARY KEY REFERENCES public.tables(id) ON DELETE CASCADE,
  smoke_audio TEXT,
  noise_audio TEXT,
  office_audio TEXT,
  custom_audio TEXT
);

-- =================================================================
-- 17. SETTINGS - الإعدادات
-- =================================================================
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES
  ('logo', '{"url": null}'::jsonb),
  ('pwa_logo', '{"url": null}'::jsonb),
  ('favicon', '{"url": null}'::jsonb),
  ('banner', '{"slides": []}'::jsonb),
  ('colors', '{"primary": "#E63E32", "secondary": "#F18A21", "accent": "#F8C033"}'::jsonb),
  ('popup', '{"enabled": false, "image": null, "text": null, "link": null}'::jsonb),
  ('referral_bonus', '{"amount": 10}'::jsonb);

-- =================================================================
-- 18. CHAT_LOGS - سجل المحادثات
-- =================================================================
CREATE TABLE public.chat_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_logs_user ON public.chat_logs(user_id);
CREATE INDEX idx_chat_logs_created_at ON public.chat_logs(created_at);

-- =================================================================
-- FUNCTIONS - الدوال
-- =================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON public.tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON public.staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := 'CR-';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code for new users
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_referral_code BEFORE INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION set_referral_code();

-- Function to deduct stock when order is placed
CREATE OR REPLACE FUNCTION deduct_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_deduct_stock AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION deduct_product_stock();

-- Function to update table status based on sessions
CREATE OR REPLACE FUNCTION update_table_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE public.tables SET status = 'busy' WHERE id = NEW.table_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'completed' THEN
    UPDATE public.tables SET status = 'available' WHERE id = NEW.table_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_update_table_status AFTER INSERT OR UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION update_table_status();

-- Function to auto-mark tasks as overdue
CREATE OR REPLACE FUNCTION check_overdue_tasks()
RETURNS void AS $$
BEGIN
  UPDATE public.tasks
  SET status = 'overdue'
  WHERE status = 'pending' AND deadline < NOW();
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- ROW LEVEL SECURITY (RLS)
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = user_id;
  RETURN user_role IN ('super_admin', 'moderator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS policies
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update users" ON public.users FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable insert for auth" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- TABLES policies (public read, admin write)
CREATE POLICY "Anyone can view tables" ON public.tables FOR SELECT USING (true);
CREATE POLICY "Admins can manage tables" ON public.tables FOR ALL USING (is_admin(auth.uid()));

-- SESSIONS policies
CREATE POLICY "Admins can manage sessions" ON public.sessions FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING (
  auth.uid() = ANY(
    SELECT (jsonb_array_elements(attendees)->>'user_id')::uuid
  )
);

-- PRODUCTS policies (public read, admin write)
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (is_admin(auth.uid()));

-- ORDERS policies
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (is_admin(auth.uid()));

-- BOOKINGS policies
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage bookings" ON public.bookings FOR ALL USING (is_admin(auth.uid()));

-- WALLET_TRANSACTIONS policies
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage transactions" ON public.wallet_transactions FOR ALL USING (is_admin(auth.uid()));

-- WITHDRAWAL_REQUESTS policies
CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create withdrawals" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage withdrawals" ON public.withdrawal_requests FOR ALL USING (is_admin(auth.uid()));

-- TOURNAMENTS policies (public read)
CREATE POLICY "Anyone can view tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Admins can manage tournaments" ON public.tournaments FOR ALL USING (is_admin(auth.uid()));

-- CLEANING_CHECKLIST policies
CREATE POLICY "Admins can manage cleaning" ON public.cleaning_checklist FOR ALL USING (is_admin(auth.uid()));

-- STAFF_REQUESTS policies
CREATE POLICY "Staff can create requests" ON public.staff_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Staff can view own requests" ON public.staff_requests FOR SELECT USING (auth.uid() = requester_id);
CREATE POLICY "Admins can manage requests" ON public.staff_requests FOR ALL USING (is_admin(auth.uid()));

-- EXPENSES policies
CREATE POLICY "Admins can manage expenses" ON public.expenses FOR ALL USING (is_admin(auth.uid()));

-- STAFF_MEMBERS policies
CREATE POLICY "Staff can view own record" ON public.staff_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage staff" ON public.staff_members FOR ALL USING (is_admin(auth.uid()));

-- TASKS policies
CREATE POLICY "Users can view assigned tasks" ON public.tasks FOR SELECT USING (auth.uid() = assigned_to);
CREATE POLICY "Users can update assigned tasks" ON public.tasks FOR UPDATE USING (auth.uid() = assigned_to);
CREATE POLICY "Admins can manage tasks" ON public.tasks FOR ALL USING (is_admin(auth.uid()));

-- NOTIFICATIONS policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (target_user_id IS NULL OR auth.uid() = target_user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = target_user_id);
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (is_admin(auth.uid()));

-- TABLE_AUDIO policies
CREATE POLICY "Anyone can view audio" ON public.table_audio FOR SELECT USING (true);
CREATE POLICY "Admins can manage audio" ON public.table_audio FOR ALL USING (is_admin(auth.uid()));

-- SETTINGS policies
CREATE POLICY "Anyone can view settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL USING (is_admin(auth.uid()));

-- CHAT_LOGS policies
CREATE POLICY "Users can view own chats" ON public.chat_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create chats" ON public.chat_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =================================================================
-- SAMPLE DATA (للتجربة)
-- =================================================================

-- Insert sample tables
INSERT INTO public.tables (name, capacity_min, capacity_max, price_per_hour_per_person) VALUES
  ('طاولة ١', 1, 4, 25),
  ('طاولة ٢', 1, 4, 25),
  ('طاولة ٣', 2, 6, 20),
  ('طاولة ٤', 2, 6, 20),
  ('غرفة الاجتماعات', 4, 12, 50),
  ('ركن القهوة', 1, 2, 15);

-- Insert sample products
INSERT INTO public.products (name, type, price, cost_price, stock_quantity) VALUES
  ('قهوة تركي', 'drink', 15, 5, 100),
  ('نسكافيه', 'drink', 12, 4, 100),
  ('شاي', 'drink', 8, 2, 200),
  ('عصير برتقال', 'drink', 20, 10, 50),
  ('ساندويتش جبنة', 'food', 25, 12, 30),
  ('كرواسون', 'food', 18, 8, 40),
  ('بسكويت', 'food', 10, 4, 100),
  ('منظف زجاج', 'cleaning', 35, 20, 20),
  ('مناديل', 'cleaning', 15, 8, 50);

COMMIT;
