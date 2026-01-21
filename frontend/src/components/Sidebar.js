import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Activity, Award, User, LogOut, Users, FileText } from 'lucide-react';

const Sidebar = ({ role = 'Scout', activePage = 'dashboard' }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/');
    };

    const scoutMenuItems = [
        { icon: Home, label: 'Dashboard', path: '/scout/dashboard' },
        { icon: Activity, label: 'My Activities', path: '/scout/activity-tracking' },
        { icon: Award, label: 'My Badges', path: '/scout/badge-progress' },
        { icon: FileText, label: 'Award Progress', path: '/scout/award-eligibility' },
        { icon: User, label: 'Profile', path: '/scout/profile' },
    ];

    const leaderMenuItems = [
        { icon: Home, label: 'Dashboard', path: '/leader/dashboard' },
        { icon: Users, label: 'Scouts', path: '/leader/scouts' },
        { icon: Activity, label: 'Activities', path: '/leader/activities' },
        { icon: FileText, label: 'Reports', path: '/leader/reports' },
    ];

    const examinerMenuItems = [
        { icon: Home, label: 'Dashboard', path: '/examiner/dashboard' },
        { icon: Award, label: 'Badge Reviews', path: '/examiner/badges' },
    ];

    const adminMenuItems = [
        { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Users, label: 'Scouts', path: '/admin/scouts' },
        { icon: Activity, label: 'Activities', path: '/admin/activities' },
        { icon: Award, label: 'Badges', path: '/admin/badges' },
        { icon: FileText, label: 'Eligibility', path: '/admin/eligibility-checker' },
    ];

    let menuItems = scoutMenuItems;
    if (role === 'Scout Leader') menuItems = leaderMenuItems;
    else if (role === 'Badge Examiner') menuItems = examinerMenuItems;
    else if (role === 'Admin') menuItems = adminMenuItems;

    return (
        <div className="w-64 bg-gradient-to-b from-[#0B5D1E] to-[#084516] text-white min-h-screen p-6 flex flex-col">
            {/* Logo */}
            <div className="mb-8">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#E6B800] rounded-full flex items-center justify-center">
                        <Award className="w-6 h-6 text-[#0B5D1E]" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg">Scout PMS</h2>
                        <p className="text-xs text-green-200">{role}</p>
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.path.split('/').pop();

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-[#E6B800] text-[#0B5D1E] font-semibold shadow-lg'
                                    : 'hover:bg-white/10 text-white'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-600/20 text-red-200 hover:text-white transition-all duration-200"
            >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
            </button>
        </div>
    );
};

export default Sidebar;
