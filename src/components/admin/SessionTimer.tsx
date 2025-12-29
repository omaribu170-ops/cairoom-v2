/* =================================================================
   CAIROOM - Session Timer Component
   مؤقت الجلسة الحية
   ================================================================= */

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SessionTimerProps {
    startTime: string;
    className?: string;
    showLabels?: boolean;
}

export function SessionTimer({ startTime, className, showLabels = true }: SessionTimerProps) {
    const [duration, setDuration] = useState({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateDuration = () => {
            const start = new Date(startTime);
            const now = new Date();
            const diffMs = now.getTime() - start.getTime();

            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

            setDuration({ hours, minutes, seconds });
        };

        calculateDuration();
        const interval = setInterval(calculateDuration, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    const pad = (num: number) => num.toString().padStart(2, '0');

    return (
        <div className={cn('text-center', className)}>
            <div className="font-mono text-2xl font-bold gradient-text timer-pulse">
                {pad(duration.hours)}:{pad(duration.minutes)}:{pad(duration.seconds)}
            </div>
            {showLabels && (
                <div className="flex justify-center gap-6 text-xs text-muted-foreground mt-1">
                    <span>ساعة</span>
                    <span>دقيقة</span>
                    <span>ثانية</span>
                </div>
            )}
        </div>
    );
}
