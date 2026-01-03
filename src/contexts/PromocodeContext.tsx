'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// --- Types ---

export type PromocodeType = 'percentage' | 'fixed' | 'recurring_offer' | 'item_discount';

interface PromocodeItemTarget {
    itemId: string; // matches product.id from Inventory
    type: 'amount' | 'percentage' | 'free';
    value: number; // 0 if free
}

export interface Promocode {
    id: string;
    code: string;
    name: string;
    description: string;
    type: PromocodeType;
    status: 'active' | 'inactive' | 'expired';
    validFrom: string; // ISO Date String
    validUntil: string; // ISO Date String
    createdBy: string;
    createdAt: string;

    // Type Configs
    percentageConfig?: {
        value: number;
        appliesTo: ('time' | 'orders')[];
    };
    fixedConfig?: {
        value: number;
        appliesTo: ('time' | 'orders')[];
    };
    recurringConfig?: {
        payHours: number;
        freeHours: number;
    };
    itemConfig?: {
        targetItems: PromocodeItemTarget[];
    };
}

interface PromocodeContextType {
    promocodes: Promocode[];
    addPromocode: (promo: Omit<Promocode, 'id' | 'createdAt'>) => void;
    updatePromocode: (id: string, updates: Partial<Promocode>) => void;
    deletePromocode: (id: string) => void;
    getPromocodeByCode: (code: string) => Promocode | undefined;
}

const PromocodeContext = createContext<PromocodeContextType | undefined>(undefined);

// --- Mock Data ---

const mockPromocodes: Promocode[] = [
    {
        id: '1',
        code: 'WELCOME10',
        name: 'خصم ترحيبي',
        description: 'خصم 10% على كل شيء للزوار الجدد',
        type: 'percentage',
        status: 'active',
        validFrom: '2024-01-01T00:00:00.000Z',
        validUntil: '2024-12-31T23:59:59.000Z',
        createdBy: 'Admin',
        createdAt: '2024-01-01T10:00:00.000Z',
        percentageConfig: {
            value: 10,
            appliesTo: ['time', 'orders']
        }
    },
    {
        id: '2',
        code: 'GAMING_OFFER',
        name: 'عرض الجيمرز',
        description: 'ادفع ساعة واحصل على ساعتين مجاناً',
        type: 'recurring_offer',
        status: 'active',
        validFrom: '2024-01-01T00:00:00.000Z',
        validUntil: '2024-06-30T23:59:59.000Z',
        createdBy: 'Manager',
        createdAt: '2024-02-15T14:30:00.000Z',
        recurringConfig: {
            payHours: 1,
            freeHours: 2
        }
    },
    {
        id: '3',
        code: 'FREE_COFFEE',
        name: 'قهوة مجانية',
        description: 'احصل على قهوة اسبريسو مجاناً عند الطلب',
        type: 'item_discount',
        status: 'active',
        validFrom: '2024-03-01T00:00:00.000Z',
        validUntil: '2024-03-31T23:59:59.000Z',
        createdBy: 'Admin',
        createdAt: '2024-03-01T09:00:00.000Z',
        itemConfig: {
            targetItems: [
                { itemId: '1', type: 'free', value: 0 } // Assuming '1' is Espresso ID just for mock
            ]
        }
    }
];

export function PromocodeProvider({ children }: { children: React.ReactNode }) {
    const [promocodes, setPromocodes] = useState<Promocode[]>(mockPromocodes);

    const addPromocode = (promo: Omit<Promocode, 'id' | 'createdAt'>) => {
        const newPromo: Promocode = {
            ...promo,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
        };
        setPromocodes(prev => [newPromo, ...prev]);
    };

    const updatePromocode = (id: string, updates: Partial<Promocode>) => {
        setPromocodes(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const deletePromocode = (id: string) => {
        setPromocodes(prev => prev.filter(p => p.id !== id));
    };

    const getPromocodeByCode = (code: string) => {
        return promocodes.find(p => p.code.toUpperCase() === code.toUpperCase());
    };

    return (
        <PromocodeContext.Provider value={{ promocodes, addPromocode, updatePromocode, deletePromocode, getPromocodeByCode }}>
            {children}
        </PromocodeContext.Provider>
    );
}

export const usePromocodes = () => {
    const context = useContext(PromocodeContext);
    if (!context) {
        throw new Error('usePromocodes must be used within a PromocodeProvider');
    }
    return context;
};
