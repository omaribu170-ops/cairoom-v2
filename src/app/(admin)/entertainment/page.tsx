/* =================================================================
   CAIROOM - Entertainment Hub Page
   صفحة مركز الترفيه - نظام ليالي الألعاب
   ================================================================= */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatCurrency, formatArabicDate, cn } from '@/lib/utils';
import { Gamepad2, Trophy, Clock, Users, Plus, Play, Award, Calendar as CalendarIcon, DollarSign, Eye, Trash2, Edit, AlertTriangle, Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

// --- Types ---

interface GameParticipant {
    memberId: string;
    name: string;
    phone: string;
}

interface Game {
    id: string;
    name: string;
    description: string;
    prizes: { first: number, second: number, third: number }; // [NEW] Granular prizes
    participants: GameParticipant[];
    winners?: { first: string | null; second: string | null; third: string | null }; // Member IDs
}

interface GameNight {
    id: string;
    name: string; // e.g., "Friday Gaming Night"
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    entryFee: number;
    games: Game[];
    status: 'upcoming' | 'active' | 'completed' | 'cancelled';
}

type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'semiannual' | 'annual';

// --- Mock Data ---

const mockMembers = [
    { id: '1', name: 'أحمد محمد', phone: '01012345678', nickname: 'الفهد' },
    { id: '2', name: 'علي حسن', phone: '01123456789', nickname: 'النمر' },
    { id: '3', name: 'سارة محمود', phone: '01234567890', nickname: 'الملكة' },
    { id: '4', name: 'كريم عادل', phone: '01555555555', nickname: 'الجوكر' },
    { id: '5', name: 'منى السيد', phone: '01099999999', nickname: 'البرنسيسة' },
];

const initialGameNights: GameNight[] = [
    {
        id: '1',
        name: 'ليلة الأبطال - فيفا',
        date: '2024-12-31',
        time: '20:00',
        entryFee: 100,
        status: 'upcoming',
        games: [
            { id: 'g1', name: 'FIFA 24', description: 'بطولة فردية خروج المغلوب', prizes: { first: 500, second: 250, third: 100 }, participants: [], winners: { first: null, second: null, third: null } },
            { id: 'g2', name: 'Mortal Kombat', description: 'قتال حتى الموت', prizes: { first: 200, second: 0, third: 0 }, participants: [], winners: { first: null, second: null, third: null } }
        ]
    },
    {
        id: '2',
        name: 'سهرة الكروت',
        date: '2024-12-25',
        time: '19:00',
        entryFee: 50,
        status: 'completed',
        games: [
            {
                id: 'g3',
                name: 'UNO',
                description: 'لعب جماعي',
                prizes: { first: 100, second: 0, third: 0 },
                participants: [
                    { memberId: '1', name: 'أحمد محمد', phone: '01012345678' },
                    { memberId: '2', name: 'علي حسن', phone: '01123456789' }
                ],
                winners: { first: '1', second: '2', third: null }
            }
        ]
    }
];

const statusLabels: Record<string, string> = { upcoming: 'قادمة', active: 'جارية', completed: 'انتهت', cancelled: 'ملغية' };
const statusStyles: Record<string, string> = { upcoming: 'status-pending', active: 'bg-blue-500/20 text-blue-400 border-blue-500/30', completed: 'status-available', cancelled: 'status-busy' };

export default function EntertainmentPage() {
    const [gameNights, setGameNights] = useState<GameNight[]>(initialGameNights);

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [addParticipantModalOpen, setAddParticipantModalOpen] = useState(false);
    const [endModalOpen, setEndModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Filter State
    const [statsFilter, setStatsFilter] = useState<TimeFilter>('monthly');
    const [specificDate, setSpecificDate] = useState<Date | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');

    // Selection State
    const [selectedNight, setSelectedNight] = useState<GameNight | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    // Form States
    const [newNight, setNewNight] = useState<{ name: string; date: string; time: string; entryFee: string }>({ name: '', date: '', time: '', entryFee: '' });
    const [newGames, setNewGames] = useState<{ name: string; description: string; prizes: { first: string, second: string, third: string } }[]>([{ name: '', description: '', prizes: { first: '', second: '', third: '' } }]);
    const [participantSearch, setParticipantSearch] = useState(''); // [NEW] Search state

    const [selectedMemberToAdd, setSelectedMemberToAdd] = useState<string>('');
    const [selectedGamesToJoin, setSelectedGamesToJoin] = useState<string[]>([]);

    const [winnersSelection, setWinnersSelection] = useState<Record<string, { first: string; second: string; third: string }>>({});

    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    const upcomingNight = gameNights.find(n => n.status === 'upcoming');

    // Countdown Logic
    useEffect(() => {
        if (!upcomingNight) return;
        const targetDate = new Date(`${upcomingNight.date}T${upcomingNight.time}`);
        const interval = setInterval(() => {
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();
            if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
            setCountdown({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [upcomingNight]);

    // Helpers
    const handleCreateWrapper = () => {
        const night: GameNight = {
            id: Math.random().toString(),
            name: newNight.name,
            date: newNight.date,
            time: newNight.time,
            entryFee: Number(newNight.entryFee),
            status: 'upcoming',
            id: Math.random().toString(),
            name: g.name,
            description: g.description,
            prizes: {
                first: Number(g.prizes.first) || 0,
                second: Number(g.prizes.second) || 0,
                third: Number(g.prizes.third) || 0,
            },
            participants: [],
            winners: { first: null, second: null, third: null }
        }))
    };
    setGameNights(prev => [night, ...prev]);
    setCreateModalOpen(false);
    toast.success('تم إنشاء ليلة الألعاب بنجاح');
    setNewNight({ name: '', date: '', time: '', entryFee: '' });
    setNewGames([{ name: '', description: '', prizes: { first: '', second: '', third: '' } }]);
};

const handleAddGameInput = () => setNewGames([...newGames, { name: '', description: '', prizes: { first: '', second: '', third: '' } }]);
const handleRemoveGameInput = (idx: number) => setNewGames(newGames.filter((_, i) => i !== idx));

const handleAddParticipant = () => {
    if (!selectedNight || !selectedMemberToAdd) return;
    const member = mockMembers.find(m => m.id === selectedMemberToAdd);
    if (!member) return;

    setGameNights(prev => prev.map(n => {
        if (n.id !== selectedNight.id) return n;
        return {
            ...n,
            games: n.games.map(g => {
                if (selectedGamesToJoin.includes(g.id)) {
                    // Check if already joined
                    if (g.participants.some(p => p.memberId === member.id)) return g;
                    return { ...g, participants: [...g.participants, { memberId: member.id, name: member.name, phone: member.phone }] };
                }
                return g;
            })
        };
    }));
    setAddParticipantModalOpen(false);
    toast.success('تم إضافة المشترك بنجاح');
    setSelectedMemberToAdd('');
    setSelectedGamesToJoin([]);
};

const handleEndNight = () => {
    if (!selectedNight) return;
    setGameNights(prev => prev.map(n => {
        if (n.id !== selectedNight.id) return n;
        return {
            ...n,
            status: 'completed',
            games: n.games.map(g => ({
                ...g,
                winners: {
                    first: winnersSelection[g.id]?.first || null,
                    second: winnersSelection[g.id]?.second || null,
                    third: winnersSelection[g.id]?.third || null,
                }
            }))
        };
    }));
    setEndModalOpen(false);
    toast.success('تم إنهاء الليلة وتوزيع الجوائز');
};

const handleDelete = () => {
    if (!deleteTargetId) return;
    setGameNights(prev => prev.filter(n => n.id !== deleteTargetId));
    setDeleteConfirmOpen(false);
    setDeleteTargetId(null);
    toast.success('تم حذف البطولة');
};

// Derived Stats
const filteredHistory = gameNights.filter(n => {
    const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.games.some(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        n.games.some(g => g.participants.some(p => p.name.includes(searchQuery)));

    const date = new Date(n.date);
    const now = new Date();
    let matchesDate = true;

    if (specificDate) {
        matchesDate = date.toDateString() === specificDate.toDateString();
    } else {
        // Basic time filter implementation
        if (statsFilter === 'daily') matchesDate = date.toDateString() === now.toDateString();
        // ... other filters omitted for brevity in mock, assuming 'all time' mostly
    }

    return matchesSearch && matchesDate;
});

const handleExportHistory = () => {
    const data = filteredHistory.map(n => ({
        'اسم البطولة': n.name,
        'الألعاب': n.games.map(g => g.name).join('، '),
        'التاريخ': formatArabicDate(n.date),
        'عدد المشاركين': n.games.reduce((sum, g) => sum + g.participants.length, 0),
        'رسوم الدخول': n.entryFee,
        'الحالة': statusLabels[n.status]
    }));
    import('@/lib/export-utils').then(({ exportToCSV }) => {
        exportToCSV(data, `tournaments_history_${new Date().toISOString().split('T')[0]}`);
        toast.success('تم تصدير سجل البطولات');
    });
};

const hallOfFame = {
    winners: (() => {
        const counts: Record<string, number> = {};
        gameNights.filter(n => n.status === 'completed').forEach(n => {
            n.games.forEach(g => {
                if (g.winners?.first) counts[g.winners.first] = (counts[g.winners.first] || 0) + 1;
                if (g.winners?.second) counts[g.winners.second] = (counts[g.winners.second] || 0) + 1;
                if (g.winners?.third) counts[g.winners.third] = (counts[g.winners.third] || 0) + 1;
            });
        });
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([id, wins]) => ({ name: mockMembers.find(m => m.id === id)?.name || 'Unknown', wins }));
    })(),
    participants: (() => {
        const counts: Record<string, number> = {};
        gameNights.forEach(n => {
            n.games.forEach(g => {
                g.participants.forEach(p => {
                    counts[p.memberId] = (counts[p.memberId] || 0) + 1;
                });
            });
        });
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([id, count]) => ({ name: mockMembers.find(m => m.id === id)?.name || 'Unknown', count }));
    })()
};

return (
    <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div><h1 className="text-2xl font-bold gradient-text">مركز الترفيه</h1><p className="text-muted-foreground mt-1">إدارة ليالي الألعاب والبطولات</p></div>
            <Button className="gradient-button" onClick={() => setCreateModalOpen(true)}><Plus className="h-4 w-4 ml-2" />ليلة ألعاب جديدة</Button>
        </div>

        {/* 1. Countdown & Upcoming */}
        {upcomingNight && (
            <Card className="glass-card overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-[#E63E32]/20 via-[#F18A21]/20 to-[#F8C033]/20">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <Badge className="status-pending mb-2">الحدث القادم</Badge>
                            <h2 className="text-3xl font-bold mb-1">{upcomingNight.name}</h2>
                            <p className="text-white/80 flex items-center gap-2">
                                <Clock className="h-4 w-4" /> {formatArabicDate(upcomingNight.date)} • {upcomingNight.time}
                                <span className="mx-2">|</span>
                                <DollarSign className="h-4 w-4" /> دخول {formatCurrency(upcomingNight.entryFee)}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {upcomingNight.games.map(g => (
                                    <Badge key={g.id} variant="secondary" className="glass-card text-white">{g.name}</Badge>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-4">
                            {[{ value: countdown.days, label: 'يوم' }, { value: countdown.hours, label: 'ساعة' }, { value: countdown.minutes, label: 'دقيقة' }, { value: countdown.seconds, label: 'ثانية' }].map((item, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-3xl font-bold font-mono gradient-text timer-pulse">{String(item.value).padStart(2, '0')}</div>
                                    <div className="text-xs text-muted-foreground">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-6 flex gap-3 justify-end">
                        <Button className="glass-button bg-white/10 hover:bg-white/20" onClick={() => { setSelectedNight(upcomingNight); setAddParticipantModalOpen(true); }}>
                            <Users className="h-4 w-4 ml-2" /> تسجيل مشاركين
                        </Button>
                        <Button className="gradient-button" onClick={() => { setSelectedNight(upcomingNight); setWinnersSelection({}); setEndModalOpen(true); }}>
                            <Trophy className="h-4 w-4 ml-2" /> إنهاء البطولة
                        </Button>
                        <Button variant="outline" className="glass-button" onClick={() => { setSelectedNight(upcomingNight); setViewModalOpen(true); }}>
                            <Eye className="h-4 w-4 ml-2" /> التفاصيل
                        </Button>
                    </div>
                </div>
            </Card>
        )}

        {/* 2. Stats & Hall of Fame */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filters Row */}
            <div className="md:col-span-2 flex items-center gap-4 bg-white/5 p-2 rounded-xl">
                <div className="relative flex-1">
                    <Input
                        placeholder="بحث عن بطولة أو لاعب..."
                        className="glass-input pr-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="glass-button h-10 gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            {specificDate ? formatArabicDate(specificDate.toISOString()) : "تاريخ محدد"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 glass-modal" align="end">
                        <Calendar mode="single" selected={specificDate} onSelect={setSpecificDate} initialFocus />
                    </PopoverContent>
                </Popover>

                <Select value={statsFilter} onValueChange={(v) => setStatsFilter(v as TimeFilter)}>
                    <SelectTrigger className="w-[140px] glass-input"><SelectValue /></SelectTrigger>
                    <SelectContent className="glass-modal">
                        <SelectItem value="daily">اليوم</SelectItem>
                        <SelectItem value="weekly">أسبوعي</SelectItem>
                        <SelectItem value="monthly">شهري</SelectItem>
                        <SelectItem value="semiannual">نصف سنوي</SelectItem>
                        <SelectItem value="annual">سنوي</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card className="glass-card">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-400" /> أكثر الفائزين</CardTitle></CardHeader>
                <CardContent>
                    {hallOfFame.winners.map((p, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-3">
                                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", i === 0 ? "bg-yellow-500 text-black" : i === 1 ? "bg-gray-400 text-black" : "bg-amber-700 text-white")}>{i + 1}</span>
                                <span>{p.name}</span>
                            </div>
                            <span className="font-bold text-primary">{p.wins} فوز</span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="glass-card">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-5 w-5 text-blue-400" /> أكثر المشاركين</CardTitle></CardHeader>
                <CardContent>
                    {hallOfFame.participants.map((p, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">{i + 1}</span>
                                <span>{p.name}</span>
                            </div>
                            <span className="font-bold text-muted-foreground">{p.count} مشاركة</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>

        {/* 3. History Table */}
        <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>سجل البطولات</CardTitle>
                <Button variant="ghost" size="sm" className="glass-button h-8" onClick={handleExportHistory}>
                    <Download className="h-4 w-4 ml-2" />
                    تصدير
                </Button>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-white/5 text-muted-foreground">
                            <tr>
                                <th className="p-3 rounded-r-lg">الحدث</th>
                                <th className="p-3">الألعاب</th>
                                <th className="p-3">التاريخ</th>
                                <th className="p-3">المشاركين</th>
                                <th className="p-3">الحالة</th>
                                <th className="p-3 rounded-l-lg text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredHistory.map(night => (
                                <tr key={night.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="p-3 font-medium">{night.name}</td>
                                    <td className="p-3 text-muted-foreground">{night.games.map(g => g.name).join('، ')}</td>
                                    <td className="p-3">{formatArabicDate(night.date)}</td>
                                    <td className="p-3">{night.games.reduce((sum, g) => sum + g.participants.length, 0)}</td>
                                    <td className="p-3"><Badge className={cn('border', statusStyles[night.status])}>{statusLabels[night.status]}</Badge></td>
                                    <td className="p-3 text-center flex items-center justify-center gap-2">
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-500/20 hover:text-blue-400" onClick={() => { setSelectedNight(night); setViewModalOpen(true); }}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400" onClick={() => { setDeleteTargetId(night.id); setDeleteConfirmOpen(true); }}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>

        {/* --- Modals --- */}

        {/* Create Night */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogContent className="glass-modal max-w-2xl">
                <DialogHeader><DialogTitle className="gradient-text">إضافة ليلة ألعاب جديدة</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>اسم الليلة</Label><Input value={newNight.name} onChange={e => setNewNight({ ...newNight, name: e.target.value })} placeholder="مثال: سهرة الخميس" className="glass-input" /></div>
                        <div className="space-y-2"><Label>رسوم الدخول</Label><Input value={newNight.entryFee} onChange={e => setNewNight({ ...newNight, entryFee: e.target.value })} type="number" className="glass-input" /></div>
                        <div className="space-y-2"><Label>التاريخ</Label><Input value={newNight.date} onChange={e => setNewNight({ ...newNight, date: e.target.value })} type="date" className="glass-input" /></div>
                        <div className="space-y-2"><Label>الوقت</Label><Input value={newNight.time} onChange={e => setNewNight({ ...newNight, time: e.target.value })} type="time" className="glass-input" /></div>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                        <Label className="mb-2 block text-primary font-bold">الألعاب والجوائز</Label>
                        {newGames.map((game, idx) => (
                            <div key={idx} className="glass-card p-4 mb-4 relative border border-white/10">
                                {newGames.length > 1 && <Button variant="ghost" size="sm" className="absolute top-2 left-2 text-red-500 hover:text-red-400 h-6 w-6 p-0" onClick={() => handleRemoveGameInput(idx)}><Trash2 className="h-3 w-3" /></Button>}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-1"><Label className="text-xs">اسم اللعبة</Label><Input value={game.name} onChange={e => { const n = [...newGames]; n[idx].name = e.target.value; setNewGames(n); }} placeholder="مثال: FIFA 24" className="glass-input h-9" /></div>
                                    <div className="space-y-1"><Label className="text-xs">الوصف (اختياري)</Label><Input value={game.description} onChange={e => { const n = [...newGames]; n[idx].description = e.target.value; setNewGames(n); }} placeholder="نظام البطولة..." className="glass-input h-9" /></div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-lg">
                                    <Label className="text-xs text-muted-foreground mb-2 block">توزيع الجوائز (جنيه مصري)</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 space-y-1 relative">
                                            <Trophy className="h-3 w-3 text-yellow-500 absolute top-2 right-2" />
                                            <Input type="number" placeholder="الأول" value={game.prizes.first} onChange={e => { const n = [...newGames]; n[idx].prizes.first = e.target.value; setNewGames(n); }} className="glass-input h-8 pr-6 text-sm" />
                                        </div>
                                        <div className="flex-1 space-y-1 relative">
                                            <Award className="h-3 w-3 text-gray-400 absolute top-2 right-2" />
                                            <Input type="number" placeholder="الثاني" value={game.prizes.second} onChange={e => { const n = [...newGames]; n[idx].prizes.second = e.target.value; setNewGames(n); }} className="glass-input h-8 pr-6 text-sm" />
                                        </div>
                                        <div className="flex-1 space-y-1 relative">
                                            <Award className="h-3 w-3 text-amber-700 absolute top-2 right-2" />
                                            <Input type="number" placeholder="الثالث" value={game.prizes.third} onChange={e => { const n = [...newGames]; n[idx].prizes.third = e.target.value; setNewGames(n); }} className="glass-input h-8 pr-6 text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">إجمالي الجوائز في الليلة: <span className="text-emerald-400 font-bold">{formatCurrency(newGames.reduce((sum, g) => sum + (Number(g.prizes.first) || 0) + (Number(g.prizes.second) || 0) + (Number(g.prizes.third) || 0), 0))}</span></span>
                            <Button variant="outline" size="sm" onClick={handleAddGameInput} className="glass-button border-dashed"><Plus className="h-3 w-3 ml-2" /> إضافة لعبة أخرى</Button>
                        </div>
                    </div>
                </div>
                <DialogFooter><Button variant="ghost" onClick={() => setCreateModalOpen(false)}>إلغاء</Button><Button className="gradient-button" onClick={handleCreateWrapper}>حفظ الليلة</Button></DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Add Participant */}
        <Dialog open={addParticipantModalOpen} onOpenChange={setAddParticipantModalOpen}>
            <DialogContent className="glass-modal">
                <DialogHeader><DialogTitle>تسجيل مشارك في {selectedNight?.name}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>اختر العضو</Label>
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="ابحث بالاسم، اللقب، أو الهاتف..."
                                value={participantSearch}
                                onChange={(e) => setParticipantSearch(e.target.value)}
                                className="glass-input pr-10"
                            />
                        </div>
                        <div className="glass-card max-h-40 overflow-y-auto p-1 mt-2">
                            {mockMembers.filter(m =>
                                m.name.includes(participantSearch) ||
                                m.phone.includes(participantSearch) ||
                                (m.nickname && m.nickname.includes(participantSearch))
                            ).map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedMemberToAdd(m.id)}
                                    className={cn(
                                        "w-full text-right p-2 rounded-lg text-sm hover:bg-white/10 transition-colors flex justify-between items-center group",
                                        selectedMemberToAdd === m.id && "bg-[#F18A21]/20 border border-[#F18A21]/30"
                                    )}
                                >
                                    <div>
                                        <div className="font-bold">{m.name}</div>
                                        <div className="text-xs text-muted-foreground">{m.nickname ? `(${m.nickname}) ` : ''}{m.phone}</div>
                                    </div>
                                    {selectedMemberToAdd === m.id && <div className="h-2 w-2 rounded-full bg-[#F18A21]" />}
                                </button>
                            ))}
                            {mockMembers.filter(m => m.name.includes(participantSearch) || m.phone.includes(participantSearch)).length === 0 && (
                                <div className="text-center p-4 text-sm text-muted-foreground">لا توجد نتائج</div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>الألعاب المراد المشاركة فيها</Label>
                        <div className="flex flex-col gap-2">
                            {selectedNight?.games.map(g => (
                                <div key={g.id} className="flex items-center gap-2 p-2 rounded bg-white/5">
                                    <input
                                        type="checkbox"
                                        id={`game-${g.id}`}
                                        checked={selectedGamesToJoin.includes(g.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedGamesToJoin([...selectedGamesToJoin, g.id]);
                                            else setSelectedGamesToJoin(selectedGamesToJoin.filter(id => id !== g.id));
                                        }}
                                        className="accent-primary"
                                    />
                                    <label htmlFor={`game-${g.id}`} className="text-sm cursor-pointer select-none flex-1">{g.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter><Button variant="ghost" onClick={() => setAddParticipantModalOpen(false)}>إلغاء</Button><Button className="gradient-button" onClick={handleAddParticipant}>إضافة</Button></DialogFooter>
            </DialogContent>
        </Dialog>

        {/* End Night & Prizes */}
        <Dialog open={endModalOpen} onOpenChange={setEndModalOpen}>
            <DialogContent className="glass-modal max-w-3xl">
                <DialogHeader><DialogTitle className="gradient-text">إنهاء الليلة وتحديد الفائزين</DialogTitle></DialogHeader>
                <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
                    {selectedNight?.games.map(game => (
                        <div key={game.id} className="p-4 glass-card border border-white/10">
                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Gamepad2 className="h-5 w-5 text-purple-400" /> {game.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-yellow-500">المركز الأول</Label>
                                    <Select
                                        value={winnersSelection[game.id]?.first || ''}
                                        onValueChange={v => setWinnersSelection(prev => ({ ...prev, [game.id]: { ...prev[game.id], first: v } }))}
                                    >
                                        <SelectTrigger className="glass-input h-8 text-sm"><SelectValue placeholder="اختر الفائز" /></SelectTrigger>
                                        <SelectContent className="glass-modal">
                                            {game.participants.map(p => <SelectItem key={p.memberId} value={p.memberId}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-400">المركز الثاني</Label>
                                    <Select
                                        value={winnersSelection[game.id]?.second || ''}
                                        onValueChange={v => setWinnersSelection(prev => ({ ...prev, [game.id]: { ...prev[game.id], second: v } }))}
                                    >
                                        <SelectTrigger className="glass-input h-8 text-sm"><SelectValue placeholder="اختر الفائز" /></SelectTrigger>
                                        <SelectContent className="glass-modal">
                                            {game.participants.map(p => <SelectItem key={p.memberId} value={p.memberId}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-amber-700">المركز الثالث</Label>
                                    <Select
                                        value={winnersSelection[game.id]?.third || ''}
                                        onValueChange={v => setWinnersSelection(prev => ({ ...prev, [game.id]: { ...prev[game.id], third: v } }))}
                                    >
                                        <SelectTrigger className="glass-input h-8 text-sm"><SelectValue placeholder="اختر الفائز" /></SelectTrigger>
                                        <SelectContent className="glass-modal">
                                            {game.participants.map(p => <SelectItem key={p.memberId} value={p.memberId}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <DialogFooter><Button variant="ghost" onClick={() => setEndModalOpen(false)}>إلغاء</Button><Button className="gradient-button" onClick={handleEndNight}>حفظ النتائج وإنهاء</Button></DialogFooter>
            </DialogContent>
        </Dialog>

        {/* View Details Modal */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
            <DialogContent className="glass-modal max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span>{selectedNight?.name}</span>
                        <Badge className={cn('ml-2', statusStyles[selectedNight?.status || 'completed'])}>{statusLabels[selectedNight?.status || 'completed']}</Badge>
                    </DialogTitle>
                    <DialogDescription>{selectedNight && formatArabicDate(selectedNight.date)} | {selectedNight?.time}</DialogDescription>
                </DialogHeader>

                {selectedNight && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="glass-card bg-white/5 p-3 text-center">
                                <div className="text-sm text-muted-foreground">عدد الألعاب</div>
                                <div className="text-xl font-bold">{selectedNight.games.length}</div>
                            </Card>
                            <Card className="glass-card bg-white/5 p-3 text-center">
                                <div className="text-sm text-muted-foreground">المشاركين</div>
                                <div className="text-xl font-bold">{selectedNight.games.reduce((sum, g) => sum + g.participants.length, 0)}</div>
                            </Card>
                            <Card className="glass-card bg-white/5 p-3 text-center">
                                <div className="text-sm text-muted-foreground">رسوم الدخول</div>
                                <div className="text-xl font-bold text-emerald-400">{formatCurrency(selectedNight.entryFee)}</div>
                            </Card>
                        </div>

                        {/* Games & Winners */}
                        <div className="space-y-4">
                            <h3 className="font-bold border-b border-white/10 pb-2">تفاصيل الألعاب والنتائج</h3>
                            {selectedNight.games.map(game => (
                                <div key={game.id} className="glass-card p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-lg text-primary">{game.name}</h4>
                                            <p className="text-sm text-muted-foreground">{game.description}</p>
                                            <p className="text-xs text-yellow-500 mt-1">
                                                الجوائز: 🥇{formatCurrency(game.prizes.first)} | 🥈{formatCurrency(game.prizes.second)} | 🥉{formatCurrency(game.prizes.third)}
                                            </p>
                                        </div>
                                        <Badge variant="outline">{game.participants.length} لاعب</Badge>
                                    </div>

                                    {/* Winners Section */}
                                    <div className="grid grid-cols-3 gap-2 mb-4 bg-black/20 p-3 rounded-lg">
                                        <div className="text-center">
                                            <Trophy className="h-4 w-4 text-yellow-400 mx-auto mb-1" />
                                            <div className="text-xs text-muted-foreground">الأول</div>
                                            <div className="font-bold text-sm">{mockMembers.find(m => m.id === game.winners?.first)?.name || '-'}</div>
                                            {game.winners?.first && <div className="text-[10px] text-emerald-400">{formatCurrency(game.prizes.first)}</div>}
                                        </div>
                                        <div className="text-center">
                                            <Award className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                                            <div className="text-xs text-muted-foreground">الثاني</div>
                                            <div className="font-bold text-sm">{mockMembers.find(m => m.id === game.winners?.second)?.name || '-'}</div>
                                            {game.winners?.second && <div className="text-[10px] text-emerald-400">{formatCurrency(game.prizes.second)}</div>}
                                        </div>
                                        <div className="text-center">
                                            <Award className="h-4 w-4 text-amber-700 mx-auto mb-1" />
                                            <div className="text-xs text-muted-foreground">الثالث</div>
                                            <div className="font-bold text-sm">{mockMembers.find(m => m.id === game.winners?.third)?.name || '-'}</div>
                                            {game.winners?.third && <div className="text-[10px] text-emerald-400">{formatCurrency(game.prizes.third)}</div>}
                                        </div>
                                    </div>

                                    {/* Participants List */}
                                    <div className="mt-2">
                                        <div className="text-xs font-semibold mb-2">قائمة المشاركين:</div>
                                        <div className="flex flex-wrap gap-2">
                                            {game.participants.map(p => (
                                                <Badge key={p.memberId} variant="secondary" className="bg-white/10 hover:bg-white/20 block py-1 px-2 h-auto text-right">
                                                    <div className="font-bold">{p.name}</div>
                                                    <div className="text-[10px] text-muted-foreground">{maskPhone(p.phone)}</div>
                                                </Badge>
                                            ))}
                                            {game.participants.length === 0 && <span className="text-xs text-muted-foreground">لا يوجد مشاركين</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent className="glass-modal sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-red-500 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> تأكيد الحذف</DialogTitle>
                    <DialogDescription>هل أنت متأكد من حذف هذه البطولة؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>إلغاء</Button>
                    <Button variant="destructive" onClick={handleDelete}>حذف نهائي</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
);
}

const maskPhone = (phone: string) => {
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};
