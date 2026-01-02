/* =================================================================
   CAIROOM - Invoice Template Component
   قالب الفاتورة للطباعة وتحميل PDF
   ================================================================= */

'use client';

import { forwardRef } from 'react';
import { formatCurrency } from '@/lib/utils';

interface InvoiceMember {
    name: string;
    phone: string;
    joinedAt: string;
    leftAt: string | null;
    orders: { name: string; quantity: number; price: number }[];
}

interface InvoiceData {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    tablesUsed: string[];
    members: InvoiceMember[];
    totalOrdersCost: number;
    totalTimeCost: number;
    grandTotal: number;
}

interface InvoiceTemplateProps {
    data: InvoiceData;
}

// تحويل الوقت لصيغة عربية
const formatArabicTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'م' : 'ص';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
};

// تحويل التاريخ لصيغة عربية
const formatArabicDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
    ({ data }, ref) => {
        return (
            <div
                ref={ref}
                dir="rtl"
                style={{
                    fontFamily: '"Cairo", sans-serif',
                    background: '#ffffff',
                    color: '#1e293b',
                    width: '800px',
                    padding: '0',
                    margin: '0 auto',
                }}
            >
                {/* الهيدر مع الشعار */}
                <div style={{ padding: '48px', borderBottom: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
                    {/* خلفية تزيينية */}
                    <div style={{
                        position: 'absolute',
                        top: '-64px',
                        left: '-64px',
                        width: '256px',
                        height: '256px',
                        background: 'linear-gradient(135deg, rgba(230, 62, 50, 0.1), rgba(248, 192, 51, 0.2))',
                        borderRadius: '50%',
                        filter: 'blur(48px)',
                        opacity: 0.5,
                    }} />

                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                            {/* الشعار */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #E63E32, #F8C033)',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                }}>
                                    C
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>فاتورة</h2>
                                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0, fontWeight: 500 }}>#{data.id}</p>
                                </div>
                            </div>

                            {/* الحالة */}
                            <div style={{ textAlign: 'left' }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '4px 12px',
                                    borderRadius: '9999px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    color: '#15803d',
                                    border: '1px solid rgba(34, 197, 94, 0.2)',
                                }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', marginLeft: '8px' }} />
                                    مكتملة
                                </div>
                                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>تاريخ الإصدار: {formatArabicDate(data.date)}</p>
                            </div>
                        </div>

                        {/* معلومات الجلسة */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '24px',
                            padding: '24px',
                            background: '#f8fafc',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                        }}>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>رقم الجلسة</p>
                                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>{data.id}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>التاريخ</p>
                                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>{formatArabicDate(data.date)}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>الوقت</p>
                                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', margin: 0, whiteSpace: 'nowrap' }}>
                                    {formatArabicTime(data.startTime)} - {formatArabicTime(data.endTime)}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>الطاولات</p>
                                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>{data.tablesUsed.join('، ')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* تفاصيل الأعضاء */}
                <div style={{ padding: '48px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                        <span style={{ width: '4px', height: '24px', background: 'linear-gradient(180deg, #E63E32, #F8C033)', borderRadius: '9999px' }} />
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>تفاصيل الأعضاء</h3>
                    </div>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                    <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>اسم العضو</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>الهاتف</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>الوقت</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>الطلبات</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>المجموع</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.members.map((member, index) => {
                                    const memberOrdersTotal = member.orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
                                    return (
                                        <tr key={index} style={{ borderTop: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontWeight: 600, color: '#0f172a' }}>{member.name}</div>
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: '14px', color: '#64748b' }}>{member.phone || 'غير متوفر'}</td>
                                            <td style={{ padding: '16px 24px', fontSize: '14px', color: '#64748b' }}>
                                                {formatArabicTime(member.joinedAt)} - {member.leftAt ? formatArabicTime(member.leftAt) : formatArabicTime(data.endTime)}
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                                                {member.orders.length === 0 ? (
                                                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>لا توجد طلبات</span>
                                                ) : (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                        {member.orders.map((order, oIndex) => (
                                                            <span key={oIndex} style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                padding: '4px 10px',
                                                                borderRadius: '4px',
                                                                border: '1px solid rgba(230, 62, 50, 0.2)',
                                                                background: 'rgba(230, 62, 50, 0.05)',
                                                                color: '#E63E32',
                                                                fontSize: '12px',
                                                                fontWeight: 500,
                                                            }}>
                                                                {order.name} × {order.quantity}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 'bold', color: '#0f172a', textAlign: 'left' }}>
                                                {formatCurrency(memberOrdersTotal)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* الملخص */}
                <div style={{ padding: '48px', background: 'rgba(248, 250, 252, 0.5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '320px' }}>
                            <div style={{
                                background: 'white',
                                padding: '24px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                            }}>
                                <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px', textTransform: 'uppercase' }}>ملخص الفاتورة</h4>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginBottom: '12px' }}>
                                        <span style={{ color: '#64748b' }}>إجمالي الطلبات</span>
                                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatCurrency(data.totalOrdersCost)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>إجمالي الوقت</span>
                                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatCurrency(data.totalTimeCost)}</span>
                                    </div>
                                </div>
                                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '16px', marginTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>الإجمالي الكلي</span>
                                        <div style={{ textAlign: 'left' }}>
                                            <span style={{ display: 'block', fontSize: '24px', fontWeight: 'bold', background: 'linear-gradient(135deg, #E63E32, #F8C033)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                                {formatCurrency(data.grandTotal)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* الفوتر */}
                <div style={{ height: '6px', width: '100%', background: 'linear-gradient(90deg, rgba(230, 62, 50, 0.8), rgba(248, 192, 51, 1), rgba(230, 62, 50, 0.8))' }} />
            </div>
        );
    }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';
