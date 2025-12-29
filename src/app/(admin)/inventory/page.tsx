/* =================================================================
   CAIROOM - Inventory Management Page
   صفحة إدارة المخزن
   ================================================================= */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import {
    Search,
    Plus,
    MoreHorizontal,
    Package,
    Coffee,
    UtensilsCrossed,
    SprayCan,
    Laptop,
    Edit,
    Trash2,
    AlertTriangle,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { Product, ProductType } from '@/types/database';

// أيقونات الأنواع
const typeIcons: Record<ProductType, React.ReactNode> = {
    food: <UtensilsCrossed className="h-4 w-4" />,
    drink: <Coffee className="h-4 w-4" />,
    cleaning: <SprayCan className="h-4 w-4" />,
    asset: <Laptop className="h-4 w-4" />,
};

const typeLabels: Record<ProductType, string> = {
    food: 'طعام',
    drink: 'مشروبات',
    cleaning: 'نظافة',
    asset: 'أصول',
};

// بيانات تجريبية
const mockProducts: Product[] = [
    { id: '1', name: 'قهوة تركي', type: 'drink', price: 15, cost_price: 5, stock_quantity: 100, image_url: null, is_active: true, created_at: '', updated_at: '' },
    { id: '2', name: 'نسكافيه', type: 'drink', price: 12, cost_price: 4, stock_quantity: 80, image_url: null, is_active: true, created_at: '', updated_at: '' },
    { id: '3', name: 'شاي', type: 'drink', price: 8, cost_price: 2, stock_quantity: 200, image_url: null, is_active: true, created_at: '', updated_at: '' },
    { id: '4', name: 'عصير برتقال', type: 'drink', price: 20, cost_price: 10, stock_quantity: 5, image_url: null, is_active: true, created_at: '', updated_at: '' },
    { id: '5', name: 'ساندويتش جبنة', type: 'food', price: 25, cost_price: 12, stock_quantity: 30, image_url: null, is_active: true, created_at: '', updated_at: '' },
    { id: '6', name: 'كرواسون', type: 'food', price: 18, cost_price: 8, stock_quantity: 40, image_url: null, is_active: true, created_at: '', updated_at: '' },
    { id: '7', name: 'بسكويت', type: 'food', price: 10, cost_price: 4, stock_quantity: 0, image_url: null, is_active: false, created_at: '', updated_at: '' },
    { id: '8', name: 'منظف زجاج', type: 'cleaning', price: 35, cost_price: 20, stock_quantity: 15, image_url: null, is_active: true, created_at: '', updated_at: '' },
    { id: '9', name: 'مناديل', type: 'cleaning', price: 15, cost_price: 8, stock_quantity: 8, image_url: null, is_active: true, created_at: '', updated_at: '' },
    { id: '10', name: 'لابتوب احتياطي', type: 'asset', price: 0, cost_price: 15000, stock_quantity: 2, image_url: null, is_active: true, created_at: '', updated_at: '' },
];

const LOW_STOCK_THRESHOLD = 10;

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>(mockProducts);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<ProductType | 'all'>('all');
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // حالة المنتج الجديد/المعدل
    const [formData, setFormData] = useState({
        name: '',
        type: 'drink' as ProductType,
        price: 0,
        cost_price: 0,
        stock_quantity: 0,
        is_active: true,
    });

    // تصفية المنتجات
    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === 'all' || product.type === selectedType;
        return matchesSearch && matchesType;
    });

    // إحصائيات
    const stats = {
        total: products.length,
        lowStock: products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= LOW_STOCK_THRESHOLD).length,
        outOfStock: products.filter((p) => p.stock_quantity === 0).length,
        totalValue: products.reduce((sum, p) => sum + p.cost_price * p.stock_quantity, 0),
    };

    const handleAddProduct = () => {
        setSelectedProduct(null);
        setFormData({
            name: '',
            type: 'drink',
            price: 0,
            cost_price: 0,
            stock_quantity: 0,
            is_active: true,
        });
        setProductModalOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setSelectedProduct(product);
        setFormData({
            name: product.name,
            type: product.type,
            price: product.price,
            cost_price: product.cost_price,
            stock_quantity: product.stock_quantity,
            is_active: product.is_active,
        });
        setProductModalOpen(true);
    };

    const handleSaveProduct = () => {
        if (!formData.name.trim()) return;

        if (selectedProduct) {
            // تعديل
            setProducts((prev) =>
                prev.map((p) =>
                    p.id === selectedProduct.id
                        ? { ...p, ...formData, updated_at: new Date().toISOString() }
                        : p
                )
            );
            toast.success('تم تعديل المنتج بنجاح');
        } else {
            // إضافة جديدة
            const newProduct: Product = {
                id: `product-${Date.now()}`,
                ...formData,
                image_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            setProducts((prev) => [...prev, newProduct]);
            toast.success('تم إضافة المنتج بنجاح');
        }
        setProductModalOpen(false);
    };

    const handleDeleteProduct = (productId: string) => {
        if (confirm('متأكد إنك عايز تحذف المنتج ده؟')) {
            setProducts((prev) => prev.filter((p) => p.id !== productId));
            toast.success('تم حذف المنتج');
        }
    };

    const getStockStatus = (quantity: number) => {
        if (quantity === 0) return { label: 'نفذ', class: 'bg-red-500/20 text-red-400 border-red-500/30' };
        if (quantity <= LOW_STOCK_THRESHOLD) return { label: 'منخفض', class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
        return { label: 'متوفر', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    };

    return (
        <div className="space-y-6">
            {/* العنوان والإحصائيات */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">إدارة المخزن</h1>
                    <p className="text-muted-foreground mt-1">إدارة المنتجات والمخزون</p>
                </div>

                <div className="flex gap-4 flex-wrap">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card">
                        <Package className="h-4 w-4 text-[#F18A21]" />
                        <span className="text-sm">{stats.total} منتج</span>
                    </div>
                    {stats.lowStock > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card border border-yellow-500/30">
                            <TrendingDown className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm text-yellow-400">{stats.lowStock} منخفض</span>
                        </div>
                    )}
                    {stats.outOfStock > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card border border-red-500/30">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                            <span className="text-sm text-red-400">{stats.outOfStock} نفذ</span>
                        </div>
                    )}
                </div>
            </div>

            {/* شريط الأدوات */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="ابحث عن منتج..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="glass-input pr-10"
                    />
                </div>

                <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as typeof selectedType)}>
                    <TabsList className="glass-card">
                        <TabsTrigger value="all">الكل</TabsTrigger>
                        <TabsTrigger value="drink">مشروبات</TabsTrigger>
                        <TabsTrigger value="food">طعام</TabsTrigger>
                        <TabsTrigger value="cleaning">نظافة</TabsTrigger>
                        <TabsTrigger value="asset">أصول</TabsTrigger>
                    </TabsList>
                </Tabs>

                <Button className="gradient-button" onClick={handleAddProduct}>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة منتج
                </Button>
            </div>

            {/* جدول المنتجات */}
            <Card className="glass-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-right">المنتج</TableHead>
                            <TableHead className="text-right">النوع</TableHead>
                            <TableHead className="text-right">سعر البيع</TableHead>
                            <TableHead className="text-right">سعر التكلفة</TableHead>
                            <TableHead className="text-right">الربح</TableHead>
                            <TableHead className="text-right">الكمية</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right w-[80px]">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product) => {
                            const profit = product.price - product.cost_price;
                            const profitPercentage = product.cost_price > 0 ? ((profit / product.cost_price) * 100).toFixed(0) : 0;
                            const stockStatus = getStockStatus(product.stock_quantity);

                            return (
                                <TableRow key={product.id} className="border-white/5 hover:bg-white/5">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-white/5">
                                                {typeIcons[product.type]}
                                            </div>
                                            <span className="font-medium">{product.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-white/5">
                                            {typeLabels[product.type]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{formatCurrency(product.price)}</TableCell>
                                    <TableCell className="text-muted-foreground">{formatCurrency(product.cost_price)}</TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            'flex items-center gap-1',
                                            profit > 0 ? 'text-emerald-400' : 'text-muted-foreground'
                                        )}>
                                            {profit > 0 && <TrendingUp className="h-3 w-3" />}
                                            {formatCurrency(profit)} ({profitPercentage}%)
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-mono font-medium">{product.stock_quantity}</TableCell>
                                    <TableCell>
                                        <Badge className={cn('border', stockStatus.class)}>
                                            {stockStatus.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="glass-button">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="glass-modal">
                                                <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                                    <Edit className="ml-2 h-4 w-4" />
                                                    تعديل
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-400"
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                >
                                                    <Trash2 className="ml-2 h-4 w-4" />
                                                    حذف
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                {filteredProducts.length === 0 && (
                    <div className="py-12 text-center">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">مفيش منتجات</h3>
                        <p className="text-muted-foreground mt-1">
                            {searchQuery ? 'جرب تبحث بكلمة تانية' : 'اضغط على "إضافة منتج" عشان تضيف أول منتج'}
                        </p>
                    </div>
                )}
            </Card>

            {/* نافذة إضافة/تعديل منتج */}
            <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">
                            {selectedProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedProduct ? 'عدّل بيانات المنتج' : 'أدخل بيانات المنتج الجديد'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>اسم المنتج *</Label>
                            <Input
                                placeholder="قهوة تركي"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="glass-input"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>نوع المنتج *</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v) => setFormData({ ...formData, type: v as ProductType })}
                            >
                                <SelectTrigger className="glass-input">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-modal">
                                    <SelectItem value="drink">مشروبات</SelectItem>
                                    <SelectItem value="food">طعام</SelectItem>
                                    <SelectItem value="cleaning">مستلزمات نظافة</SelectItem>
                                    <SelectItem value="asset">أصول</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>سعر البيع (ج.م)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                    className="glass-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>سعر التكلفة (ج.م)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.cost_price}
                                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                                    className="glass-input"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>الكمية الحالية</Label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.stock_quantity}
                                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                                className="glass-input"
                            />
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label>المنتج متاح للبيع</Label>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setProductModalOpen(false)}>
                            إلغاء
                        </Button>
                        <Button
                            className="gradient-button"
                            onClick={handleSaveProduct}
                            disabled={!formData.name.trim()}
                        >
                            {selectedProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
