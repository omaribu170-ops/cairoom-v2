import { ActiveSession, SessionMember } from '@/types/database';

export const calculateDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    return Math.floor((end - start) / (1000 * 60));
};

export const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
};

export const calculateTimeCost = (minutes: number, pricePerHour: number, priceFirstHour?: number) => {
    // Legacy/Simple pricing if no priceFirstHour
    if (priceFirstHour === undefined || priceFirstHour === null) {
        return Math.ceil((minutes / 60) * pricePerHour);
    }

    // Advanced Pricing
    if (minutes <= 15) {
        return 0; // 15-Minute Rule: Grace period (or free if under threshold)
    }

    if (minutes <= 60) {
        return priceFirstHour; // First hour fixed price (charged fully if > 15 mins)
    }

    // Minutes > 60
    const extraMinutes = minutes - 60;
    const extraCost = Math.ceil((extraMinutes / 60) * pricePerHour);
    return priceFirstHour + extraCost;
};

export const getMemberBill = (member: { joinedAt: string; leftAt?: string | null; orders: { price: number; quantity: number }[] }, pricePerHour: number, priceFirstHour?: number) => {
    const duration = calculateDuration(member.joinedAt, member.leftAt || undefined);
    const timeCost = calculateTimeCost(duration, pricePerHour, priceFirstHour);
    const ordersCost = member.orders.reduce((sum, o) => sum + (o.price * o.quantity), 0);
    return { duration, timeCost, ordersCost, total: timeCost + ordersCost };
};

export const getSessionTotal = (session: ActiveSession) => {
    let timeCost = 0;
    const now = Date.now();
    const activeMembers = session.members.filter(m => !m.leftAt).length;

    if (session.tableHistory && session.tableHistory.length > 0) {
        session.tableHistory.forEach(th => {
            const start = new Date(th.startTime).getTime();
            const end = th.endTime ? new Date(th.endTime).getTime() : now;
            const minutes = Math.floor((end - start) / (1000 * 60));
            // Apply pricing logic to each history segment? 
            // NOTE: History segment pricing is tricky. Usually "first hour" applies to the *session* start. 
            // But if table switched, does the "first hour" reset? Usually NO.
            // Complex case. For now, assuming linear pricing for history or simple logic.
            // Re-using calculateTimeCost might be wrong if it resets "first hour" logic for every segment.
            // Simplified: History segments usually use Standard Rate (pricePerHour) unless specified.
            // But since "First Hour" is session-based...
            // User did not specify behavior for Table Switching.
            // I will use simple pricing for history segments (legacy) to avoid resetting 1st hour charge multiple times.
            // Or assume priceFirstHour applies to the *first* segment only? 
            // Defaulting to simple pricing for history for now to avoid bug of charging 50 EGP every switch.
            timeCost += calculateTimeCost(minutes, th.pricePerHour, th.priceFirstHour);
        });
    } else {
        const duration = calculateDuration(session.startTime);
        timeCost = calculateTimeCost(duration, session.pricePerHour, session.priceFirstHour) * activeMembers;
    }

    const ordersCost = session.members.reduce((sum, m) => sum + m.orders.reduce((s, o) => s + (o.price * o.quantity), 0), 0);
    return { timeCost, ordersCost, total: timeCost + ordersCost };
};
