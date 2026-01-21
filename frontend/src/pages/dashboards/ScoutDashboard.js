import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Calendar,
  Award,
  TrendingUp,
  Bell,
  LogOut,
  Home,
  Activity,
  Medal,
  User,
} from 'lucide-react';

export default function ScoutDashboard({ navigate, userData }) {
  const navItems = [
    { icon: Home, label: 'Dashboard', page: 'scout-dashboard', active: true },
    { icon: Activity, label: 'My Activities', page: 'activity-tracking' },
    { icon: Medal, label: 'My Badges', page: 'badge-progress' },
    { icon: TrendingUp, label: 'Award Progress', page: 'award-eligibility' },
    { icon: User, label: 'Profile', page: 'scout-profile' },
  ];

  const statsCards = [
    { title: "Today's Activities", value: '3', icon: Calendar, color: 'from-blue-500 to-blue-600', page: 'activity-registration' },
    { title: 'Completed Badges', value: '12', icon: Award, color: 'from-[#E6B800] to-amber-600', page: 'badge-progress' },
    { title: 'Pending Awards', value: '2', icon: Medal, color: 'from-green-500 to-[#0B5D1E]', page: 'award-eligibility' },
    { title: 'Upcoming Events', value: '5', icon: Bell, color: 'from-purple-500 to-purple-600', page: 'activity-registration' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B5D1E] to-green-700 text-white py-6 px-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2>Welcome back, {userData?.name}!</h2>
            <p className="text-green-100">Scout ID: {userData?.scoutId}</p>
          </div>
          <Button
            onClick={() => navigate('main-portal')}
            variant="outline"
            className="border-white text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.page)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${item.active
                    ? 'bg-gradient-to-r from-[#0B5D1E] to-green-700 text-white'
                    : 'text-gray-700 hover:bg-green-50'
                  }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Main */}
        <div className="flex-1 p-8">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} onClick={() => navigate(stat.page)} className="cursor-pointer">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="text-white" />
                    </div>
                    <p className="text-gray-600">{stat.title}</p>
                    <p className="text-gray-900">{stat.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Motivation */}
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <img
                src="https://images.unsplash.com/photo-1668864840122-8bdaf2a87e77"
                alt="Compass"
                className="w-20 h-20 rounded-full object-cover"
              />
              <div>
                <h3 className="text-[#0B5D1E]">Scout's Motto</h3>
                <p className="italic text-gray-700">
                  "Be Prepared — A Scout is never taken by surprise."
                </p>
                <p className="text-gray-600">— Robert Baden-Powell</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
