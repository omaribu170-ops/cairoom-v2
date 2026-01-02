/* =================================================================
   CAIROOM - Staff & Tasks Management Page
   صفحة إدارة الموظفين والمهام
   ================================================================= */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatCurrency, formatArabicDate, formatArabicDateTime, cn } from '@/lib/utils';
import {
    Search,
    Plus,
    MoreHorizontal,
    UserCog,
    ClipboardList,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Edit,
    Trash2,
    Calendar,
    User,
} from 'lucide-react';
import { TaskStatus } from '@/types/database';

// Local types for mock data (avoiding strict database types for demo)
interface MockStaffMember {
    id: string;
    user_id: string;
    shift_start: string;
    shift_end: string;
    national_id_image: string | null;
    address: string | null;
    salary: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    user: { full_name: string; phone: string };
}

// بيانات تجريبية للموظفين
const mockStaff: MockStaffMember[] = [
    {
        id: '1',
        user_id: 'u1',
        shift_start: '09:00',
        shift_end: '17:00',
        national_id_image: null,
        address: 'القاهرة - المعادي',
        salary: 5000,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-12-28T00:00:00Z',
        user: { full_name: 'محمد أحمد', phone: '01012345678' },
    },
    {
        id: '2',
        user_id: 'u2',
        shift_start: '14:00',
        shift_end: '22:00',
        national_id_image: null,
        address: 'القاهرة - نصر سيتي',
        salary: 4500,
        is_active: true,
        created_at: '2024-03-15T00:00:00Z',
        updated_at: '2024-12-28T00:00:00Z',
        user: { full_name: 'علي حسن', phone: '01123456789' },
    },
    {
        id: '3',
        user_id: 'u3',
        shift_start: '10:00',
        shift_end: '18:00',
        national_id_image: null,
        address: 'الجيزة - الهرم',
        salary: 4000,
        is_active: false,
        created_at: '2024-06-01T00:00:00Z',
        updated_at: '2024-11-15T00:00:00Z',
        user: { full_name: 'سارة محمود', phone: '01234567890' },
    },
];

// Local type for mock tasks
interface MockTask {
    id: string;
    title: string;
    description: string | null;
    assigned_to: string;
    deadline: string;
    status: TaskStatus;
    completed_at: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    assignee: { full_name: string };
}

// بيانات تجريبية للمهام
const mockTasks: MockTask[] = [
    {
        id: '1',
        title: 'ترتيب طاولات المنطقة أ',
        description: 'ترتيب وتنظيف جميع الطاولات في المنطقة أ',
        assigned_to: 'u1',
        deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // بعد ساعتين
        status: 'pending',
        completed_at: null,
        created_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignee: { full_name: 'محمد أحمد' },
    },
    {
        id: '2',
        title: 'تجهيز غرفة الاجتماعات',
        description: 'تجهيز الغرفة لاجتماع الساعة 3',
        assigned_to: 'u2',
        deadline: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // فات ساعة
        status: 'overdue',
        completed_at: null,
        created_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignee: { full_name: 'علي حسن' },
    },
    {
        id: '3',
        title: 'إعادة تخزين المشروبات',
        description: 'إعادة تعبئة الثلاجة بالمشروبات من المخزن',
        assigned_to: 'u1',
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // أمبارح
        status: 'done',
        completed_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        created_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignee: { full_name: 'محمد أحمد' },
    },
];

const taskStatusLabels: Record<TaskStatus, string> = {
    pending: 'قيد الانتظار',
    done: 'مكتملة',
    overdue: 'متأخرة',
};

const taskStatusStyles: Record<TaskStatus, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    done: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function StaffPage() {
    const [activeTab, setActiveTab] = useState('staff');
    const [staff, setStaff] = useState(mockStaff);
    const [tasks, setTasks] = useState(mockTasks);
    const [searchQuery, setSearchQuery] = useState('');
    const [taskModalOpen, setTaskModalOpen] = useState(false);

    // حالة نموذج الموظف
    const [staffModalOpen, setStaffModalOpen] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
    const [staffFormData, setStaffFormData] = useState({
        full_name: '',
        phone: '',
        address: '',
        shift_start: '',
        shift_end: '',
        salary: '',
        is_active: true
    });

    // حالة فلاتر المهام
    const [taskFilterStatus, setTaskFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'done'>('all');
    const [taskFilterEmployee, setTaskFilterEmployee] = useState<string>('all');

    // حالة المهمة الجديدة
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assigned_to: '',
        deadline: '',
    });

    // تصفية الموظفين
    const filteredStaff = staff.filter((s) =>
        s.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.user.phone.includes(searchQuery)
    );

    // تصفية المهام
    const filteredTasks = tasks.filter((t) => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.assignee.full_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = taskFilterStatus === 'all' || t.status === taskFilterStatus;
        const matchesEmployee = taskFilterEmployee === 'all' || t.assigned_to === taskFilterEmployee;
        return matchesSearch && matchesStatus && matchesEmployee;
    });

    // إحصائيات
    const staffStats = {
        total: staff.length,
        active: staff.filter((s) => s.is_active).length,
    };

    const taskStats = {
        total: tasks.length,
        pending: tasks.filter((t) => t.status === 'pending').length,
        overdue: tasks.filter((t) => t.status === 'overdue').length,
        done: tasks.filter((t) => t.status === 'done').length,
    };

    const handleMarkTaskDone = (taskId: string) => {
        setTasks((prev) =>
            prev.map((t) =>
                t.id === taskId
                    ? { ...t, status: 'done' as TaskStatus, completed_at: new Date().toISOString() }
                    : t
            )
        );
        toast.success('تم إكمال المهمة');
    };

    const handleAddTask = () => {
        if (!newTask.title.trim() || !newTask.assigned_to || !newTask.deadline) return;

        const assignee = staff.find((s) => s.user_id === newTask.assigned_to);
        const task: (typeof mockTasks)[0] = {
            id: `task-${Date.now()}`,
            ...newTask,
            description: newTask.description || null,
            status: 'pending',
            completed_at: null,
            created_by: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            assignee: { full_name: assignee?.user.full_name || 'غير معروف' },
        };

        setTasks((prev) => [task, ...prev]);
        toast.success('تم إضافة المهمة');
        setTaskModalOpen(false);
        setNewTask({ title: '', description: '', assigned_to: '', deadline: '' });
    };

    const handleSaveStaff = () => {
        if (!staffFormData.full_name || !staffFormData.phone) {
            toast.error('يرجى إدخال البيانات الأساسية');
            return;
        }

        if (editingStaffId) {
            // تحديث موظف حالي
            setStaff(prev => prev.map(s => {
                if (s.id === editingStaffId) {
                    return {
                        ...s,
                        shift_start: staffFormData.shift_start,
                        shift_end: staffFormData.shift_end,
                        address: staffFormData.address,
                        salary: Number(staffFormData.salary) || 0,
                        is_active: staffFormData.is_active,
                        user: {
                            ...s.user,
                            full_name: staffFormData.full_name,
                            phone: staffFormData.phone
                        }
                    };
                }
                return s;
            }));
            toast.success('تم تحديث بيانات الموظف');
        } else {
            // إضافة موظف جديد
            const newStaffMember: MockStaffMember = {
                id: `staff-${Date.now()}`,
                user_id: `u-${Date.now()}`,
                shift_start: staffFormData.shift_start || '09:00',
                shift_end: staffFormData.shift_end || '17:00',
                address: staffFormData.address,
                salary: Number(staffFormData.salary) || 0,
                is_active: staffFormData.is_active,
                national_id_image: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                user: {
                    full_name: staffFormData.full_name,
                    phone: staffFormData.phone
                }
            };
            setStaff(prev => [newStaffMember, ...prev]);
            toast.success('تم إضافة الموظف بنجاح');
        }
        setStaffModalOpen(false);
        resetStaffForm();
    };

    const handleEditStaff = (member: MockStaffMember) => {
        setEditingStaffId(member.id);
        setStaffFormData({
            full_name: member.user.full_name,
            phone: member.user.phone,
            address: member.address || '',
            shift_start: member.shift_start,
            shift_end: member.shift_end,
            salary: member.salary.toString(),
            is_active: member.is_active
        });
        setStaffModalOpen(true);
    };

    const resetStaffForm = () => {
        setEditingStaffId(null);
        setStaffFormData({
            full_name: '',
            phone: '',
            address: '',
            shift_start: '',
            shift_end: '',
            salary: '',
            is_active: true
        });
    };

    return (
        <div className="space-y-6">
            {/* العنوان */}
            <div>
                <h1 className="text-2xl font-bold gradient-text">الموظفين والمهام</h1>
                <p className="text-muted-foreground mt-1">إدارة فريق العمل والمهام اليومية</p>
            </div>

            {/* التبويبات */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                    <TabsList className="glass-card">
                        <TabsTrigger value="staff" className="gap-2">
                            <UserCog className="h-4 w-4" />
                            الموظفين ({staffStats.total})
                        </TabsTrigger>
                        <TabsTrigger value="tasks" className="gap-2">
                            <ClipboardList className="h-4 w-4" />
                            المهام ({taskStats.total})
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1" />

                    {/* البحث */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="glass-input pr-10"
                        />
                    </div>

                    {/* زر الإضافة */}
                    {activeTab === 'staff' ? (
                        <Button className="gradient-button" onClick={() => setStaffModalOpen(true)}>
                            <Plus className="h-4 w-4 ml-2" />
                            إضافة موظف
                        </Button>
                    ) : (
                        <Button className="gradient-button" onClick={() => setTaskModalOpen(true)}>
                            <Plus className="h-4 w-4 ml-2" />
                            إضافة مهمة
                        </Button>
                    )}
                </div>

                {/* تبويب الموظفين */}
                <TabsContent value="staff" className="space-y-4">
                    <Card className="glass-card overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-white/5">
                                    <TableHead className="text-right">الموظف</TableHead>
                                    <TableHead className="text-right">الهاتف</TableHead>
                                    <TableHead className="text-right">الشيفت</TableHead>
                                    <TableHead className="text-right">الراتب</TableHead>
                                    <TableHead className="text-right">العنوان</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="text-right w-[80px]">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStaff.map((member) => (
                                    <TableRow key={member.id} className="border-white/5 hover:bg-white/5">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-gradient-to-br from-[#E63E32] to-[#F8C033] text-white">
                                                        {member.user.full_name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{member.user.full_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell dir="ltr" className="text-right font-mono">
                                            {member.user.phone}
                                        </TableCell>
                                        <TableCell>
                                            {member.shift_start} - {member.shift_end}
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrency(member.salary)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {member.address || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                'border',
                                                member.is_active
                                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                            )}>
                                                {member.is_active ? 'نشط' : 'متوقف'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="glass-button">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="glass-modal">
                                                    <DropdownMenuItem onClick={() => handleEditStaff(member)}>
                                                        <Edit className="ml-2 h-4 w-4" />
                                                        تعديل
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-400">
                                                        <Trash2 className="ml-2 h-4 w-4" />
                                                        حذف
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* تبويب المهام */}
                <TabsContent value="tasks" className="space-y-4">
                    {/* إحصائيات المهام */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="glass-card p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-yellow-500/20">
                                    <Clock className="h-5 w-5 text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">قيد الانتظار</p>
                                    <p className="text-xl font-bold">{taskStats.pending}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="glass-card p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-500/20">
                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">متأخرة</p>
                                    <p className="text-xl font-bold">{taskStats.overdue}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="glass-card p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/20">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">مكتملة</p>
                                    <p className="text-xl font-bold">{taskStats.done}</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* فلاتر المهام */}
                    <div className="flex flex-col md:flex-row gap-4 glass-card p-4">
                        <div className="flex-1">
                            <Label className="text-xs mb-1.5 block">بحث</Label>
                            <Input
                                placeholder="بحث في المهام..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="glass-input h-9"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <Label className="text-xs mb-1.5 block">الحالة</Label>
                            <select
                                value={taskFilterStatus}
                                onChange={(e) => setTaskFilterStatus(e.target.value as any)}
                                className="w-full h-9 glass-input rounded-md px-3 text-sm"
                            >
                                <option value="all">الكل</option>
                                <option value="pending">قيد الانتظار</option>
                                <option value="overdue">متأخرة</option>
                                <option value="done">مكتملة</option>
                            </select>
                        </div>
                        <div className="w-full md:w-48">
                            <Label className="text-xs mb-1.5 block">الموظف</Label>
                            <select
                                value={taskFilterEmployee}
                                onChange={(e) => setTaskFilterEmployee(e.target.value)}
                                className="w-full h-9 glass-input rounded-md px-3 text-sm"
                            >
                                <option value="all">كل الموظفين</option>
                                {staff.map(s => (
                                    <option key={s.user_id} value={s.user_id}>{s.user.full_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* قائمة المهام */}
                    <div className="space-y-3">
                        {filteredTasks.map((task) => (
                            <Card key={task.id} className={cn(
                                'glass-card p-4',
                                task.status === 'overdue' && 'border-red-500/30'
                            )}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium">{task.title}</h3>
                                            <Badge className={cn('border', taskStatusStyles[task.status])}>
                                                {taskStatusLabels[task.status]}
                                            </Badge>
                                        </div>
                                        {task.description && (
                                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {task.assignee.full_name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatArabicDateTime(task.deadline)}
                                            </span>
                                        </div>
                                    </div>
                                    {task.status !== 'done' && (
                                        <Button
                                            size="sm"
                                            className="gradient-button"
                                            onClick={() => handleMarkTaskDone(task.id)}
                                        >
                                            <CheckCircle2 className="h-4 w-4 ml-1" />
                                            تم
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs >

            {/* نافذة إضافة مهمة */}
            < Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen} >
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">إضافة مهمة جديدة</DialogTitle>
                        <DialogDescription>أدخل تفاصيل المهمة</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>عنوان المهمة *</Label>
                            <Input
                                placeholder="ترتيب الطاولات"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                className="glass-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>الوصف (اختياري)</Label>
                            <Textarea
                                placeholder="تفاصيل إضافية..."
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                className="glass-input resize-none"
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>تعيين لـ *</Label>
                            <select
                                value={newTask.assigned_to}
                                onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                                className="w-full glass-input p-2 rounded-lg"
                            >
                                <option value="">اختر موظف</option>
                                {staff.filter((s) => s.is_active).map((s) => (
                                    <option key={s.user_id} value={s.user_id}>
                                        {s.user.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>الموعد النهائي *</Label>
                            <Input
                                type="datetime-local"
                                value={newTask.deadline}
                                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                                className="glass-input"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setTaskModalOpen(false)}>
                            إلغاء
                        </Button>
                        <Button
                            className="gradient-button"
                            onClick={handleAddTask}
                            disabled={!newTask.title.trim() || !newTask.assigned_to || !newTask.deadline}
                        >
                            إضافة المهمة
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* نافذة الموظف (إضافة/تعديل) */}
            < Dialog open={staffModalOpen} onOpenChange={(open) => {
                setStaffModalOpen(open);
                if (!open) resetStaffForm();
            }
            }>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="gradient-text">
                            {editingStaffId ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                        <div className="space-y-2">
                            <Label>الاسم بالكامل *</Label>
                            <Input
                                value={staffFormData.full_name}
                                onChange={(e) => setStaffFormData({ ...staffFormData, full_name: e.target.value })}
                                className="glass-input"
                                placeholder="مثال: أحمد محمد"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>رقم الهاتف *</Label>
                                <Input
                                    value={staffFormData.phone}
                                    onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                                    className="glass-input"
                                    placeholder="01xxxxxxxxx"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>الراتب الشهري</Label>
                                <Input
                                    type="number"
                                    value={staffFormData.salary}
                                    onChange={(e) => setStaffFormData({ ...staffFormData, salary: e.target.value })}
                                    className="glass-input"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>بداية الشيفت</Label>
                                <Input
                                    type="time"
                                    value={staffFormData.shift_start}
                                    onChange={(e) => setStaffFormData({ ...staffFormData, shift_start: e.target.value })}
                                    className="glass-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>نهاية الشيفت</Label>
                                <Input
                                    type="time"
                                    value={staffFormData.shift_end}
                                    onChange={(e) => setStaffFormData({ ...staffFormData, shift_end: e.target.value })}
                                    className="glass-input"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>العنوان</Label>
                            <Input
                                value={staffFormData.address}
                                onChange={(e) => setStaffFormData({ ...staffFormData, address: e.target.value })}
                                className="glass-input"
                                placeholder="العنوان بالتفصيل"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={staffFormData.is_active}
                                onChange={(e) => setStaffFormData({ ...staffFormData, is_active: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300"
                            />
                            <Label htmlFor="is_active">موظف نشط</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" className="glass-button" onClick={() => setStaffModalOpen(false)}>
                            إلغاء
                        </Button>
                        <Button className="gradient-button" onClick={handleSaveStaff}>
                            {editingStaffId ? 'حفظ التغييرات' : 'إضافة الموظف'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </div >
    );
}
