/* =================================================================
   CAIROOM - Entertainment Hub Page
   صفحة مركز الترفيه
   ================================================================= */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatCurrency, formatArabicDate, cn } from '@/lib/utils';
import { Gamepad2, Trophy, Clock, Users, Plus, Play, Award, Calendar, DollarSign } from 'lucide-react';
import { Tournament, TournamentStatus } from '@/types/database';

// Mock tournaments
const mockTournaments: (Tournament & { participants_count: number })[] = [
    { id: '1', game_name: 'FIFA 24', start_date: '2024-12-31', time: '20:00', entry_fee: 50, prizes_json: { first: 200, second: 100, third: 50 }, status: 'upcoming', participants: [], winner_first: null, winner_second: null, winner_third: null, created_at: '', updated_at: '', participants_count: 12 },
    { id: '2', game_name: 'UNO', start_date: '2024-12-28', time: '19:00', entry_fee: 25, prizes_json: { first: 100, second: 50, third: 25 }, status: 'completed', participants: [], winner_first: 'u1', winner_second: 'u2', winner_third: 'u3', created_at: '', updated_at: '', participants_count: 16 },
    { id: '3', game_name: 'Chess', start_date: '2024-12-25', time: '18:00', entry_fee: 30, prizes_json: { first: 150, second: 75, third: 30 }, status: 'completed', participants: [], winner_first: 'u4', winner_second: 'u1', winner_third: 'u5', created_at: '', updated_at: '', participants_count: 8 },
];

const statusLabels: Record<TournamentStatus, string> = { upcoming: 'قادمة', active: 'جارية', completed: 'انتهت', cancelled: 'ملغية' };
const statusStyles: Record<TournamentStatus, string> = { upcoming: 'status-pending', active: 'bg-blue-500/20 text-blue-400 border-blue-500/30', completed: 'status-available', cancelled: 'status-busy' };

export default function EntertainmentPage() {
    const [tournaments, setTournaments] = useState(mockTournaments);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [endModalOpen, setEndModalOpen] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState<typeof mockTournaments[0] | null>(null);
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    const nextTournament = tournaments.find(t => t.status === 'upcoming');

    // Countdown timer
    useEffect(() => {
        if (!nextTournament) return;
        const targetDate = new Date(`${nextTournament.start_date}T${nextTournament.time}`);
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
    }, [nextTournament]);

    const handleEndTournament = (winners: { first: string; second: string; third: string }) => {
        if (!selectedTournament) return;
        setTournaments(prev => prev.map(t => t.id === selectedTournament.id ? { ...t, status: 'completed' as const, winner_first: winners.first, winner_second: winners.second, winner_third: winners.third } : t));
        toast.success('تم إنهاء البطولة وتوزيع الجوائز');
        setEndModalOpen(false);
    };

    const stats = {
        total: tournaments.length,
        upcoming: tournaments.filter(t => t.status === 'upcoming').length,
        totalPrizes: tournaments.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.prizes_json.first + t.prizes_json.second + t.prizes_json.third, 0),
        totalRevenue: tournaments.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.entry_fee * t.participants_count), 0),
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div><h1 className="text-2xl font-bold gradient-text">مركز الترفيه</h1><p className="text-muted-foreground mt-1">إدارة ليالي الألعاب والبطولات</p></div>
                <Button className="gradient-button" onClick={() => setCreateModalOpen(true)}><Plus className="h-4 w-4 ml-2" />بطولة جديدة</Button>
            </div>

            {/* Countdown */}
            {nextTournament && (
                <Card className="glass-card overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-[#E63E32]/20 via-[#F18A21]/20 to-[#F8C033]/20">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                                <Badge className="status-pending mb-2">البطولة القادمة</Badge>
                                <h2 className="text-2xl font-bold">{nextTournament.game_name}</h2>
                                <p className="text-muted-foreground">{formatArabicDate(nextTournament.start_date)} • {nextTournament.time}</p>
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
                    </div>
                </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="glass-card p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-500/20"><Gamepad2 className="h-5 w-5 text-purple-400" /></div><div><p className="text-sm text-muted-foreground">إجمالي البطولات</p><p className="text-xl font-bold">{stats.total}</p></div></div></Card>
                <Card className="glass-card p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-yellow-500/20"><Clock className="h-5 w-5 text-yellow-400" /></div><div><p className="text-sm text-muted-foreground">قادمة</p><p className="text-xl font-bold">{stats.upcoming}</p></div></div></Card>
                <Card className="glass-card p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/20"><DollarSign className="h-5 w-5 text-emerald-400" /></div><div><p className="text-sm text-muted-foreground">إيرادات</p><p className="text-xl font-bold text-emerald-400">{formatCurrency(stats.totalRevenue)}</p></div></div></Card>
                <Card className="glass-card p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-500/20"><Trophy className="h-5 w-5 text-red-400" /></div><div><p className="text-sm text-muted-foreground">جوائز</p><p className="text-xl font-bold text-red-400">{formatCurrency(stats.totalPrizes)}</p></div></div></Card>
            </div>

            {/* Tournaments list */}
            <Card className="glass-card">
                <CardHeader><CardTitle>سجل البطولات</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {tournaments.map(tournament => (
                            <div key={tournament.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-purple-500/20"><Gamepad2 className="h-6 w-6 text-purple-400" /></div>
                                    <div>
                                        <h3 className="font-medium">{tournament.game_name}</h3>
                                        <p className="text-sm text-muted-foreground">{formatArabicDate(tournament.start_date)} • {tournament.participants_count} مشارك • دخول {formatCurrency(tournament.entry_fee)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge className={cn('border', statusStyles[tournament.status])}>{statusLabels[tournament.status]}</Badge>
                                    {tournament.status === 'upcoming' && (
                                        <Button size="sm" className="gradient-button" onClick={() => { setSelectedTournament(tournament); setEndModalOpen(true); }}><Play className="h-4 w-4 ml-1" />ابدأ</Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Create Tournament Modal */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader><DialogTitle className="gradient-text">إنشاء بطولة جديدة</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>اسم اللعبة</Label><Input placeholder="FIFA 24" className="glass-input" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>التاريخ</Label><Input type="date" className="glass-input" /></div>
                            <div className="space-y-2"><Label>الوقت</Label><Input type="time" className="glass-input" /></div>
                        </div>
                        <div className="space-y-2"><Label>رسوم الاشتراك (ج.م)</Label><Input type="number" placeholder="50" className="glass-input" /></div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2"><Label>الأول</Label><Input type="number" placeholder="200" className="glass-input" /></div>
                            <div className="space-y-2"><Label>الثاني</Label><Input type="number" placeholder="100" className="glass-input" /></div>
                            <div className="space-y-2"><Label>الثالث</Label><Input type="number" placeholder="50" className="glass-input" /></div>
                        </div>
                    </div>
                    <DialogFooter><Button variant="ghost" className="glass-button" onClick={() => setCreateModalOpen(false)}>إلغاء</Button><Button className="gradient-button">إنشاء البطولة</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* End Tournament Modal */}
            <Dialog open={endModalOpen} onOpenChange={setEndModalOpen}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader><DialogTitle className="gradient-text">إنهاء البطولة وتحديد الفائزين</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label className="flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-400" />المركز الأول</Label><Select><SelectTrigger className="glass-input"><SelectValue placeholder="اختر الفائز" /></SelectTrigger><SelectContent className="glass-modal"><SelectItem value="u1">أحمد محمد</SelectItem><SelectItem value="u2">عمر حسن</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label className="flex items-center gap-2"><Award className="h-4 w-4 text-gray-400" />المركز الثاني</Label><Select><SelectTrigger className="glass-input"><SelectValue placeholder="اختر الفائز" /></SelectTrigger><SelectContent className="glass-modal"><SelectItem value="u1">أحمد محمد</SelectItem><SelectItem value="u2">عمر حسن</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label className="flex items-center gap-2"><Award className="h-4 w-4 text-amber-700" />المركز الثالث</Label><Select><SelectTrigger className="glass-input"><SelectValue placeholder="اختر الفائز" /></SelectTrigger><SelectContent className="glass-modal"><SelectItem value="u1">أحمد محمد</SelectItem><SelectItem value="u2">عمر حسن</SelectItem></SelectContent></Select></div>
                    </div>
                    <DialogFooter><Button variant="ghost" className="glass-button" onClick={() => setEndModalOpen(false)}>إلغاء</Button><Button className="gradient-button" onClick={() => handleEndTournament({ first: 'u1', second: 'u2', third: 'u3' })}>إنهاء وتوزيع الجوائز</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
