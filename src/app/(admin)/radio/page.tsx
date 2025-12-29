/* =================================================================
   CAIROOM - Inner Radio Page
   صفحة الراديو الداخلي
   ================================================================= */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Radio, Volume2, Cigarette, VolumeX, Briefcase, Music } from 'lucide-react';

// Mock tables
const mockTables = [
    { id: '1', name: 'طاولة ١', status: 'busy' },
    { id: '2', name: 'طاولة ٢', status: 'available' },
    { id: '3', name: 'طاولة ٣', status: 'busy' },
    { id: '4', name: 'غرفة الاجتماعات', status: 'available' },
    { id: '5', name: 'ركن القهوة', status: 'busy' },
    { id: '6', name: 'طاولة ٤', status: 'available' },
];

const audioButtons = [
    { id: 'smoke', label: 'تدخين', icon: Cigarette, color: 'from-red-500 to-orange-500', message: 'ممنوع التدخين هنا يا معلم! 🚭' },
    { id: 'noise', label: 'ضوضاء', icon: VolumeX, color: 'from-purple-500 to-pink-500', message: 'ممكن نخفف الصوت شوية؟ 🔇' },
    { id: 'office', label: 'مكتب', icon: Briefcase, color: 'from-blue-500 to-cyan-500', message: 'هنا مكان شغل، خلينا نركز! 💼' },
    { id: 'custom', label: 'مخصص', icon: Music, color: 'from-green-500 to-emerald-500', message: 'رسالة مخصصة 🎵' },
];

export default function RadioPage() {
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [playingAudio, setPlayingAudio] = useState<string | null>(null);

    const handlePlayAudio = (tableId: string, audioType: string) => {
        const table = mockTables.find(t => t.id === tableId);
        const audio = audioButtons.find(a => a.id === audioType);
        if (!table || !audio) return;

        setPlayingAudio(`${tableId}-${audioType}`);

        // Simulate broadcast
        setTimeout(() => {
            setPlayingAudio(null);
            toast.success(`تم إرسال "${audio.label}" لـ ${table.name}`);
        }, 2000);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold gradient-text flex items-center gap-2"><Radio className="h-6 w-6" />الراديو الداخلي</h1>
                <p className="text-muted-foreground mt-1">إرسال رسائل صوتية للطاولات</p>
            </div>

            {/* Instructions */}
            <Card className="glass-card bg-gradient-to-r from-[#E63E32]/10 via-[#F18A21]/10 to-[#F8C033]/10">
                <CardContent className="p-4">
                    <p className="text-sm">١. اختر طاولة من القائمة</p>
                    <p className="text-sm">٢. اضغط على نوع الرسالة الصوتية</p>
                    <p className="text-sm">٣. سيتم إرسالها فوراً لجهاز الطاولة</p>
                </CardContent>
            </Card>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockTables.map(table => (
                    <Card key={table.id} className={cn('glass-card cursor-pointer transition-all', selectedTable === table.id && 'ring-2 ring-[#F18A21]')} onClick={() => setSelectedTable(table.id)}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">{table.name}</h3>
                                <Badge className={table.status === 'busy' ? 'status-busy' : 'status-available'}>{table.status === 'busy' ? 'مشغولة' : 'فاضية'}</Badge>
                            </div>

                            {/* Audio Buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                {audioButtons.map(audio => {
                                    const Icon = audio.icon;
                                    const isPlaying = playingAudio === `${table.id}-${audio.id}`;
                                    return (
                                        <Button key={audio.id} variant="ghost" className={cn('glass-button flex-col h-auto py-3 gap-1', isPlaying && 'animate-pulse')} onClick={(e) => { e.stopPropagation(); handlePlayAudio(table.id, audio.id); }} disabled={isPlaying}>
                                            <div className={cn('p-2 rounded-lg bg-gradient-to-r', audio.color)}><Icon className="h-4 w-4 text-white" /></div>
                                            <span className="text-xs">{audio.label}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Volume Indicator */}
            {playingAudio && (
                <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 glass-card p-4 z-50 animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-[#E63E32] to-[#F8C033]"><Volume2 className="h-5 w-5 text-white" /></div>
                        <div className="flex-1"><p className="font-medium">جاري الإرسال...</p><p className="text-sm text-muted-foreground">{mockTables.find(t => t.id === playingAudio.split('-')[0])?.name}</p></div>
                    </div>
                </div>
            )}
        </div>
    );
}
