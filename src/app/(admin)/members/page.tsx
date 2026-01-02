/* =================================================================
   CAIROOM - Members Management Page
   صفحة إدارة الأعضاء
   ================================================================= */

'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { formatCurrency, formatArabicDate, formatPhoneNumber } from '@/lib/utils';
import {
    Search,
    Plus,
    MoreHorizontal,
    User,
    Phone,
    Mail,
    Wallet,
    Clock,
    Gamepad2,
    Trophy,
    Edit,
    Trash2,
    Eye,
    Download,
    UserPlus,
} from 'lucide-react';
import { User as UserType } from '@/types/database';

// بيانات تجريبية للأعضاء
const mockMembers: UserType[] = [
    {
        id: '1',
        full_name: 'أحمد محمد السعيدي',
        phone: '01012345678',
        email: 'ahmed@example.com',
        gender: 'male',
        role: 'user',
        cairoom_wallet_balance: 250,
        affiliate_balance: 75,
        referral_code: 'CR-ABC123',
        referred_by: null,
        avatar_url: null,
        nickname: 'الفهد',
        game_stats: { wins: 12, attended: 25 },
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-12-28T14:00:00Z',
    },
    {
        id: '2',
        full_name: 'محمد علي',
        phone: '01123456789',
        email: 'mohamed@example.com',
        gender: 'male',
        role: 'user',
        cairoom_wallet_balance: 100,
        affiliate_balance: 0,
        referral_code: 'CR-DEF456',
        referred_by: '1',
        avatar_url: null,
        nickname: 'النمر',
        game_stats: { wins: 5, attended: 15 },
        created_at: '2024-02-20T15:45:00Z',
        updated_at: '2024-12-27T10:00:00Z',
    },
    {
        id: '3',
        full_name: 'سارة أحمد',
        phone: '01234567890',
        email: 'sara@example.com',
        gender: 'female',
        role: 'user',
        cairoom_wallet_balance: 500,
        affiliate_balance: 120,
        referral_code: 'CR-GHI789',
        referred_by: null,
        avatar_url: null,
        nickname: null,
        game_stats: { wins: 0, attended: 3 },
        created_at: '2024-06-10T09:00:00Z',
        updated_at: '2024-12-25T16:30:00Z',
    },
    {
        id: '4',
        full_name: 'عمر حسن',
        phone: '01098765432',
        email: null,
        gender: 'male',
        role: 'user',
        cairoom_wallet_balance: 0,
        affiliate_balance: 0,
        referral_code: 'CR-JKL012',
        referred_by: '3',
        avatar_url: null,
        nickname: 'الصقر',
        game_stats: { wins: 20, attended: 30 },
        created_at: '2024-03-05T12:00:00Z',
        updated_at: '2024-12-29T08:00:00Z',
    },
];

// سجل زيارات تجريبية
const mockVisitHistory = [
    { id: 'v1', memberId: '1', date: '2024-12-28', startTime: '14:00', endTime: '17:30', tableName: 'طاولة ١', totalCost: 163 },
    { id: 'v2', memberId: '1', date: '2024-12-25', startTime: '10:00', endTime: '12:00', tableName: 'طاولة ٢', totalCost: 100 },
    { id: 'v3', memberId: '1', date: '2024-12-20', startTime: '16:00', endTime: '19:00', tableName: 'غرفة VIP', totalCost: 350 },
    { id: 'v4', memberId: '2', date: '2024-12-27', startTime: '11:00', endTime: '14:00', tableName: 'طاولة ٣', totalCost: 120 },
    { id: 'v5', memberId: '3', date: '2024-12-25', startTime: '15:00', endTime: '18:00', tableName: 'طاولة ١', totalCost: 150 },
];

export default function MembersPage() {
    const [members, setMembers] = useState<UserType[]>(mockMembers);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState<UserType | null>(null);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
    const [walletAdjustModalOpen, setWalletAdjustModalOpen] = useState(false);
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');

    // فلاتر جديدة
    const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
    const [joinDateFilter, setJoinDateFilter] = useState('');
    const [lastVisitSort, setLastVisitSort] = useState<'newest' | 'oldest' | 'none'>('none');
    const [walletSort, setWalletSort] = useState<'highest' | 'lowest' | 'none'>('none');

    // نوافذ جديدة
    const [editMemberModalOpen, setEditMemberModalOpen] = useState(false);
    const [lastVisitsModalOpen, setLastVisitsModalOpen] = useState(false);
    const [visitInvoiceModal, setVisitInvoiceModal] = useState<typeof mockVisitHistory[0] | null>(null);

    // نموذج إضافة عضو
    const [newMemberForm, setNewMemberForm] = useState({
        full_name: '', phone: '', email: '', nickname: '', gender: 'male' as 'male' | 'female'
    });

    // نموذج تعديل عضو
    const [editMemberForm, setEditMemberForm] = useState({
        full_name: '', phone: '', email: '', nickname: ''
    });

    // تصفية وترتيب الأعضاء
    const filteredMembers = members
        .filter((member) => {
            const query = searchQuery.toLowerCase();
            const matchSearch = member.full_name.toLowerCase().includes(query) ||
                member.phone.includes(query) ||
                member.email?.toLowerCase().includes(query) ||
                member.nickname?.toLowerCase().includes(query);
            const matchGender = genderFilter === 'all' || member.gender === genderFilter;
            const matchJoinDate = !joinDateFilter || member.created_at.startsWith(joinDateFilter);
            return matchSearch && matchGender && matchJoinDate;
        })
        .sort((a, b) => {
            if (lastVisitSort === 'newest') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
            if (lastVisitSort === 'oldest') return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
            if (walletSort === 'highest') return b.cairoom_wallet_balance - a.cairoom_wallet_balance;
            if (walletSort === 'lowest') return a.cairoom_wallet_balance - b.cairoom_wallet_balance;
            return 0;
        });

    // تصدير CSV
    const handleExportCSV = () => {
        const headers = ['الاسم', 'الهاتف', 'الإيميل', 'الجنس', 'رصيد المحفظة', 'تاريخ الانضمام', 'آخر زيارة'];
        const rows = filteredMembers.map(m => [
            m.full_name,
            m.phone,
            m.email || '',
            m.gender === 'male' ? 'ذكر' : 'أنثى',
            m.cairoom_wallet_balance.toString(),
            m.created_at.split('T')[0],
            m.updated_at.split('T')[0]
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `members_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('تم تصدير الأعضاء كـ CSV');
    };

    // إحصائيات سريعة
    const stats = {
        total: members.length,
        activeWallet: members.filter((m) => m.cairoom_wallet_balance > 0).length,
        gamers: members.filter((m) => m.game_stats.attended > 0).length,
        totalWalletBalance: members.reduce((sum, m) => sum + m.cairoom_wallet_balance, 0),
    };

    const handleViewProfile = (member: UserType) => {
        setSelectedMember(member);
        setProfileModalOpen(true);
    };

    const handleAdjustWallet = (member: UserType) => {
        setSelectedMember(member);
        setAdjustmentAmount('');
        setAdjustmentType('add');
        setWalletAdjustModalOpen(true);
    };

    const handleConfirmWalletAdjustment = () => {
        if (!selectedMember || !adjustmentAmount) return;

        const amount = parseFloat(adjustmentAmount);
        if (isNaN(amount) || amount <= 0) return;

        const newBalance = adjustmentType === 'add'
            ? selectedMember.cairoom_wallet_balance + amount
            : Math.max(0, selectedMember.cairoom_wallet_balance - amount);

        setMembers((prev) =>
            prev.map((m) =>
                m.id === selectedMember.id ? { ...m, cairoom_wallet_balance: newBalance } : m
            )
        );

        toast.success(
            adjustmentType === 'add'
                ? `تم إضافة ${formatCurrency(amount)} لمحفظة ${selectedMember.full_name}`
                : `تم خصم ${formatCurrency(amount)} من محفظة ${selectedMember.full_name}`
        );

        setWalletAdjustModalOpen(false);
        setSelectedMember(null);
    };

    // إضافة عضو جديد
    const handleAddMember = () => {
        if (!newMemberForm.full_name || !newMemberForm.phone) {
            toast.error('يرجى إدخال الاسم ورقم الهاتف');
            return;
        }
        const newMember: UserType = {
            id: Date.now().toString(),
            full_name: newMemberForm.full_name,
            phone: newMemberForm.phone,
            email: newMemberForm.email || null,
            gender: newMemberForm.gender,
            role: 'user',
            cairoom_wallet_balance: 0,
            affiliate_balance: 0,
            referral_code: `CR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            referred_by: null,
            avatar_url: null,
            nickname: newMemberForm.nickname || null,
            game_stats: { wins: 0, attended: 0 },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setMembers(prev => [...prev, newMember]);
        setAddMemberModalOpen(false);
        setNewMemberForm({ full_name: '', phone: '', email: '', nickname: '', gender: 'male' });
        toast.success('تم إضافة العضو بنجاح');
    };

    // فتح تعديل عضو
    const handleOpenEditMember = (member: UserType) => {
        setSelectedMember(member);
        setEditMemberForm({
            full_name: member.full_name,
            phone: member.phone,
            email: member.email || '',
            nickname: member.nickname || ''
        });
        setEditMemberModalOpen(true);
    };

    // حفظ تعديل عضو
    const handleSaveEditMember = () => {
        if (!selectedMember || !editMemberForm.full_name || !editMemberForm.phone) {
            toast.error('يرجى إدخال الاسم ورقم الهاتف');
            return;
        }
        setMembers(prev => prev.map(m =>
            m.id === selectedMember.id ? {
                ...m,
                full_name: editMemberForm.full_name,
                phone: editMemberForm.phone,
                email: editMemberForm.email || null,
                nickname: editMemberForm.nickname || null,
                updated_at: new Date().toISOString()
            } : m
        ));
        setEditMemberModalOpen(false);
        setSelectedMember(null);
        toast.success('تم تعديل بيانات العضو بنجاح');
    };

    // فتح آخر الزيارات
    const handleOpenLastVisits = (member: UserType) => {
        setSelectedMember(member);
        setLastVisitsModalOpen(true);
    };

    // الحصول على زيارات العضو
    const getMemberVisits = (memberId: string) => {
        return mockVisitHistory.filter(v => v.memberId === memberId).slice(0, 10);
    };

    const handleDeleteMember = (memberId: string) => {
        // في الواقع سيكون soft delete
        if (confirm('متأكد إنك عايز تحذف العضو ده؟')) {
            setMembers((prev) => prev.filter((m) => m.id !== memberId));
            toast.success('تم حذف العضو');
        }
    };

    return (
        <div className="space-y-6">
            {/* العنوان والإحصائيات */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">إدارة الأعضاء</h1>
                    <p className="text-muted-foreground mt-1">قائمة كاملة بأعضاء المكان</p>
                </div>

                {/* إحصائيات سريعة */}
                <div className="flex gap-4 flex-wrap">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card">
                        <User className="h-4 w-4 text-[#F18A21]" />
                        <span className="text-sm">{stats.total} عضو</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card">
                        <Wallet className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm">{formatCurrency(stats.totalWalletBalance)}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card">
                        <Gamepad2 className="h-4 w-4 text-purple-400" />
                        <span className="text-sm">{stats.gamers} لاعب</span>
                    </div>
                </div>
            </div>

            {/* شريط الأدوات */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="ابحث بالاسم، الهاتف، أو الإيميل..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="glass-input pr-10"
                        />
                    </div>
                    <Button variant="ghost" className="glass-button" onClick={handleExportCSV}>
                        <Download className="h-4 w-4 ml-2" />
                        تصدير CSV
                    </Button>
                    <Button className="gradient-button" onClick={() => setAddMemberModalOpen(true)}>
                        <UserPlus className="h-4 w-4 ml-2" />
                        إضافة عضو
                    </Button>
                </div>

                {/* الفلاتر */}
                <div className="flex flex-wrap gap-2">
                    {/* فلتر الجنس */}
                    <select
                        value={genderFilter}
                        onChange={(e) => setGenderFilter(e.target.value as 'all' | 'male' | 'female')}
                        className="glass-input text-sm px-3 py-2 rounded-lg w-auto min-w-[120px]"
                    >
                        <option value="all">كل الجنس</option>
                        <option value="male">ذكر</option>
                        <option value="female">أنثى</option>
                    </select>

                    {/* فلتر تاريخ الانضمام */}
                    <Input
                        type="date"
                        value={joinDateFilter}
                        onChange={(e) => setJoinDateFilter(e.target.value)}
                        className="glass-input text-sm w-auto"
                        placeholder="تاريخ الانضمام"
                    />

                    {/* ترتيب آخر زيارة */}
                    <select
                        value={lastVisitSort}
                        onChange={(e) => { setLastVisitSort(e.target.value as 'newest' | 'oldest' | 'none'); setWalletSort('none'); }}
                        className="glass-input text-sm px-3 py-2 rounded-lg w-auto min-w-[140px]"
                    >
                        <option value="none">آخر زيارة</option>
                        <option value="newest">الأحدث أولاً</option>
                        <option value="oldest">الأقدم أولاً</option>
                    </select>

                    {/* ترتيب رصيد المحفظة */}
                    <select
                        value={walletSort}
                        onChange={(e) => { setWalletSort(e.target.value as 'highest' | 'lowest' | 'none'); setLastVisitSort('none'); }}
                        className="glass-input text-sm px-3 py-2 rounded-lg w-auto min-w-[140px]"
                    >
                        <option value="none">رصيد المحفظة</option>
                        <option value="highest">الأعلى أولاً</option>
                        <option value="lowest">الأقل أولاً</option>
                    </select>

                    {/* زر مسح الفلاتر */}
                    {(genderFilter !== 'all' || joinDateFilter || lastVisitSort !== 'none' || walletSort !== 'none') && (
                        <Button variant="ghost" size="sm" className="glass-button text-xs"
                            onClick={() => { setGenderFilter('all'); setJoinDateFilter(''); setLastVisitSort('none'); setWalletSort('none'); }}>
                            مسح الفلاتر
                        </Button>
                    )}
                </div>
            </div>

            {/* جدول الأعضاء */}
            <Card className="glass-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-right">العضو</TableHead>
                            <TableHead className="text-right">الهاتف</TableHead>
                            <TableHead className="text-right">الإيميل</TableHead>
                            <TableHead className="text-right">رصيد المحفظة</TableHead>
                            <TableHead className="text-right">آخر زيارة</TableHead>
                            <TableHead className="text-right w-[80px]">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.map((member) => (
                            <TableRow key={member.id} className="border-white/5 hover:bg-white/5">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={member.avatar_url || ''} />
                                            <AvatarFallback className="bg-gradient-to-br from-[#E63E32] to-[#F8C033] text-white">
                                                {member.full_name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{member.full_name}</p>
                                            {member.nickname && (
                                                <p className="text-xs text-muted-foreground">@{member.nickname}</p>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell dir="ltr" className="text-right font-mono">
                                    {formatPhoneNumber(member.phone)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {member.email || '—'}
                                </TableCell>
                                <TableCell>
                                    <Badge className={member.cairoom_wallet_balance > 0 ? 'status-available' : 'bg-white/5 text-muted-foreground'}>
                                        {formatCurrency(member.cairoom_wallet_balance)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatArabicDate(member.updated_at)}
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
                                            <DropdownMenuItem onClick={() => handleViewProfile(member)}>
                                                <Eye className="ml-2 h-4 w-4" />
                                                عرض الملف
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAdjustWallet(member)}>
                                                <Wallet className="ml-2 h-4 w-4" />
                                                تعديل المحفظة
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenEditMember(member)}>
                                                <Edit className="ml-2 h-4 w-4" />
                                                تعديل البيانات
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenLastVisits(member)}>
                                                <Clock className="ml-2 h-4 w-4" />
                                                آخر الزيارات
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-400"
                                                onClick={() => handleDeleteMember(member.id)}
                                            >
                                                <Trash2 className="ml-2 h-4 w-4" />
                                                حذف العضو
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {filteredMembers.length === 0 && (
                    <div className="py-12 text-center">
                        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">مفيش أعضاء</h3>
                        <p className="text-muted-foreground mt-1">
                            {searchQuery ? 'جرب تبحث بكلمة تانية' : 'اضغط على "إضافة عضو" عشان تضيف أول عضو'}
                        </p>
                    </div>
                )}
            </Card>

            {/* نافذة الملف الشخصي */}
            <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
                <DialogContent className="glass-modal sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">ملف العضو</DialogTitle>
                    </DialogHeader>

                    {selectedMember && (
                        <div className="space-y-6 py-4">
                            {/* معلومات أساسية */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={selectedMember.avatar_url || ''} />
                                    <AvatarFallback className="bg-gradient-to-br from-[#E63E32] to-[#F8C033] text-white text-xl">
                                        {selectedMember.full_name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-lg font-bold">{selectedMember.full_name}</h3>
                                    {selectedMember.nickname && (
                                        <p className="text-muted-foreground">@{selectedMember.nickname}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        عضو منذ {formatArabicDate(selectedMember.created_at)}
                                    </p>
                                </div>
                            </div>

                            <Separator className="bg-white/10" />

                            {/* معلومات الاتصال */}
                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4 text-[#F18A21]" />
                                    معلومات الاتصال
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-white/5">
                                        <p className="text-sm text-muted-foreground">الهاتف</p>
                                        <p className="font-mono" dir="ltr">{formatPhoneNumber(selectedMember.phone)}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5">
                                        <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                                        <p className="text-sm">{selectedMember.email || '—'}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5">
                                        <p className="text-sm text-muted-foreground">الجنس</p>
                                        <p className="font-bold">{selectedMember.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-white/10" />

                            {/* إحصائيات العمل */}
                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-[#F18A21]" />
                                    إحصائيات العمل
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-white/5">
                                        <p className="text-sm text-muted-foreground">إجمالي الساعات</p>
                                        <p className="text-lg font-bold">٤٥ ساعة</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5">
                                        <p className="text-sm text-muted-foreground">إجمالي المدفوع</p>
                                        <p className="text-lg font-bold">٢,٢٥٠ ج.م</p>
                                    </div>
                                </div>
                            </div>

                            {/* إحصائيات الألعاب */}
                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Gamepad2 className="h-4 w-4 text-purple-400" />
                                    إحصائيات الألعاب
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-white/5">
                                        <p className="text-sm text-muted-foreground">البطولات المشارك فيها</p>
                                        <p className="text-lg font-bold">{selectedMember.game_stats.attended}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5">
                                        <p className="text-sm text-muted-foreground">عدد الانتصارات</p>
                                        <p className="text-lg font-bold flex items-center gap-1">
                                            <Trophy className="h-4 w-4 text-yellow-400" />
                                            {selectedMember.game_stats.wins}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* المحفظة */}
                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-emerald-400" />
                                    المحفظة
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <p className="text-sm text-muted-foreground">رصيد CAIROOM</p>
                                        <p className="text-lg font-bold text-emerald-400">
                                            {formatCurrency(selectedMember.cairoom_wallet_balance)}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-[#F18A21]/10 border border-[#F18A21]/20">
                                        <p className="text-sm text-muted-foreground">رصيد الإحالة</p>
                                        <p className="text-lg font-bold text-[#F18A21]">
                                            {formatCurrency(selectedMember.affiliate_balance)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="ghost" className="glass-button" onClick={() => setProfileModalOpen(false)}>
                            إغلاق
                        </Button>
                        <Button className="gradient-button" onClick={() => {
                            setProfileModalOpen(false);
                            if (selectedMember) handleAdjustWallet(selectedMember);
                        }}>
                            <Wallet className="h-4 w-4 ml-2" />
                            تعديل المحفظة
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة تعديل المحفظة */}
            <Dialog open={walletAdjustModalOpen} onOpenChange={setWalletAdjustModalOpen}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">تعديل رصيد المحفظة</DialogTitle>
                        <DialogDescription>
                            {selectedMember?.full_name} • الرصيد الحالي: {formatCurrency(selectedMember?.cairoom_wallet_balance || 0)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                className={`flex-1 ${adjustmentType === 'add' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'glass-button'}`}
                                onClick={() => setAdjustmentType('add')}
                            >
                                إضافة رصيد
                            </Button>
                            <Button
                                variant="ghost"
                                className={`flex-1 ${adjustmentType === 'subtract' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'glass-button'}`}
                                onClick={() => setAdjustmentType('subtract')}
                            >
                                خصم رصيد
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label>المبلغ (ج.م)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="10"
                                placeholder="0"
                                value={adjustmentAmount}
                                onChange={(e) => setAdjustmentAmount(e.target.value)}
                                className="glass-input text-2xl text-center font-bold h-16"
                            />
                        </div>

                        {adjustmentAmount && parseFloat(adjustmentAmount) > 0 && (
                            <div className="p-3 rounded-xl bg-white/5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">الرصيد بعد التعديل</span>
                                    <span className="font-bold">
                                        {formatCurrency(
                                            adjustmentType === 'add'
                                                ? (selectedMember?.cairoom_wallet_balance || 0) + parseFloat(adjustmentAmount)
                                                : Math.max(0, (selectedMember?.cairoom_wallet_balance || 0) - parseFloat(adjustmentAmount))
                                        )}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setWalletAdjustModalOpen(false)}>
                            إلغاء
                        </Button>
                        <Button
                            className="gradient-button"
                            onClick={handleConfirmWalletAdjustment}
                            disabled={!adjustmentAmount || parseFloat(adjustmentAmount) <= 0}
                        >
                            تأكيد التعديل
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة إضافة عضو */}
            <Dialog open={addMemberModalOpen} onOpenChange={setAddMemberModalOpen}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">إضافة عضو جديد</DialogTitle>
                        <DialogDescription>أدخل بيانات العضو الجديد</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>الاسم الكامل *</Label>
                            <Input placeholder="أحمد محمد" className="glass-input"
                                value={newMemberForm.full_name}
                                onChange={(e) => setNewMemberForm({ ...newMemberForm, full_name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>رقم الهاتف *</Label>
                            <Input placeholder="01XXXXXXXXX" className="glass-input" dir="ltr"
                                value={newMemberForm.phone}
                                onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>الجنس *</Label>
                            <div className="flex gap-2">
                                <Button variant="ghost"
                                    className={`flex-1 ${newMemberForm.gender === 'male' ? 'bg-[#F18A21]/20 border-[#F18A21]' : 'glass-button'}`}
                                    onClick={() => setNewMemberForm({ ...newMemberForm, gender: 'male' })}>
                                    ذكر
                                </Button>
                                <Button variant="ghost"
                                    className={`flex-1 ${newMemberForm.gender === 'female' ? 'bg-[#F18A21]/20 border-[#F18A21]' : 'glass-button'}`}
                                    onClick={() => setNewMemberForm({ ...newMemberForm, gender: 'female' })}>
                                    أنثى
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>البريد الإلكتروني</Label>
                            <Input placeholder="email@example.com" className="glass-input" dir="ltr"
                                value={newMemberForm.email}
                                onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>اسم اللعب (Nickname)</Label>
                            <Input placeholder="الفهد" className="glass-input"
                                value={newMemberForm.nickname}
                                onChange={(e) => setNewMemberForm({ ...newMemberForm, nickname: e.target.value })} />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setAddMemberModalOpen(false)}>
                            إلغاء
                        </Button>
                        <Button className="gradient-button" onClick={handleAddMember}>
                            <UserPlus className="h-4 w-4 ml-2" />
                            إضافة العضو
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة تعديل عضو */}
            <Dialog open={editMemberModalOpen} onOpenChange={setEditMemberModalOpen}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">تعديل بيانات العضو</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>الاسم الكامل *</Label>
                            <Input className="glass-input"
                                value={editMemberForm.full_name}
                                onChange={(e) => setEditMemberForm({ ...editMemberForm, full_name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>رقم الهاتف *</Label>
                            <Input className="glass-input" dir="ltr"
                                value={editMemberForm.phone}
                                onChange={(e) => setEditMemberForm({ ...editMemberForm, phone: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>البريد الإلكتروني</Label>
                            <Input className="glass-input" dir="ltr"
                                value={editMemberForm.email}
                                onChange={(e) => setEditMemberForm({ ...editMemberForm, email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>اسم اللعب (Nickname)</Label>
                            <Input className="glass-input"
                                value={editMemberForm.nickname}
                                onChange={(e) => setEditMemberForm({ ...editMemberForm, nickname: e.target.value })} />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setEditMemberModalOpen(false)}>
                            إلغاء
                        </Button>
                        <Button className="gradient-button" onClick={handleSaveEditMember}>
                            حفظ التعديلات
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة آخر الزيارات */}
            <Dialog open={lastVisitsModalOpen} onOpenChange={setLastVisitsModalOpen}>
                <DialogContent className="glass-modal sm:max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">آخر الزيارات - {selectedMember?.full_name}</DialogTitle>
                    </DialogHeader>

                    {selectedMember && (
                        <div className="py-4">
                            {getMemberVisits(selectedMember.id).length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">لا توجد زيارات سابقة</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/10">
                                            <TableHead className="text-right">التاريخ</TableHead>
                                            <TableHead className="text-right">الوقت</TableHead>
                                            <TableHead className="text-right">الطاولة</TableHead>
                                            <TableHead className="text-right">الإجمالي</TableHead>
                                            <TableHead className="text-right w-[80px]">عرض</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {getMemberVisits(selectedMember.id).map((visit) => (
                                            <TableRow key={visit.id} className="border-white/5">
                                                <TableCell>{visit.date}</TableCell>
                                                <TableCell>{visit.startTime} - {visit.endTime}</TableCell>
                                                <TableCell>{visit.tableName}</TableCell>
                                                <TableCell className="font-bold">{formatCurrency(visit.totalCost)}</TableCell>
                                                <TableCell>
                                                    <Button size="sm" variant="ghost" className="glass-button h-7 px-2"
                                                        onClick={() => setVisitInvoiceModal(visit)}>
                                                        <Eye className="h-3 w-3" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="ghost" className="glass-button" onClick={() => setLastVisitsModalOpen(false)}>
                            إغلاق
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة فاتورة الزيارة */}
            <Dialog open={!!visitInvoiceModal} onOpenChange={() => setVisitInvoiceModal(null)}>
                <DialogContent className="glass-modal sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">فاتورة الجلسة</DialogTitle>
                    </DialogHeader>
                    {visitInvoiceModal && selectedMember && (
                        <div className="space-y-4 py-4">
                            {/* معلومات الجلسة */}
                            <div className="glass-card p-4 space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">رقم الجلسة</span><span className="font-mono">{visitInvoiceModal.id}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">التاريخ</span><span>{visitInvoiceModal.date}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">الوقت</span><span>{visitInvoiceModal.startTime} - {visitInvoiceModal.endTime}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">الطاولة</span><Badge variant="outline" className="text-xs">{visitInvoiceModal.tableName}</Badge></div>
                            </div>

                            {/* معلومات العضو */}
                            <div className="glass-card p-4">
                                <Label className="text-sm mb-2 block">العضو</Label>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-gradient-to-br from-[#E63E32] to-[#F8C033] text-white">{selectedMember.full_name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-sm">{selectedMember.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{formatPhoneNumber(selectedMember.phone)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* الإجمالي */}
                            <div className="glass-card p-4">
                                <div className="flex justify-between font-bold">
                                    <span>الإجمالي الكلي</span>
                                    <span className="gradient-text text-lg">{formatCurrency(visitInvoiceModal.totalCost)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setVisitInvoiceModal(null)}>إغلاق</Button>
                        <Button className="gradient-button" onClick={() => {
                            if (!visitInvoiceModal || !selectedMember) return;
                            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                            doc.setFontSize(18);
                            doc.text('Session Invoice', 105, 20, { align: 'center' });
                            doc.setFontSize(12);
                            doc.text(`Session ID: ${visitInvoiceModal.id}`, 20, 40);
                            doc.text(`Date: ${visitInvoiceModal.date}`, 20, 50);
                            doc.text(`Time: ${visitInvoiceModal.startTime} - ${visitInvoiceModal.endTime}`, 20, 60);
                            doc.text(`Table: ${visitInvoiceModal.tableName}`, 20, 70);
                            doc.text(`Member: ${selectedMember.full_name}`, 20, 85);
                            doc.text(`Phone: ${selectedMember.phone}`, 20, 95);
                            doc.setFontSize(14);
                            doc.text(`Total: ${visitInvoiceModal.totalCost} EGP`, 20, 115);
                            doc.save(`invoice_${visitInvoiceModal.id}.pdf`);
                            toast.success('تم تحميل الفاتورة بنجاح');
                        }}>تحميل الفاتورة</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
