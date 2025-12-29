/* =================================================================
   CAIROOM - Home Page
   الصفحة الرئيسية - تحويل للداشبورد
   ================================================================= */

import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to admin dashboard
  redirect('/dashboard');
}
