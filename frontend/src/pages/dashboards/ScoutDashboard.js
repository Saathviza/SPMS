import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { scoutService, authService } from '../../services/api';
import { connectSocket, getSocket } from '../../services/socket';
import confetti from 'canvas-confetti';
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
  CheckCircle2,
  Trophy,
  PartyPopper,
  Share2,
  Download,
  BookOpen,
  Shield
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';

export default function ScoutDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  const [stats, setStats] = useState({
    badges_earned: 0,
    today_activities: 0,
    pending_activities: 0,
    upcoming_events: 0
  });

  // eslint-disable-next-line no-unused-vars
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [newBadge, setNewBadge] = useState(null);
  const [isGraduated, setIsGraduated] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [certData, setCertData] = useState(null);
  const lastBadgeCount = useRef(0);
  const scoutIdRef = useRef(null);

  // ── Socket real-time subscription ────────────────────────────────────────────
  useEffect(() => {
    connectSocket('scout');
    const socket = getSocket();

    const handleActivitiesChanged = (data) => {
      if (data && scoutIdRef.current && data.scout_id !== scoutIdRef.current) return;
      // Silently refresh data in the background
      fetchData();
    };
    const handleGlobalActivitiesChanged = () => {
      // Admin changed an activity's details or date! Redraw system-wide!
      fetchData();
    };
    const handleApproved = (data) => {
      if (data && scoutIdRef.current && data.scout_id !== scoutIdRef.current) return;
      toast.success(data.message || 'Your activity proof was approved! 🎉');
      fetchData();
    };
    const handleRejected = (data) => {
      if (data && scoutIdRef.current && data.scout_id !== scoutIdRef.current) return;
      toast.error(data.message || 'Your activity proof was rejected.');
      fetchData();
    };
    const handleBadgeChanged = (data) => {
      if (data && scoutIdRef.current && (data.scout_id !== scoutIdRef.current)) return;
      if (data && data.status !== 'APPROVED') {
        toast.success(`Your badge ${data.badge_name || ''} has been updated to ${data.status || 'reviewed'}!`);
      }
      fetchData();
    };

    const handleGraduated = (data) => {
      if (data && scoutIdRef.current && (data.scout_id !== scoutIdRef.current)) return;
      setIsGraduated(true);
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#0B5D1E', '#E6B800', '#FFFFFF']
      });
    };

    socket.on('my:activities:changed', handleActivitiesChanged);
    socket.on('global:activities:changed', handleGlobalActivitiesChanged);
    socket.on('proof:approved', handleApproved);
    socket.on('proof:rejected', handleRejected);
    socket.on('badge:status:changed', handleBadgeChanged);
    socket.on('scout:graduated', handleGraduated);

    return () => {
      socket.off('my:activities:changed', handleActivitiesChanged);
      socket.off('global:activities:changed', handleGlobalActivitiesChanged);
      socket.off('proof:approved', handleApproved);
      socket.off('proof:rejected', handleRejected);
      socket.off('badge:status:changed', handleBadgeChanged);
      socket.off('scout:graduated', handleGraduated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0B5D1E', '#E6B800', '#FFFFFF']
    });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const user = authService.getCurrentUser();

      // Guards
      if (!user) {
        toast.error("Not logged in. Please login again.");
        navigate('/');
        return;
      }

      if (user.role !== 'scout') {
        toast.error("Access denied. Scout only.");
        navigate('/');
        return;
      }

      setUserData(user);

      // 🔥 FINAL CORRECT CALLS (NO ID)
      const [dashboardData, activities] = await Promise.all([
        scoutService.getDashboardConfig(),      // token-based
        scoutService.getMyActivities()          // token-based
      ]);

      const safeDashboard = dashboardData || {
        badges_earned: 0,
        today_activities: 0,
        pending_activities: 0,
        upcoming_events: 0
      };

      const safeActivities = Array.isArray(activities) ? activities : [];

      // Save active scout ID to prevent mixing up real-time events with other scouts
      scoutIdRef.current = safeDashboard.scout_id;

      // 🎉 Celebration logic (works correctly now)
      if (
        lastBadgeCount.current > 0 &&
        safeDashboard.badges_earned > lastBadgeCount.current
      ) {
        setNewBadge("New Achievement");
        setShowCelebration(true);
        triggerConfetti();
      }

      lastBadgeCount.current = safeDashboard.badges_earned;

      setStats(safeDashboard);
      setRecentActivities(safeActivities.slice(0, 3));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);

      if (err?.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        authService.logout();
        navigate('/');
        return;
      }

      toast.error("Failed to load dashboard data.", {
        description: err?.response?.data?.message || "Backend error"
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const openMilestoneCertificate = (milestoneName) => {
    setCertData({
      scoutName: userData?.full_name || userData?.name || 'Scout',
      badgeName: milestoneName,
      date: new Date().toISOString(),
      examiner: "National Commissioner",
      leader: "District Commissioner",
      uuid: `MS-${milestoneName.substring(0,3).toUpperCase()}-${Math.floor(Math.random()*1000000)}`
    });
    setIsCertOpen(true);
  };

  // Call fetchData on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navItems = [
    { icon: Home, label: 'Dashboard', page: '/scout/dashboard', active: true },
    { icon: Activity, label: 'My Activities', page: '/scout/activity-tracking' },
    { icon: Medal, label: 'My Badges', page: '/scout/badge-progress' },
    { icon: TrendingUp, label: 'Award Progress', page: '/scout/award-eligibility' },
    { icon: User, label: 'Profile', page: '/scout/profile' },
  ];

  const statsWithDefaults = {
    today_activities: stats.today_activities ?? 0,
    badges_earned: stats.badges_earned ?? 0,
    pending_activities: stats.pending_activities ?? 0,
    upcoming_events: stats.upcoming_events ?? 0,
    activities_completed: stats.activities_completed ?? 0
  };

  const statsCards = [
    { title: "Today's Activities", value: statsWithDefaults.today_activities, icon: Calendar, bg: 'bg-blue-600', page: '/scout/activity-registration' },
    { title: 'Completed Badges', value: statsWithDefaults.badges_earned, icon: Award, bg: 'bg-amber-500', page: '/scout/badge-progress' },
    { title: 'Awards Eligible', value: stats.eligible_awards ?? 0, icon: Trophy, bg: 'bg-purple-600', page: '/scout/badge-progress' },
    { title: 'Upcoming Events', value: statsWithDefaults.upcoming_events, icon: Bell, bg: 'bg-emerald-600', page: '/scout/activity-registration' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mb-4"></div>
        <p className="text-green-700 font-medium italic">"Be Prepared..."</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FDF4] pb-20">
      {/* Badge Celebration Overlay */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-3xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-600 via-amber-400 to-green-600"></div>
          <DialogHeader className="pt-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="bg-amber-100 p-6 rounded-full animate-bounce">
                  <Trophy className="w-16 h-16 text-amber-600" />
                </div>
                <PartyPopper className="absolute -top-2 -right-2 w-8 h-8 text-green-600 animate-pulse" />
              </div>
            </div>
            <DialogTitle className="text-center text-3xl font-black text-gray-900 tracking-tight">
              CONGRATULATIONS!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 text-lg px-4 mt-2">
              You've earned a new badge for your dedication and scouting spirit. Your hard work is truly paying off!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-3 mt-8 p-4">
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 mb-4">
              <p className="text-green-800 text-center font-bold">"A Scout is always ready to celebrate achievement."</p>
            </div>
            <Button
              onClick={() => navigate('/scout/award-eligibility')}
              className="bg-[#0B5D1E] hover:bg-green-800 text-white py-8 text-xl font-bold shadow-xl rounded-2xl"
            >
              <Award className="w-6 h-6 mr-2" />
              Claim Your Certificate
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="py-6 rounded-xl border-2" onClick={() => setShowCelebration(false)}>
                Later
              </Button>
              <Button variant="secondary" className="py-6 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={() => {
                const shareText = "I just earned a new badge in Scout PMS! ⚜️ #Scouting #Achievement";
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
              }}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B5D1E] to-[#084516] text-white py-10 px-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy className="w-48 h-48 rotate-12" />
        </div>
        <div className="flex justify-between items-center max-w-7xl mx-auto relative z-10">
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-1">Welcome back, {userData?.name || 'Scout'}!</h2>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                Scout ID: {userData?.scout_id ?? userData?.id ?? '1'}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-green-300 text-xs font-medium uppercase tracking-widest">Active Member</span>
            </div>
          </div>
          <Button
            onClick={() => {
              authService.logout();
              navigate('/');
            }}
            variant="ghost"
            className="text-white hover:bg-white/10 border border-white/20 px-6 h-12 font-bold"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* ⚠️ BELOW THIS: YOUR UI IS UNCHANGED */}
      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto mt-8 px-6 gap-8">
        {/* Sidebar */}
        <div className="lg:w-72 flex flex-col gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.page)}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${item.active
                  ? 'bg-[#0B5D1E] text-white shadow-xl scale-[1.02]'
                  : 'text-gray-600 hover:bg-[#DCFCE7] hover:text-[#0B5D1E]'
                  }`}
              >
                <div className={`p-2 rounded-lg ${item.active ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-white'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main */}
        <div className="flex-1 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.title}
                  onClick={() => navigate(stat.page)}
                  className="group cursor-pointer hover:shadow-2xl transition-all border-none shadow-lg rounded-3xl overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className={`h-2 ${stat.bg}`}></div>
                    <div className="p-6 flex items-center gap-5">
                      <div className={`flex-shrink-0 w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">{stat.title}</p>
                        <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 📖 DIGITAL PROGRESS BOOK UI */}
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden mt-8 transition-all hover:shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-green-800 to-green-700 text-white p-8">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <BookOpen className="w-7 h-7 text-amber-400" />
                    My Digital Progress Book
                  </CardTitle>
                  <p className="text-green-100 font-medium mt-2">
                    Official Sri Lanka Scout Association Syllabus Journey
                  </p>
                </div>
                <Button onClick={() => navigate('/scout/award-eligibility')} variant="secondary" className="bg-white text-green-800 hover:bg-green-50 font-bold px-6 py-5 rounded-xl shadow-lg">
                  View President's Requirements
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-10 bg-white">
              <div className="relative">
                {/* Vertical Timeline Guide */}
                <div className="absolute left-8 top-10 bottom-10 w-1.5 bg-gray-100 rounded-full"></div>

                {/* President's Scout Award */}
                <div className="relative flex items-center gap-8 mb-12">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg z-10 transition-all duration-500 ${statsWithDefaults.badges_earned >= 21 && statsWithDefaults.activities_completed >= 24 ? 'bg-amber-400 border-4 border-amber-200' : 'bg-white border-4 border-gray-200'}`}>
                    <Award className={`w-8 h-8 ${statsWithDefaults.badges_earned >= 21 && statsWithDefaults.activities_completed >= 24 ? 'text-white' : 'text-gray-300'}`} />
                  </div>
                  <div className="flex-1 bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:border-amber-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-black text-gray-900">President's Scout Award</h4>
                        <p className="text-sm text-gray-500 font-medium mt-1">Requires Chief Comm. Award + 21 Badges + 24 Activities</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold leading-none flex items-center h-6 ${statsWithDefaults.badges_earned >= 21 && statsWithDefaults.activities_completed >= 24 ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        {statsWithDefaults.badges_earned >= 21 && statsWithDefaults.activities_completed >= 24 ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Eligible</> : 'Locked'}
                      </span>
                    </div>
                    {(statsWithDefaults.badges_earned < 21 || statsWithDefaults.activities_completed < 24) && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                          <span>Badges Progress</span>
                          <span>{Math.min(Math.round((statsWithDefaults.badges_earned / 21) * 100), 100)}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2.5 w-full overflow-hidden mb-3">
                          <div className="bg-amber-400 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min((statsWithDefaults.badges_earned / 21) * 100, 100)}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                          <span>Activities Progress ({statsWithDefaults.activities_completed}/24)</span>
                          <span>{Math.min(Math.round((statsWithDefaults.activities_completed / 24) * 100), 100)}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2.5 w-full overflow-hidden">
                          <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min((statsWithDefaults.activities_completed / 24) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                    {statsWithDefaults.badges_earned >= 21 && statsWithDefaults.activities_completed >= 24 && (
                      <div className="mt-4">
                        <Button 
                          className="bg-amber-400 hover:bg-amber-500 text-black font-black w-full"
                          onClick={() => openMilestoneCertificate("President's Scout Award")}
                        >
                          <Download className="w-4 h-4 mr-2" /> Download Official Award Certificate
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chief Commissioner's Award */}
                <div className="relative flex items-center gap-8 mb-12">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg z-10 transition-all duration-500 ${statsWithDefaults.badges_earned >= 10 ? 'bg-green-600 border-4 border-green-200' : 'bg-white border-4 border-gray-200'}`}>
                    <Shield className={`w-8 h-8 ${statsWithDefaults.badges_earned >= 10 ? 'text-white' : 'text-gray-300'}`} />
                  </div>
                  <div className="flex-1 bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:border-green-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-black text-gray-900">Chief Commissioner's Award</h4>
                        <p className="text-sm text-gray-500 font-medium mt-1">Strict Prerequisite Phase for President's Award</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold leading-none flex items-center h-6 ${statsWithDefaults.badges_earned >= 10 ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        {statsWithDefaults.badges_earned >= 10 ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Earned</> : 'In Progress'}
                      </span>
                    </div>
                    {statsWithDefaults.badges_earned >= 10 && (
                      <div className="mt-4">
                        <Button 
                           variant="outline"
                           className="border-green-600 text-green-700 hover:bg-green-50 w-full font-bold"
                           onClick={() => openMilestoneCertificate("Chief Commissioner's Award")}
                        >
                          <Download className="w-4 h-4 mr-2" /> View Achievement Certificate
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* National Scout Award */}
                <div className="relative flex items-center gap-8 mb-12">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg z-10 transition-all duration-500 ${statsWithDefaults.badges_earned >= 5 ? 'bg-blue-600 border-4 border-blue-200' : 'bg-white border-4 border-gray-200'}`}>
                    <Medal className={`w-8 h-8 ${statsWithDefaults.badges_earned >= 5 ? 'text-white' : 'text-gray-300'}`} />
                  </div>
                  <div className="flex-1 bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-black text-gray-900">National Scout Award</h4>
                        <p className="text-sm text-gray-500 font-medium mt-1">Foundational Outdoor Standard</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold leading-none flex items-center h-6 ${statsWithDefaults.badges_earned >= 5 ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        {statsWithDefaults.badges_earned >= 5 ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Earned</> : 'In Progress'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Membership Badge (Base Level) */}
                <div className="relative flex items-center gap-8">
                  <div className="w-16 h-16 rounded-full bg-purple-600 border-4 border-purple-200 flex items-center justify-center shadow-lg z-10">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 bg-purple-50 p-6 rounded-2xl border border-purple-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-black text-purple-900">Membership Badge</h4>
                        <p className="text-sm text-purple-700 font-semibold mt-1">Initiation & Basic Proficiencies</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold leading-none flex items-center h-6 bg-purple-200 text-purple-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Earned
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
      {/* 🎖️ PRESIDENT'S AWARD GRADUATION MODAL */}
      <Dialog open={isGraduated} onOpenChange={setIsGraduated}>
        <DialogContent className="sm:max-w-xl bg-[#0B5D1E] text-white border-0 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(230,184,0,0.4)]">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Trophy size={200} />
          </div>
          
          <DialogHeader className="pt-8 items-center text-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border-4 border-[#E6B800] animate-bounce">
              <Medal size={50} className="text-[#E6B800]" />
            </div>
            <DialogTitle className="text-4xl font-black mb-2 tracking-tighter">CONGRATULATIONS!</DialogTitle>
            <DialogDescription className="text-amber-300 font-bold text-xl uppercase tracking-widest">
              President's Scout Award Achieved
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 text-center space-y-6">
            <p className="text-lg font-medium leading-relaxed px-4">
               You have demonstrated exceptional leadership, courage, and dedication. With <strong>21 merit badges</strong> and <strong>24 activity sessions</strong>, you have reached the pinnacle of Sri Lankan Scouting.
            </p>
            
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm mx-4">
               <div className="flex justify-around items-center">
                  <div className="text-center">
                     <p className="text-3xl font-black">21</p>
                     <p className="text-[10px] uppercase font-bold opacity-70">Badges</p>
                  </div>
                  <div className="w-px h-10 bg-white/20"></div>
                  <div className="text-center">
                     <p className="text-3xl font-black">24+</p>
                     <p className="text-[10px] uppercase font-bold opacity-70">Activities</p>
                  </div>
                  <div className="w-px h-10 bg-white/20"></div>
                  <div className="text-center text-[#E6B800]">
                     <PartyPopper size={30} />
                     <p className="text-[10px] uppercase font-bold">Passed</p>
                  </div>
               </div>
            </div>

            <p className="text-xs text-white/60 pt-4 italic">
               Your digital certificate and official graduation records are now available in your portfolio.
            </p>
          </div>

          <div className="p-8 pt-2 flex gap-4">
             <Button className="flex-1 bg-[#E6B800] hover:bg-amber-500 text-black font-black text-lg py-6 rounded-2xl" onClick={() => setIsGraduated(false)}>
                I am Proud!
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 📜 DIGITAL MILESTONE CERTIFICATE MODAL */}
      <Dialog open={isCertOpen} onOpenChange={setIsCertOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] p-0 shadow-2xl rounded-sm border-none bg-transparent overflow-hidden">
          <div className="bg-[#fdfaf2] border-[10px] border-[#0B5D1E] m-1 overflow-hidden shadow-inner relative" id="printable-milestone">
            {/* Texture & Security Detail */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#8B5E34 0.5px, transparent 0)', backgroundSize: '12px 12px' }}></div>
            
            <div className="p-4 relative">
              {/* Gold Inner Border Line */}
              <div className="border border-[#E6B800] p-3 text-center space-y-1">
                
                {/* Official Branding Header */}
                <div className="flex flex-col items-center mb-1">
                  <img src="/logo.png" alt="Logo" className="w-14 h-14 mb-1" onError={(e) => e.target.style.display='none'} />
                  <h1 className="text-xl font-serif font-black text-[#0B5D1E] uppercase tracking-widest underline underline-offset-4 decoration-[#E6B800]/50">
                    Sri Lanka Scout Association
                  </h1>
                  <p className="text-[8px] font-black tracking-widest text-[#8B5E34]">ISSUED BY THE NATIONAL HEADQUARTERS</p>
                </div>
                
                {/* The Award Identity */}
                <p className="text-[12px] font-serif text-gray-500 italic leading-none">This is to certify that the prestigious milestone of</p>
                <div className="py-0.5">
                  <h2 className="text-2xl font-serif font-black text-[#8B5E34] uppercase leading-none drop-shadow-sm tracking-tight">
                    {certData?.badgeName}
                  </h2>
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#8B5E34]/30 to-transparent mx-auto mt-1"></div>
                </div>

                <p className="text-[12px] font-serif text-gray-500 italic leading-none">has been officially conferred upon</p>
                
                {/* The Recipient */}
                <div className="my-1">
                  <h3 className="text-xl font-bold text-gray-900 border-b-2 border-dashed border-gray-200 inline-block px-12 py-0.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {certData?.scoutName}
                  </h3>
                </div>

                <p className="text-[9px] font-medium text-gray-400 max-w-sm mx-auto leading-tight border-t border-b border-gray-50 py-1">
                  HAVING FULFILLED ALL REQUIREMENTS OF CITIZENSHIP, CHARACTER, AND LEADERSHIP AS MANDATED FOR THIS RANK.
                </p>

                {/* Secure Grid Footer */}
                <div className="grid grid-cols-3 items-end mt-2 h-20">
                   <div className="text-center">
                      <p className="text-[22px] text-gray-800 leading-none mb-1 opacity-90" style={{ fontFamily: "'Dancing Script', cursive" }}>
                        {certData?.leader}
                      </p>
                      <div className="border-t border-gray-400/50 pt-0.5">
                         <p className="text-[6px] uppercase font-black tracking-[0.2em] text-[#0B5D1E]">HQ REPRESENTATIVE</p>
                      </div>
                   </div>

                   <div className="flex justify-center items-center pb-1">
                      <div className="w-16 h-16 bg-[#0B5D1E] rounded-full shadow-lg border-2 border-[#E6B800] flex items-center justify-center relative overflow-hidden">
                         <Shield className="text-[#E6B800] w-8 h-8 relative z-10" />
                         <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
                      </div>
                   </div>

                   <div className="text-center">
                      <p className="text-[22px] text-gray-800 leading-none mb-1 opacity-90" style={{ fontFamily: "'Dancing Script', cursive" }}>
                        {certData?.examiner}
                      </p>
                      <div className="border-t border-gray-400/50 pt-0.5">
                         <p className="text-[6px] uppercase font-black tracking-[0.2em] text-[#0B5D1E]">CHIEF COMMISSIONER</p>
                      </div>
                   </div>
                </div>

                {/* Final Footer Details */}
                <div className="flex justify-between items-end mt-2">
                   <div className="text-left space-y-0.5">
                      <p className="text-[5px] font-black text-gray-400 uppercase tracking-tighter">DATE: {certData?.date && new Date(certData.date).toLocaleDateString()}</p>
                      <p className="text-[5px] font-black text-gray-400 uppercase tracking-tighter">PMS-CERT-{Math.floor(Math.random()*1000000)}</p>
                   </div>
                   <div className="bg-white p-0.5 border border-gray-100 flex items-center justify-center shadow-sm">
                      <QRCodeCanvas 
                         value={`http://192.168.1.6:3000/verify/milestone/${certData?.uuid}`}
                         size={40}
                         bgColor={"#ffffff"}
                         fgColor={"#000000"}
                         level={"H"}
                      />
                   </div>
                </div>
              </div>
            </div>
          </div>




          <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCertOpen(false)}>Close Certificate</Button>
            <Button 
                className="bg-[#0B5D1E] hover:bg-green-800 font-black px-8"
                onClick={() => window.print()}
            >
              <Download className="w-4 h-4 mr-2" />
              PRINT OFFICIAL DOCUMENT
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


