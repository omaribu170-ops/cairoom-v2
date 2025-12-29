/* =================================================================
   CAIROOM - Settings Page
   صفحة الإعدادات
   ================================================================= */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Settings, Upload, Palette, Image, Bell, Link } from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        logo: '', pwaLogo: '', favicon: '',
        primaryColor: '#E63E32', secondaryColor: '#F18A21', accentColor: '#F8C033',
        popupEnabled: false, popupImage: '', popupText: '', popupLink: '',
        referralBonus: 10,
    });

    const handleSave = () => {
        toast.success('تم حفظ الإعدادات بنجاح');
    };

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold gradient-text">الإعدادات</h1><p className="text-muted-foreground mt-1">تخصيص المظهر والإعدادات العامة</p></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Logos */}
                <Card className="glass-card">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-[#F18A21]" />الشعارات</CardTitle><CardDescription>شعار لوحة التحكم والتطبيق</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label>شعار لوحة التحكم</Label><div className="flex gap-2"><Input placeholder="رابط الصورة" value={settings.logo} onChange={(e) => setSettings({ ...settings, logo: e.target.value })} className="glass-input flex-1" /><Button variant="ghost" className="glass-button"><Upload className="h-4 w-4" /></Button></div></div>
                        <div className="space-y-2"><Label>شعار PWA</Label><div className="flex gap-2"><Input placeholder="رابط الصورة" value={settings.pwaLogo} onChange={(e) => setSettings({ ...settings, pwaLogo: e.target.value })} className="glass-input flex-1" /><Button variant="ghost" className="glass-button"><Upload className="h-4 w-4" /></Button></div></div>
                        <div className="space-y-2"><Label>Favicon</Label><div className="flex gap-2"><Input placeholder="رابط الصورة" value={settings.favicon} onChange={(e) => setSettings({ ...settings, favicon: e.target.value })} className="glass-input flex-1" /><Button variant="ghost" className="glass-button"><Upload className="h-4 w-4" /></Button></div></div>
                    </CardContent>
                </Card>

                {/* Colors */}
                <Card className="glass-card">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-[#F18A21]" />الألوان</CardTitle><CardDescription>تخصيص ألوان الواجهة</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label>اللون الأساسي</Label><div className="flex gap-2"><Input type="color" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className="w-12 h-10 p-1 glass-input" /><Input value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className="glass-input flex-1" /></div></div>
                        <div className="space-y-2"><Label>اللون الثانوي</Label><div className="flex gap-2"><Input type="color" value={settings.secondaryColor} onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })} className="w-12 h-10 p-1 glass-input" /><Input value={settings.secondaryColor} onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })} className="glass-input flex-1" /></div></div>
                        <div className="space-y-2"><Label>لون التمييز</Label><div className="flex gap-2"><Input type="color" value={settings.accentColor} onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })} className="w-12 h-10 p-1 glass-input" /><Input value={settings.accentColor} onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })} className="glass-input flex-1" /></div></div>
                        <div className="h-4 rounded-lg" style={{ background: `linear-gradient(90deg, ${settings.primaryColor} 0%, ${settings.secondaryColor} 50%, ${settings.accentColor} 100%)` }} />
                    </CardContent>
                </Card>

                {/* Popup */}
                <Card className="glass-card">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-[#F18A21]" />النافذة المنبثقة</CardTitle>
                            <Switch checked={settings.popupEnabled} onCheckedChange={(checked) => setSettings({ ...settings, popupEnabled: checked })} />
                        </div>
                        <CardDescription>إعلان يظهر للمستخدمين عند فتح التطبيق</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label>صورة الإعلان</Label><div className="flex gap-2"><Input placeholder="رابط الصورة" value={settings.popupImage} onChange={(e) => setSettings({ ...settings, popupImage: e.target.value })} className="glass-input flex-1" /><Button variant="ghost" className="glass-button"><Upload className="h-4 w-4" /></Button></div></div>
                        <div className="space-y-2"><Label>نص الإعلان</Label><Textarea placeholder="عرض خاص..." value={settings.popupText} onChange={(e) => setSettings({ ...settings, popupText: e.target.value })} className="glass-input" rows={2} /></div>
                        <div className="space-y-2"><Label>رابط الإعلان</Label><Input placeholder="https://..." value={settings.popupLink} onChange={(e) => setSettings({ ...settings, popupLink: e.target.value })} className="glass-input" /></div>
                    </CardContent>
                </Card>

                {/* Other Settings */}
                <Card className="glass-card">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-[#F18A21]" />إعدادات أخرى</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label>مكافأة الإحالة (ج.م)</Label><Input type="number" value={settings.referralBonus} onChange={(e) => setSettings({ ...settings, referralBonus: parseInt(e.target.value) || 0 })} className="glass-input" /></div>
                        <p className="text-sm text-muted-foreground">المبلغ الذي يحصل عليه العضو عند إحالة عضو جديد</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end"><Button className="gradient-button" onClick={handleSave}>حفظ الإعدادات</Button></div>
        </div>
    );
}
