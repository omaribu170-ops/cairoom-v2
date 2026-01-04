/* =================================================================
   CAIROOM - Bookings Page
   صفحة الحجوزات
   ================================================================= */

'use client';

import { Card } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function BookingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold gradient-text">Bookings</h1>
                <p className="text-muted-foreground mt-1">Manage table and hall reservations</p>
            </div>

            <Card className="glass-card p-12 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground">Bookings System</h3>
                <p className="text-muted-foreground mt-2">Coming Soon...</p>
            </Card>
        </div>
    );
}
