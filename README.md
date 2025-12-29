# CAIROOM (Somaida Hub) 🇪🇬

A comprehensive co-working space and entertainment hub management system built with Next.js 14+, TypeScript, and Supabase.

![CAIROOM](https://img.shields.io/badge/CAIROOM-Admin_Dashboard-E63E32?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)

## ✨ Features

### Admin Dashboard (10 Modules)
- **📊 Dashboard** - Real-time stats, active sessions, revenue overview
- **🪑 Tables & Sessions** - Table management with live timers and 4 payment methods
- **👥 Members** - Member profiles, wallet management, game stats
- **📦 Inventory** - Product CRUD, stock tracking, profit calculations
- **👷 Staff & Tasks** - Employee management, task assignments with deadlines
- **📈 Statistics** - Revenue charts, game night profits, leaderboards
- **🧹 Operations** - Hourly cleaning checklist, staff requests
- **🎮 Entertainment** - Tournament management with countdown timers
- **📣 Marketing** - Affiliate withdrawals, push/email/SMS notifications
- **⚙️ Settings** - Branding, colors, popups, referral bonus
- **📻 Radio** - Internal audio broadcast system

### Design
- 🌙 Dark mode with glassmorphism
- 🔄 RTL Arabic support (Egyptian Sa'idi dialect)
- 📱 Mobile responsive
- 🎨 CAIROOM brand gradient (#E63E32 → #F18A21 → #F8C033)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/cairoom-v2.git

# Install dependencies
cd cairoom-v2
npm install

# Copy environment template
cp env.template .env.local

# Run development server
npm run dev
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Paymob (optional)
PAYMOB_API_KEY=your_paymob_key

# OpenAI (optional)
OPENAI_API_KEY=your_openai_key
```

## 📁 Project Structure

```
cairoom-v2/
├── src/
│   ├── app/
│   │   ├── (admin)/         # Admin dashboard routes
│   │   │   ├── dashboard/
│   │   │   ├── tables/
│   │   │   ├── members/
│   │   │   └── ...
│   │   └── globals.css      # Glassmorphism design system
│   ├── components/
│   │   ├── admin/           # Admin-specific components
│   │   └── ui/              # shadcn/ui components
│   ├── lib/
│   │   ├── supabase/        # Supabase clients
│   │   └── utils.ts         # Utility functions
│   └── types/
│       └── database.ts      # TypeScript types
└── supabase/
    └── migrations/          # Database schema
```

## 🗄️ Database

The system uses 18 tables with Row Level Security:
- users, sessions, tables, products, orders
- staff_members, tasks, tournaments, cleaning_logs
- staff_requests, expenses, wallet_transactions
- affiliate_withdrawals, notifications, app_settings, active_timers

Run migrations in Supabase SQL editor using `supabase/migrations/001_initial_schema.sql`

## 🛠️ Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (Strict Mode)
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **UI:** shadcn/ui + Tailwind CSS v4
- **Icons:** Lucide React
- **Notifications:** Sonner

## 📄 License

MIT License - feel free to use this project for your own co-working space!

---

Built with ❤️ for the Egyptian co-working community
