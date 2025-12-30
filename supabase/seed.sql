-- Add some Halls
INSERT INTO halls (name, capacity_min, capacity_max, price_per_hour)
VALUES 
('القاعة الرئيسية', 10, 50, 200),
('قاعة الـ VIP', 5, 15, 350);

-- Add some Tables
INSERT INTO tables (name, capacity_min, capacity_max, price_per_hour_per_person, status, hall_id)
VALUES 
('طاولة 1', 2, 4, 25, 'available', (SELECT id FROM halls WHERE name = 'القاعة الرئيسية' LIMIT 1)),
('طاولة 2', 4, 6, 25, 'available', (SELECT id FROM halls WHERE name = 'القاعة الرئيسية' LIMIT 1)),
('طاولة 3', 6, 8, 25, 'available', (SELECT id FROM halls WHERE name = 'القاعة الرئيسية' LIMIT 1)),
('طاولة VIP 1', 8, 12, 50, 'available', (SELECT id FROM halls WHERE name = 'قاعة الـ VIP' LIMIT 1));

-- Add some Products
INSERT INTO products (name, type, price, cost_price, stock_quantity, is_active)
VALUES
('شاي', 'drink', 15, 5, 100, true),
('قهوة', 'drink', 25, 8, 100, true),
('مياه معدنية', 'drink', 10, 3, 200, true),
('ساندوتش', 'food', 45, 25, 50, true),
('شيشة', 'other', 50, 15, 50, true);

-- Add a Test User (Member)
INSERT INTO users (full_name, phone, role, cairoom_wallet_balance, affiliate_balance, referral_code, game_stats)
VALUES
('تجربة مستخدم', '01000000000', 'user', 1000, 0, 'TEST01', '{"wins": 0, "attended": 0}');
