/* =================================================================
   CAIROOM - End Session Payment Modal
   نافذة الدفع وإنهاء الجلسة - أهم جزء في النظام
   ================================================================= */

'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Session, Table, Order, PaymentMethod } from '@/types/database';
import { formatCurrency, calculateSessionDuration, cn } from '@/lib/utils';
import {
    Banknote,
    CreditCard,
    Wallet,
    Smartphone,
    Clock,
    Users,
    ShoppingBag,
    Receipt,
    AlertCircle,
    CheckCircle2,
    Printer,
} from 'lucide-react';

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    session: Session | null;
    table: Table | null;
    orders: Order[];
    userWalletBalance?: number; // رصيد محفظة المستخدم إذا كان عضو
    onConfirmPayment: (data: {
        paymentMethod: PaymentMethod;
        paidAmount: number;
        cardHolderName?: string;
        walletNumber?: string;
    }) => void;
}

type PaymentStep = 'summary' | 'method' | 'details' | 'complete';

export function PaymentModal({
    open,
    onOpenChange,
    session,
    table,
    orders,
    userWalletBalance = 0,
    onConfirmPayment,
}: PaymentModalProps) {
    const [step, setStep] = useState<PaymentStep>('summary');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [cardHolderName, setCardHolderName] = useState('');
    const [walletNumber, setWalletNumber] = useState('');

    // حساب التفاصيل
    const duration = session ? calculateSessionDuration(session.start_time) : { hours: 0, minutes: 0 };
    const durationHours = duration.hours + (duration.minutes / 60);

    // تكلفة الوقت
    const timeCost = session && table
        ? Math.ceil(durationHours * table.price_per_hour_per_person * session.guest_count)
        : 0;

    // تكلفة الطلبات
    const ordersCost = orders.reduce((sum, order) => sum + (order.price_at_time * order.quantity), 0);

    // الإجمالي
    const totalAmount = timeCost + ordersCost;

    // التحقق من رصيد المحفظة
    const hasInsufficientBalance = paymentMethod === 'cairoom_wallet' && userWalletBalance < totalAmount;

    // إعادة التعيين عند الإغلاق
    useEffect(() => {
        if (!open) {
            setStep('summary');
            setPaymentMethod('cash');
            setCardHolderName('');
            setWalletNumber('');
        }
    }, [open]);

    const handleProceed = () => {
        if (step === 'summary') {
            setStep('method');
        } else if (step === 'method') {
            if (paymentMethod === 'cash') {
                // الكاش لا يحتاج تفاصيل إضافية
                setStep('complete');
            } else {
                setStep('details');
            }
        } else if (step === 'details') {
            // التحقق من البيانات
            if (paymentMethod === 'visa' && !cardHolderName.trim()) return;
            if (paymentMethod === 'mobile_wallet' && !walletNumber.trim()) return;
            if (hasInsufficientBalance) return;
            setStep('complete');
        }
    };

    const handleConfirm = () => {
        onConfirmPayment({
            paymentMethod,
            paidAmount: totalAmount,
            cardHolderName: paymentMethod === 'visa' ? cardHolderName : undefined,
            walletNumber: paymentMethod === 'mobile_wallet' ? walletNumber : undefined,
        });
    };

    if (!session || !table) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass-modal sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="gradient-text text-xl">
                        {step === 'complete' ? 'تم الدفع بنجاح! ✨' : 'إنهاء الجلسة والدفع'}
                    </DialogTitle>
                    <DialogDescription>
                        {table.name} • {session.guest_count} ضيوف
                    </DialogDescription>
                </DialogHeader>

                {/* ملخص الجلسة */}
                {step === 'summary' && (
                    <div className="space-y-4 py-4">
                        {/* المدة */}
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
                            <Clock className="h-5 w-5 text-[#F18A21]" />
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">مدة الجلسة</p>
                                <p className="font-medium">{duration.hours} ساعة و {duration.minutes} دقيقة</p>
                            </div>
                            <span className="font-bold">{formatCurrency(timeCost)}</span>
                        </div>

                        {/* الضيوف */}
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
                            <Users className="h-5 w-5 text-[#F18A21]" />
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">عدد الضيوف</p>
                                <p className="font-medium">{session.guest_count} × {formatCurrency(table.price_per_hour_per_person)}/ساعة</p>
                            </div>
                        </div>

                        {/* الطلبات */}
                        {orders.length > 0 && (
                            <div className="p-4 rounded-xl bg-white/5">
                                <div className="flex items-center gap-3 mb-3">
                                    <ShoppingBag className="h-5 w-5 text-[#F18A21]" />
                                    <span className="font-medium">الطلبات ({orders.length})</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {orders.map((order, index) => (
                                        <div key={index} className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                {order.product?.name || 'منتج'} × {order.quantity}
                                            </span>
                                            <span>{formatCurrency(order.price_at_time * order.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="my-3 bg-white/10" />
                                <div className="flex justify-between font-medium">
                                    <span>إجمالي الطلبات</span>
                                    <span>{formatCurrency(ordersCost)}</span>
                                </div>
                            </div>
                        )}

                        <Separator className="bg-white/10" />

                        {/* الإجمالي الكلي */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#E63E32]/20 to-[#F8C033]/20 border border-white/10">
                            <span className="text-lg font-bold">الإجمالي المطلوب</span>
                            <span className="text-2xl font-bold gradient-text">{formatCurrency(totalAmount)}</span>
                        </div>

                        <Button className="w-full gradient-button" onClick={handleProceed}>
                            اختر طريقة الدفع
                        </Button>
                    </div>
                )}

                {/* اختيار طريقة الدفع */}
                {step === 'method' && (
                    <div className="space-y-4 py-4">
                        <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                            {/* كاش */}
                            <div
                                className={cn(
                                    'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all',
                                    paymentMethod === 'cash'
                                        ? 'border-[#F18A21] bg-[#F18A21]/10'
                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                )}
                                onClick={() => setPaymentMethod('cash')}
                            >
                                <RadioGroupItem value="cash" id="cash" />
                                <Banknote className="h-6 w-6 text-emerald-400" />
                                <div className="flex-1">
                                    <Label htmlFor="cash" className="text-base font-medium cursor-pointer">كاش</Label>
                                    <p className="text-sm text-muted-foreground">دفع نقدي مباشر</p>
                                </div>
                            </div>

                            {/* فيزا */}
                            <div
                                className={cn(
                                    'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all',
                                    paymentMethod === 'visa'
                                        ? 'border-[#F18A21] bg-[#F18A21]/10'
                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                )}
                                onClick={() => setPaymentMethod('visa')}
                            >
                                <RadioGroupItem value="visa" id="visa" />
                                <CreditCard className="h-6 w-6 text-blue-400" />
                                <div className="flex-1">
                                    <Label htmlFor="visa" className="text-base font-medium cursor-pointer">بطاقة ائتمان</Label>
                                    <p className="text-sm text-muted-foreground">فيزا / ماستركارد</p>
                                </div>
                            </div>

                            {/* محفظة موبايل */}
                            <div
                                className={cn(
                                    'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all',
                                    paymentMethod === 'mobile_wallet'
                                        ? 'border-[#F18A21] bg-[#F18A21]/10'
                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                )}
                                onClick={() => setPaymentMethod('mobile_wallet')}
                            >
                                <RadioGroupItem value="mobile_wallet" id="mobile_wallet" />
                                <Smartphone className="h-6 w-6 text-purple-400" />
                                <div className="flex-1">
                                    <Label htmlFor="mobile_wallet" className="text-base font-medium cursor-pointer">محفظة موبايل</Label>
                                    <p className="text-sm text-muted-foreground">فودافون كاش / اتصالات كاش / أورانج</p>
                                </div>
                            </div>

                            {/* محفظة كيروم */}
                            <div
                                className={cn(
                                    'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all',
                                    paymentMethod === 'cairoom_wallet'
                                        ? 'border-[#F18A21] bg-[#F18A21]/10'
                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                )}
                                onClick={() => setPaymentMethod('cairoom_wallet')}
                            >
                                <RadioGroupItem value="cairoom_wallet" id="cairoom_wallet" />
                                <Wallet className="h-6 w-6 text-[#F8C033]" />
                                <div className="flex-1">
                                    <Label htmlFor="cairoom_wallet" className="text-base font-medium cursor-pointer">محفظة CAIROOM</Label>
                                    <p className="text-sm text-muted-foreground">
                                        الرصيد الحالي: {formatCurrency(userWalletBalance)}
                                    </p>
                                </div>
                            </div>
                        </RadioGroup>

                        <div className="flex gap-2">
                            <Button variant="ghost" className="glass-button" onClick={() => setStep('summary')}>
                                رجوع
                            </Button>
                            <Button className="flex-1 gradient-button" onClick={handleProceed}>
                                متابعة
                            </Button>
                        </div>
                    </div>
                )}

                {/* تفاصيل الدفع */}
                {step === 'details' && (
                    <div className="space-y-4 py-4">
                        {/* فيزا - اسم حامل البطاقة */}
                        {paymentMethod === 'visa' && (
                            <div className="space-y-2">
                                <Label>اسم حامل البطاقة</Label>
                                <Input
                                    placeholder="الاسم كما هو على البطاقة"
                                    value={cardHolderName}
                                    onChange={(e) => setCardHolderName(e.target.value)}
                                    className="glass-input"
                                />
                            </div>
                        )}

                        {/* محفظة موبايل - رقم المحفظة */}
                        {paymentMethod === 'mobile_wallet' && (
                            <div className="space-y-2">
                                <Label>رقم المحفظة</Label>
                                <Input
                                    placeholder="01XXXXXXXXX"
                                    value={walletNumber}
                                    onChange={(e) => setWalletNumber(e.target.value)}
                                    className="glass-input"
                                    dir="ltr"
                                />
                            </div>
                        )}

                        {/* محفظة كيروم - التحقق من الرصيد */}
                        {paymentMethod === 'cairoom_wallet' && (
                            <div className={cn(
                                'p-4 rounded-xl border',
                                hasInsufficientBalance
                                    ? 'bg-red-500/10 border-red-500/30'
                                    : 'bg-emerald-500/10 border-emerald-500/30'
                            )}>
                                {hasInsufficientBalance ? (
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="h-6 w-6 text-red-400" />
                                        <div>
                                            <p className="font-medium text-red-400">رصيده مايكفيش يا معلم! 😅</p>
                                            <p className="text-sm text-muted-foreground">
                                                المطلوب: {formatCurrency(totalAmount)} | الموجود: {formatCurrency(userWalletBalance)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                الفرق: {formatCurrency(totalAmount - userWalletBalance)}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                                        <div>
                                            <p className="font-medium text-emerald-400">الرصيد كافي ✓</p>
                                            <p className="text-sm text-muted-foreground">
                                                سيتم خصم {formatCurrency(totalAmount)} من المحفظة
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                الرصيد المتبقي: {formatCurrency(userWalletBalance - totalAmount)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="ghost" className="glass-button" onClick={() => setStep('method')}>
                                رجوع
                            </Button>
                            <Button
                                className="flex-1 gradient-button"
                                onClick={handleProceed}
                                disabled={hasInsufficientBalance || (paymentMethod === 'visa' && !cardHolderName.trim()) || (paymentMethod === 'mobile_wallet' && !walletNumber.trim())}
                            >
                                تأكيد الدفع
                            </Button>
                        </div>
                    </div>
                )}

                {/* تم الدفع */}
                {step === 'complete' && (
                    <div className="space-y-6 py-4 text-center">
                        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold">تمام يا باشا! 🎉</h3>
                            <p className="text-muted-foreground mt-1">الجلسة خلصت والفلوس وصلت</p>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">الإجمالي المدفوع</span>
                                <span className="font-bold gradient-text">{formatCurrency(totalAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">طريقة الدفع</span>
                                <span>
                                    {paymentMethod === 'cash' && 'كاش'}
                                    {paymentMethod === 'visa' && 'بطاقة ائتمان'}
                                    {paymentMethod === 'mobile_wallet' && 'محفظة موبايل'}
                                    {paymentMethod === 'cairoom_wallet' && 'محفظة CAIROOM'}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="ghost" className="flex-1 glass-button" onClick={() => onOpenChange(false)}>
                                إغلاق
                            </Button>
                            <Button className="flex-1 gradient-button" onClick={handleConfirm}>
                                <Printer className="h-4 w-4 ml-2" />
                                طباعة الفاتورة
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
