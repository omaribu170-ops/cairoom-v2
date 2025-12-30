'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Hall, Table, Product, ActiveSession, HistorySession, User } from '@/types/database';
import { getMockStore, saveMockStore, MockStore } from '@/lib/mockStore';

interface MockContextType extends MockStore {
    setHalls: (halls: Hall[]) => void;
    setTables: (tables: Table[]) => void;
    setProducts: (products: Product[]) => void;
    setActiveSessions: React.Dispatch<React.SetStateAction<ActiveSession[]>>;
    setHistorySessions: (sessions: HistorySession[]) => void;
    setMembers: (members: User[]) => void;
    refreshMockData: () => void;
    resetMockData: () => void;
}

const MockContext = createContext<MockContextType | undefined>(undefined);

export function MockProvider({ children }: { children: React.ReactNode }) {
    const [store, setStore] = useState<MockStore>(getMockStore());

    useEffect(() => {
        saveMockStore(store);
    }, [store]);

    const setHalls = (halls: Hall[]) => setStore(prev => ({ ...prev, halls }));
    const setTables = (tables: Table[]) => setStore(prev => ({ ...prev, tables }));
    const setProducts = (products: Product[]) => setStore(prev => ({ ...prev, products }));
    const setActiveSessions: React.Dispatch<React.SetStateAction<ActiveSession[]>> = (action) => {
        setStore(prev => {
            const nextActiveSessions = typeof action === 'function' ? action(prev.activeSessions) : action;
            return { ...prev, activeSessions: nextActiveSessions };
        });
    };
    const setHistorySessions = (historySessions: HistorySession[]) => setStore(prev => ({ ...prev, historySessions }));
    const setMembers = (members: User[]) => setStore(prev => ({ ...prev, members }));

    const refreshMockData = useCallback(() => {
        setStore(getMockStore());
    }, []);

    const resetMockData = () => {
        const initial = getMockStore(); // This will return initial if localStorage is cleared or not existing
        localStorage.removeItem('cairoom_mock_store');
        setStore(getMockStore());
    };

    return (
        <MockContext.Provider value={{
            ...store,
            setHalls,
            setTables,
            setProducts,
            setActiveSessions,
            setHistorySessions,
            setMembers,
            refreshMockData,
            resetMockData
        }}>
            {children}
        </MockContext.Provider>
    );
}

export function useMock() {
    const context = useContext(MockContext);
    if (context === undefined) {
        throw new Error('useMock must be used within a MockProvider');
    }
    return context;
}
