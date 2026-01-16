import React, { useState, useEffect } from 'react';
import {
    Users, User, FileText, Settings, Shield, Bell, LogOut,
    LayoutDashboard, Menu, X, ChevronRight, Activity, Globe,
    MessageSquare, AlertTriangle, CheckCircle, Database
} from 'lucide-react';
import { useAppContext } from '../../context/SupabaseContext';
import { useLocalization } from '../../hooks/useLocalization';
import UserManagementView from './UserManagementView';
import AdminProfileView from './AdminProfileView';
import AuditLogView from './AuditLogView';
import FeedbackLogsView from './FeedbackLogsView';
import IssueLogView from './IssueLogView';
import ResolvedIssuesView from './ResolvedIssuesView';
import { TranslatedText } from '../common/TranslatedText';

type AdminView = 'dashboard' | 'users' | 'profile' | 'audit' | 'feedback' | 'issues' | 'resolved';

export default function ModernAdminDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState<AdminView>(() => {
        const saved = localStorage.getItem('admin-current-view');
        return (saved as AdminView) || 'dashboard';
    });
    const { currentUser, logout, users } = useAppContext(); // Fixed: users instead of allUsers
    const { t, setLanguage, currentLanguage } = useLocalization();

    // Dashboard Stats State
    const [stats, setStats] = useState({
        totalUsers: 0,
        msmeCount: 0,
        buyerCount: 0,
        activeUsers: 0
    });

    // Persist View
    useEffect(() => {
        localStorage.setItem('admin-current-view', currentView);
    }, [currentView]);

    // Calculate Stats
    useEffect(() => {
        if (users) {
            setStats({
                totalUsers: users.length,
                msmeCount: users.filter(u => u.role === 'msme').length,
                buyerCount: users.filter(u => u.role === 'buyer').length,
                activeUsers: users.filter(u => u.isApproved).length // Fixed: isApproved instead of isAdminVerified
            });
        }
    }, [users]);

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const dashboardStats = [
        {
            label: t('total_users'),
            value: stats.totalUsers,
            icon: Users,
            color: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-100',
            text: 'text-blue-600'
        },
        {
            label: t('msme'),
            value: stats.msmeCount,
            icon: FactoryIcon,
            color: 'from-purple-500 to-purple-600',
            bg: 'bg-purple-100',
            text: 'text-purple-600'
        },
        {
            label: t('buyers_stat'),
            value: stats.buyerCount,
            icon: ShoppingCart,
            color: 'from-green-500 to-green-600',
            bg: 'bg-green-100',
            text: 'text-green-600'
        },
        {
            label: t('verified_users'),
            value: stats.activeUsers,
            icon: CheckCircle,
            color: 'from-indigo-500 to-indigo-600',
            bg: 'bg-indigo-100',
            text: 'text-indigo-600'
        }
    ];

    const quickActions = [
        { label: t('manage_users'), icon: Users, color: 'bg-indigo-600', onClick: () => setCurrentView('users') },
        { label: t('view_issues'), icon: AlertTriangle, color: 'bg-orange-600', onClick: () => setCurrentView('issues') },
        { label: t('audit_logs'), icon: FileText, color: 'bg-slate-600', onClick: () => setCurrentView('audit') },
        { label: t('user_feedback'), icon: MessageSquare, color: 'bg-pink-600', onClick: () => setCurrentView('feedback') }
    ];

    const renderContent = () => {
        switch (currentView) {
            case 'users':
                return <UserManagementView />;
            case 'profile':
                return <AdminProfileView onBack={() => setCurrentView('dashboard')} />;
            case 'audit':
                return <AuditLogView />;
            case 'feedback':
                return <FeedbackLogsView />;
            case 'issues':
                return <IssueLogView />;
            case 'resolved':
                return <ResolvedIssuesView />;
            case 'dashboard':
            default:
                return (
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {dashboardStats.map((stat, idx) => (
                                <div key={idx} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all transform hover:-translate-y-1 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-full -mr-16 -mt-16" style={{ background: stat.color }}></div>
                                    <div className="relative">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`p-3 rounded-xl ${stat.bg} shadow-md`}>
                                                <stat.icon className={`h-6 w-6 ${stat.text}`} />
                                            </div>
                                        </div>
                                        <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.label}</h3>
                                        <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Actions */}
                        <h2 className="text-lg font-bold text-gray-800 mt-8 mb-4">{t('quick_actions')}</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {quickActions.map((action, idx) => (
                                <button key={idx} onClick={action.onClick} className={`${action.color} text-white rounded-xl p-4 flex items-center gap-3 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}>
                                    <action.icon className="h-5 w-5" />
                                    <span className="font-bold text-sm">{action.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('system_overview')}</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase">{t('system_status')}</h3>
                                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                                        <div className="flex items-center gap-3">
                                            <Database className="h-5 w-5 text-green-600" />
                                            <span className="font-medium text-green-900">{t('database_connected')}</span>
                                        </div>
                                        <span className="text-xs font-bold px-2 py-1 bg-green-200 text-green-800 rounded-lg">{t('online')}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-3">
                                            <Activity className="h-5 w-5 text-blue-600" />
                                            <span className="font-medium text-blue-900">{t('system_performance')}</span>
                                        </div>
                                        <span className="text-xs font-bold px-2 py-1 bg-blue-200 text-blue-800 rounded-lg">{t('optimal')}</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">{t('pending_tasks')}</h3>
                                    <div className="space-y-3">
                                        {stats.totalUsers - stats.activeUsers > 0 ? (
                                            <div className="flex items-center gap-3 p-3 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-100 cursor-pointer hover:bg-yellow-100 transition" onClick={() => setCurrentView('users')}>
                                                <AlertTriangle className="h-4 w-4" />
                                                <span>{stats.totalUsers - stats.activeUsers} {t('users_pending_verification')}</span>
                                            </div>
                                        ) : (
                                            <p className="text-slate-500 italic">{t('no_pending_tasks')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="h-screen bg-gray-50 overflow-hidden flex">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex items-center gap-3 bg-slate-950">
                    <Shield className="h-8 w-8 text-indigo-400" />
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{t('admin_panel')}</h1>
                        <p className="text-xs text-slate-400">TexConnect Management</p>
                    </div>
                </div>

                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-80px)]">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2 px-4 mt-4">Main</div>
                    <NavButton view="dashboard" icon={LayoutDashboard} label={t('dashboard')} current={currentView} onClick={setCurrentView} closeSidebar={() => setSidebarOpen(false)} />
                    <NavButton view="users" icon={Users} label={t('user_management')} current={currentView} onClick={setCurrentView} closeSidebar={() => setSidebarOpen(false)} />

                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2 px-4 mt-6">Monitoring</div>
                    <NavButton view="audit" icon={FileText} label={t('audit_logs')} current={currentView} onClick={setCurrentView} closeSidebar={() => setSidebarOpen(false)} />
                    <NavButton view="issues" icon={AlertTriangle} label={t('issue_logs')} current={currentView} onClick={setCurrentView} closeSidebar={() => setSidebarOpen(false)} />
                    <NavButton view="resolved" icon={CheckCircle} label={t('resolved_issues')} current={currentView} onClick={setCurrentView} closeSidebar={() => setSidebarOpen(false)} />
                    <NavButton view="feedback" icon={MessageSquare} label={t('user_feedback')} current={currentView} onClick={setCurrentView} closeSidebar={() => setSidebarOpen(false)} />

                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2 px-4 mt-6">{t('settings')}</div>
                    <NavButton view="profile" icon={User} label={t('profile')} current={currentView} onClick={setCurrentView} closeSidebar={() => setSidebarOpen(false)} />
                </nav>
            </aside>

            {/* Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-40">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="ml-auto flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                            <Globe className="h-4 w-4 text-gray-500" />
                            <select
                                value={currentLanguage}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-transparent text-sm border-none focus:ring-0 text-gray-700 cursor-pointer"
                            >
                                <option value="en">English</option>
                                <option value="ta">தமிழ்</option>
                            </select>
                        </div>

                        <div className="h-8 w-px bg-gray-200 mx-2"></div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-semibold text-gray-800"><TranslatedText text={currentUser?.firstname || 'Admin'} /></p>
                                <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold">
                                {currentUser?.firstname?.charAt(0) || 'A'}
                            </div>
                        </div>

                        <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                {/* Main Scrollable Area */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10" onClick={() => setSidebarOpen(false)}>
                    {renderContent()}
                </main>
            </div>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
            )}
        </div>
    );
}

// Nav Button Component
const NavButton = ({ view, icon: Icon, label, current, onClick, closeSidebar }: any) => {
    return (
        <button
            onClick={() => { onClick(view); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-1 ${current === view ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
            <Icon className="h-4 w-4" />
            <span className="font-medium text-sm">{label}</span>
            {current === view && <ChevronRight className="h-3 w-3 ml-auto opacity-70" />}
        </button>
    );
};

// Missing FactoryIcon Mockup
const FactoryIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M17 18h1" /><path d="M12 18h1" /><path d="M7 18h1" /></svg>
);
const ShoppingCart = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
);
