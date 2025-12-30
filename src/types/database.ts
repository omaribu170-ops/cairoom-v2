/* =================================================================
   CAIROOM Database Types - أنواع قاعدة البيانات
   All 18 tables with complete type definitions
   ================================================================= */

// ========================= مستخدمين Users =========================
export type UserRole = 'super_admin' | 'moderator' | 'user';

export interface GameStats {
  wins: number;
  attended: number;
}

export interface User {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  cairoom_wallet_balance: number;
  affiliate_balance: number;
  referral_code: string;
  referred_by: string | null;
  avatar_url: string | null;
  nickname: string | null;
  game_stats: GameStats;
  created_at: string;
  updated_at: string;
}

// ========================= طاولات Tables =========================
export type TableStatus = 'available' | 'busy';

export interface Table {
  id: string;
  name: string;
  image_url: string | null;
  capacity_min: number;
  capacity_max: number;
  price_per_hour_per_person: number;
  status: TableStatus;
  created_at: string;
  updated_at: string;
}

// ========================= جلسات Sessions =========================
export type SessionStatus = 'active' | 'completed';
export type PaymentMethod = 'cash' | 'visa' | 'mobile_wallet' | 'cairoom_wallet';

export interface SessionAttendee {
  user_id: string | null;
  name: string;
  phone?: string;
}

export interface Session {
  id: string;
  table_id: string;
  start_time: string;
  end_time: string | null;
  status: SessionStatus;
  total_amount: number;
  paid_amount: number;
  payment_method: PaymentMethod | null;
  attendees: SessionAttendee[];
  guest_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  table?: Table;
  orders?: Order[];
}

// ========================= منتجات Products =========================
export type ProductType = 'food' | 'drink' | 'cleaning' | 'asset';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  price: number;
  cost_price: number;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ========================= طلبات Orders =========================
export type OrderStatus = 'pending' | 'delivered';

export interface Order {
  id: string;
  session_id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
  status: OrderStatus;
  created_at: string;
  // Relations
  product?: Product;
  session?: Session;
}

// ========================= حجوزات Bookings =========================
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  guests_count: number;
  total_price: number;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  user?: User;
}

// ========================= محفظة WalletTransactions =========================
export type WalletTransactionType =
  | 'deposit'
  | 'session_payment'
  | 'referral_bonus'
  | 'withdrawal_deduct'
  | 'admin_adjustment'
  | 'tournament_entry'
  | 'tournament_prize';

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: WalletTransactionType;
  description: string | null;
  reference_id: string | null;
  created_at: string;
  // Relations
  user?: User;
}

// ========================= طلبات السحب WithdrawalRequests =========================
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  status: WithdrawalStatus;
  admin_notes: string | null;
  request_date: string;
  processed_date: string | null;
  processed_by: string | null;
  // Relations
  user?: User;
}

// ========================= بطولات Tournaments =========================
export type TournamentStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export interface TournamentPrizes {
  first: number;
  second: number;
  third: number;
}

export interface TournamentParticipant {
  user_id: string;
  name: string;
  nickname: string;
  paid_at: string;
  payment_method: PaymentMethod;
}

export interface Tournament {
  id: string;
  game_name: string;
  start_date: string;
  time: string;
  entry_fee: number;
  prizes_json: TournamentPrizes;
  status: TournamentStatus;
  participants: TournamentParticipant[];
  winner_first: string | null;
  winner_second: string | null;
  winner_third: string | null;
  created_at: string;
  updated_at: string;
}

// ========================= قائمة النظافة CleaningChecklist =========================
export type CleaningArea = 'bathroom' | 'hall' | 'kitchen' | 'entrance' | 'tables';
export type CleaningStatus = 'checked' | 'missed' | 'pending';

export interface CleaningChecklist {
  id: string;
  date: string;
  time_slot: string; // e.g., "10:00", "11:00"
  area: CleaningArea;
  status: CleaningStatus;
  checked_by: string | null;
  notes: string | null;
  created_at: string;
}

// ========================= طلبات الموظفين StaffRequests =========================
export type StaffRequestStatus = 'pending' | 'fulfilled' | 'rejected';

export interface StaffRequest {
  id: string;
  requester_id: string;
  items_needed: string;
  estimated_cost: number;
  actual_cost: number | null;
  status: StaffRequestStatus;
  admin_notes: string | null;
  created_at: string;
  fulfilled_at: string | null;
  // Relations
  requester?: User;
}

// ========================= مصروفات Expenses =========================
export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string | null;
  date: string;
  added_by: string;
  notes: string | null;
  created_at: string;
  // Relations
  added_by_user?: User;
}

// ========================= الموظفين StaffMembers =========================
export interface StaffMember {
  id: string;
  user_id: string;
  shift_start: string;
  shift_end: string;
  national_id_image: string | null;
  address: string | null;
  salary: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  user?: User;
}

// ========================= مهام Tasks =========================
export type TaskStatus = 'pending' | 'done' | 'overdue';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  deadline: string;
  status: TaskStatus;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  assignee?: User;
  creator?: User;
}

// ========================= إشعارات Notifications =========================
export type NotificationType = 'push' | 'email' | 'sms';

export interface Notification {
  id: string;
  target_user_id: string | null; // null for broadcast
  title: string;
  body: string;
  type: NotificationType;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

// ========================= صوت الطاولات TableAudio =========================
export interface TableAudio {
  table_id: string;
  smoke_audio: string | null;
  noise_audio: string | null;
  office_audio: string | null;
  custom_audio: string | null;
  // Relations
  table?: Table;
}

// ========================= إعدادات Settings =========================
export type SettingKey =
  | 'logo'
  | 'pwa_logo'
  | 'favicon'
  | 'banner'
  | 'colors'
  | 'popup'
  | 'popup_enabled'
  | 'referral_bonus';

export interface Setting {
  key: SettingKey;
  value: Record<string, unknown>;
  updated_at: string;
  updated_by: string | null;
}

// ========================= سجل المحادثات ChatLogs =========================
export type ChatSender = 'user' | 'ai';

export interface ChatLog {
  id: string;
  user_id: string;
  message: string;
  sender: ChatSender;
  created_at: string;
}

// ========================= Database Schema Type =========================
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at' | 'referral_code'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'referral_code'>>;
      };
      tables: {
        Row: Table;
        Insert: Omit<Table, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Table, 'id' | 'created_at'>>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Session, 'id' | 'created_at'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at'>;
        Update: Partial<Omit<Order, 'id' | 'created_at'>>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Booking, 'id' | 'created_at'>>;
      };
      wallet_transactions: {
        Row: WalletTransaction;
        Insert: Omit<WalletTransaction, 'id' | 'created_at'>;
        Update: never;
      };
      withdrawal_requests: {
        Row: WithdrawalRequest;
        Insert: Omit<WithdrawalRequest, 'id' | 'request_date'>;
        Update: Partial<Pick<WithdrawalRequest, 'status' | 'admin_notes' | 'processed_date' | 'processed_by'>>;
      };
      tournaments: {
        Row: Tournament;
        Insert: Omit<Tournament, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Tournament, 'id' | 'created_at'>>;
      };
      cleaning_checklist: {
        Row: CleaningChecklist;
        Insert: Omit<CleaningChecklist, 'id' | 'created_at'>;
        Update: Partial<Omit<CleaningChecklist, 'id' | 'created_at'>>;
      };
      staff_requests: {
        Row: StaffRequest;
        Insert: Omit<StaffRequest, 'id' | 'created_at'>;
        Update: Partial<Omit<StaffRequest, 'id' | 'created_at'>>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at'>;
        Update: Partial<Omit<Expense, 'id' | 'created_at'>>;
      };
      staff_members: {
        Row: StaffMember;
        Insert: Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<StaffMember, 'id' | 'created_at'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Task, 'id' | 'created_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Pick<Notification, 'is_read'>>;
      };
      table_audio: {
        Row: TableAudio;
        Insert: TableAudio;
        Update: Partial<Omit<TableAudio, 'table_id'>>;
      };
      settings: {
        Row: Setting;
        Insert: Setting;
        Update: Partial<Omit<Setting, 'key'>>;
      };
      chat_logs: {
        Row: ChatLog;
        Insert: Omit<ChatLog, 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
}
