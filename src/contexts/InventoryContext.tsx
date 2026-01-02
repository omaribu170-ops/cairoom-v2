/* =================================================================
   CAIROOM - Inventory Context
   سياق المخزون المشترك بين الصفحات
   ================================================================= */

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// نوع المنتج
export interface InventoryProduct {
    id: string;
    name: string;
    type: 'food' | 'drink' | 'cleaning' | 'asset';
    price: number;
    cost_price: number;
    stock_quantity: number;
    image_url: string | null;
    is_active: boolean;
}

// البيانات الابتدائية
const initialProducts: InventoryProduct[] = [
    { id: 'p1', name: 'قهوة تركي', type: 'drink', price: 25, cost_price: 10, stock_quantity: 100, image_url: null, is_active: true },
    { id: 'p2', name: 'شاي', type: 'drink', price: 15, cost_price: 5, stock_quantity: 200, image_url: null, is_active: true },
    { id: 'p3', name: 'عصير برتقال', type: 'drink', price: 30, cost_price: 15, stock_quantity: 50, image_url: null, is_active: true },
    { id: 'p4', name: 'نسكافيه', type: 'drink', price: 20, cost_price: 8, stock_quantity: 80, image_url: null, is_active: true },
    { id: 'p5', name: 'ساندويتش جبنة', type: 'food', price: 35, cost_price: 15, stock_quantity: 30, image_url: null, is_active: true },
    { id: 'p6', name: 'كرواسون', type: 'food', price: 25, cost_price: 10, stock_quantity: 40, image_url: null, is_active: true },
    { id: 'p7', name: 'بيتزا صغيرة', type: 'food', price: 45, cost_price: 20, stock_quantity: 20, image_url: null, is_active: true },
    { id: 'p8', name: 'بسكويت', type: 'food', price: 10, cost_price: 4, stock_quantity: 0, image_url: null, is_active: false },
    { id: 'p9', name: 'منظف زجاج', type: 'cleaning', price: 35, cost_price: 20, stock_quantity: 15, image_url: null, is_active: true },
];

// نوع السياق
interface InventoryContextType {
    products: InventoryProduct[];
    ordersRevenue: number;
    // وظائف
    getOrderableProducts: () => InventoryProduct[]; // طعام ومشروبات فقط
    reduceStock: (productId: string, quantity: number) => boolean; // إرجاع نجاح أو فشل
    addOrderRevenue: (amount: number) => void;
    updateProduct: (product: InventoryProduct) => void;
    addProduct: (product: Omit<InventoryProduct, 'id'>) => void;
    deleteProduct: (productId: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// مزود السياق
export function InventoryProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<InventoryProduct[]>(initialProducts);
    const [ordersRevenue, setOrdersRevenue] = useState(0);

    // الحصول على المنتجات المتاحة للطلب (طعام ومشروبات فقط، نشطة، متوفرة)
    const getOrderableProducts = () => {
        return products.filter(p => (p.type === 'food' || p.type === 'drink') && p.is_active && p.stock_quantity > 0);
    };

    // تقليل المخزون
    const reduceStock = (productId: string, quantity: number): boolean => {
        const product = products.find(p => p.id === productId);
        if (!product || product.stock_quantity < quantity) {
            return false;
        }
        setProducts(prev => prev.map(p =>
            p.id === productId ? { ...p, stock_quantity: p.stock_quantity - quantity } : p
        ));
        return true;
    };

    // إضافة إيرادات الطلبات
    const addOrderRevenue = (amount: number) => {
        setOrdersRevenue(prev => prev + amount);
    };

    // تحديث منتج
    const updateProduct = (product: InventoryProduct) => {
        setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    };

    // إضافة منتج
    const addProduct = (product: Omit<InventoryProduct, 'id'>) => {
        const newProduct: InventoryProduct = { ...product, id: `p-${Date.now()}` };
        setProducts(prev => [...prev, newProduct]);
    };

    // حذف منتج
    const deleteProduct = (productId: string) => {
        setProducts(prev => prev.filter(p => p.id !== productId));
    };

    return (
        <InventoryContext.Provider value={{
            products,
            ordersRevenue,
            getOrderableProducts,
            reduceStock,
            addOrderRevenue,
            updateProduct,
            addProduct,
            deleteProduct,
        }}>
            {children}
        </InventoryContext.Provider>
    );
}

// هوك للاستخدام
export function useInventory() {
    const context = useContext(InventoryContext);
    if (context === undefined) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
}
