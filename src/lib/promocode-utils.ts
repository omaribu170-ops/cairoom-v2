import { Promocode } from "@/contexts/PromocodeContext";

/**
 * Calculates the discounted total for a session based on the applied promocode.
 */
export function calculateSessionTotal(
    timeCost: number,
    ordersCost: number,
    durationHours: number,
    promocode?: Promocode
): {
    finalTotal: number;
    discountAmount: number;
    originalTotal: number;
    note?: string;
} {
    const originalTotal = timeCost + ordersCost;

    if (!promocode || promocode.status !== 'active') {
        return { finalTotal: originalTotal, discountAmount: 0, originalTotal };
    }

    let discount = 0;
    let note = '';

    // 1. Percentage Discount
    if (promocode.type === 'percentage' && promocode.percentageConfig) {
        const { value, appliesTo } = promocode.percentageConfig;

        let applicableAmount = 0;
        if (appliesTo.includes('time')) applicableAmount += timeCost;
        if (appliesTo.includes('orders')) applicableAmount += ordersCost;

        discount = (applicableAmount * value) / 100;
        note = `خصم ${value}%`;
    }

    // 2. Fixed Amount Discount
    else if (promocode.type === 'fixed' && promocode.fixedConfig) {
        const { value, appliesTo } = promocode.fixedConfig;

        // Logic: Try to deduct from applicable types. Max discount is the total of those types.
        let maxDiscountable = 0;
        if (appliesTo.includes('time')) maxDiscountable += timeCost;
        if (appliesTo.includes('orders')) maxDiscountable += ordersCost;

        discount = Math.min(value, maxDiscountable);
        note = `خصم ${value} جنيه`;
    }

    // 3. Recurring Offer (Pay X, Get Y Free)
    // Applies ONLY to Time Cost
    else if (promocode.type === 'recurring_offer' && promocode.recurringConfig) {
        const { payHours, freeHours } = promocode.recurringConfig;
        const cycleSize = payHours + freeHours;
        const hourlyRate = durationHours > 0 ? timeCost / durationHours : 0;

        if (hourlyRate > 0) {
            const cycleCount = Math.floor(durationHours / cycleSize);
            const remainder = durationHours % cycleSize;

            const paidHours = (cycleCount * payHours) + Math.min(remainder, payHours);
            const newTimeCost = paidHours * hourlyRate;

            discount = timeCost - newTimeCost;
            note = `عرض: ادفع ${payHours} واحصل على ${freeHours}`;
        }
    }

    // 4. Item Discount (Handling needs detailed order items, skipping simple total calc for now)
    // For now, if passed only totals, we can't calc item specific. 
    // This part is handled usually in the Invoice generation where items are iterated.

    return {
        finalTotal: originalTotal - discount,
        discountAmount: discount,
        originalTotal,
        note
    };
}
