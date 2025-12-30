import { Hall, Table, Product, ActiveSession, HistorySession, User } from '@/types/database';

export interface MockStore {
    halls: Hall[];
    tables: Table[];
    products: Product[];
    activeSessions: ActiveSession[];
    historySessions: HistorySession[];
    members: User[];
}

const STORAGE_KEY = 'cairoom_mock_store';

const INITIAL_HALLS: Hall[] = [
    { id: 'h1', name: 'القاعة الرئيسية', capacity_min: 10, capacity_max: 50, price_per_hour: 200, price_first_hour: 250, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'h2', name: 'قاعة VIP', capacity_min: 6, capacity_max: 20, price_per_hour: 350, price_first_hour: 400, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const INITIAL_TABLES: Table[] = [
    { id: '1', name: 'طاولة ١', hall_id: 'h1', capacity_min: 2, capacity_max: 4, price_per_hour_per_person: 25, price_first_hour_per_person: 35, status: 'available', image_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '2', name: 'طاولة ٢', hall_id: 'h1', capacity_min: 2, capacity_max: 6, price_per_hour_per_person: 25, price_first_hour_per_person: 35, status: 'busy', image_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '3', name: 'طاولة ٣', hall_id: 'h1', capacity_min: 4, capacity_max: 8, price_per_hour_per_person: 20, price_first_hour_per_person: 30, status: 'available', image_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const INITIAL_PRODUCTS: Product[] = [
    { id: 'p1', name: 'قهوة تركي', price: 35, type: 'drink', is_active: true, cost_price: 15, stock_quantity: 100, image_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'p2', name: 'شاي بلبن', price: 25, type: 'drink', is_active: true, cost_price: 10, stock_quantity: 100, image_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const INITIAL_MEMBERS: User[] = [
    {
        id: 'm1',
        full_name: 'أحمد علي',
        phone: '01012345678',
        email: 'ahmed@example.com',
        role: 'user',
        cairoom_wallet_balance: 500,
        affiliate_balance: 0,
        referral_code: 'REF123',
        referred_by: null,
        avatar_url: null,
        nickname: 'أبو علي',
        game_stats: { wins: 5, attended: 20 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'm2',
        full_name: 'سارة محمد',
        phone: '01112223334',
        email: 'sara@example.com',
        role: 'user',
        cairoom_wallet_balance: 1200,
        affiliate_balance: 50,
        referral_code: 'SARA456',
        referred_by: 'm1',
        avatar_url: null,
        nickname: 'سرسور',
        game_stats: { wins: 12, attended: 45 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
];

export const getMockStore = (): MockStore => {
    if (typeof window === 'undefined') return { halls: INITIAL_HALLS, tables: INITIAL_TABLES, products: INITIAL_PRODUCTS, activeSessions: [], historySessions: [], members: INITIAL_MEMBERS };

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse mock store', e);
        }
    }

    return {
        halls: INITIAL_HALLS,
        tables: INITIAL_TABLES,
        products: INITIAL_PRODUCTS,
        activeSessions: [],
        historySessions: [],
        members: INITIAL_MEMBERS
    };
};

export const saveMockStore = (store: MockStore) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
};
