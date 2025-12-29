/* =================================================================
   CAIROOM - Utility Functions
   دوال مساعدة
   ================================================================= */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// دمج الكلاسات
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// تنسيق الأرقام بالعربية
export function formatArabicNumber(num: number): string {
  return new Intl.NumberFormat('ar-EG').format(num);
}

// تنسيق المال
export function formatCurrency(amount: number): string {
  return `${formatArabicNumber(amount)} ج.م`;
}

// تنسيق التاريخ بالعربية
export function formatArabicDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

// تنسيق الوقت بالعربية
export function formatArabicTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// تنسيق التاريخ والوقت معاً
export function formatArabicDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// حساب مدة الجلسة
export function calculateSessionDuration(startTime: string, endTime?: string | null): {
  hours: number;
  minutes: number;
  formatted: string;
} {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;

  return {
    hours,
    minutes,
    formatted: `${hours} ساعة ${minutes > 0 ? `و ${minutes} دقيقة` : ''}`.trim(),
  };
}

// حساب تكلفة الجلسة
export function calculateSessionCost(
  startTime: string,
  endTime: string | null,
  pricePerHour: number,
  guestCount: number
): number {
  const { hours, minutes } = calculateSessionDuration(startTime, endTime);
  const totalHours = hours + (minutes / 60);
  return Math.ceil(totalHours * pricePerHour * guestCount);
}

// توليد كود إحالة فريد
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CR-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// التحقق من صحة رقم الهاتف المصري
export function isValidEgyptianPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  // أرقام مصرية: 01XXXXXXXXX أو 201XXXXXXXXX أو +201XXXXXXXXX
  return /^(0?1[0125][0-9]{8}|201[0125][0-9]{8})$/.test(cleanPhone);
}

// تنسيق رقم الهاتف
export function formatPhoneNumber(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('201')) {
    return `+${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
  }
  if (clean.startsWith('01')) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
  }
  return phone;
}

// نصوص الحالات بالسعيدية
export const statusTexts = {
  available: 'فاضية يا معلم',
  busy: 'مشغولة دلوقتي',
  pending: 'مستنية',
  confirmed: 'اتأكدت',
  cancelled: 'اتلغت',
  active: 'شغالة',
  completed: 'خلصت',
  checked: 'اتشيكت',
  missed: 'فاتت علينا',
  approved: 'اتوافق عليها',
  rejected: 'اترفضت',
  done: 'خلصت',
  overdue: 'فات ميعادها',
  fulfilled: 'اتنفذت',
};

// رسائل النظام بالسعيدية
export const systemMessages = {
  welcome: 'يا مرحب يا معلم!',
  loading: 'استنى شوية...',
  success: 'تمام يا باشا!',
  error: 'في حاجة غلط يا بوي',
  offline: 'النت هرب يا بوي.. بس كمل عادي',
  noData: 'مفيش حاجة هنا',
  confirmDelete: 'متأكد إنك عايز تمسح؟',
  insufficientBalance: 'رصيده مايكفيش يا معلم',
  sessionEnded: 'الجلسة خلصت! الحساب جاهز',
  paymentSuccess: 'الفلوس وصلت تمام',
  orderPlaced: 'الطلب راح للمطبخ',
  taskAssigned: 'المهمة اتعينت',
  tournamentJoined: 'انت في البطولة دلوقتي!',
};

// أيقونات الحالات
export const statusIcons = {
  available: '🟢',
  busy: '🔴',
  pending: '🟡',
  confirmed: '✅',
  cancelled: '❌',
  active: '▶️',
  completed: '✔️',
};

// ألوان الحالات
export const statusColors = {
  available: 'text-emerald-400 bg-emerald-400/20',
  busy: 'text-red-400 bg-red-400/20',
  pending: 'text-yellow-400 bg-yellow-400/20',
  confirmed: 'text-blue-400 bg-blue-400/20',
  cancelled: 'text-gray-400 bg-gray-400/20',
  active: 'text-green-400 bg-green-400/20',
  completed: 'text-purple-400 bg-purple-400/20',
};

// تأخير بسيط (للتحميل)
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// توليد UUID
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
