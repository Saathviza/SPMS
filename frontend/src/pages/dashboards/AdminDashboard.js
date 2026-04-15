import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { adminService, activityService, authService } from '../../services/api';
import { connectSocket, getSocket } from '../../services/socket';
import { LogOut, Users, Shield, Map, Activity as ActivityIcon, FileText, PlusCircle, Medal, Calendar, CheckCircle, Database } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { toast } from 'sonner';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_scouts: 0, total_leaders: 0, total_groups: 0, total_activities: 0,
    new_scouts_week: 0, active_groups: 0, pending_approvals: 0,
    president_awards: 0, chief_awards: 0, eligible_month: 0,
    sys_db: 'Online', sys_api: 'Running', sys_storage: '42% Used'
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [showViewLeadersModal, setShowViewLeadersModal] = useState(false);
  const [showViewActivitiesModal, setShowViewActivitiesModal] = useState(false);

  // Data states for the view modals
  const [leadersList, setLeadersList] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);

  // Form states
  const [activityForm, setActivityForm] = useState({ name: '', session_date: '', location: '', description: '', activity_type: 'Outdoor' });
  const [badgeForm, setBadgeForm] = useState({ name: '', badge_code: '', description: '', badge_level: 'ENTRY' });
  const [leaderForm, setLeaderForm] = useState({ name: '', email: '', password: '', group_id: 1, contact_number: '' });

  const fetchAdminData = useCallback(async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user || user.role !== 'admin') {
        navigate('/');
        return;
      }
      const [statsData, logsData] = await Promise.all([
        adminService.getStats(),
        adminService.getLogs()
      ]);
      setStats(statsData);
      setLogs(logsData);
    } catch (err) {
      console.error("Error fetching admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAdminData();

    // Socket Real-time synergy
    connectSocket('admin');
    const socket = getSocket();
    
    const realTimeRefresher = () => fetchAdminData();
    socket.on('badge:submission:new', realTimeRefresher);
    socket.on('activity:enrollment', realTimeRefresher);
    socket.on('proof:submitted', realTimeRefresher);
    socket.on('user:registered', realTimeRefresher);

    return () => {
      socket.off('badge:submission:new', realTimeRefresher);
      socket.off('activity:enrollment', realTimeRefresher);
      socket.off('proof:submitted', realTimeRefresher);
      socket.off('user:registered', realTimeRefresher);
    };
  }, [fetchAdminData]);

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    try {
      await adminService.manageActivity(activityForm);
      toast.success("Activity created successfully!");
      setShowActivityModal(false);
      fetchAdminData();
    } catch (err) {
      toast.error("Failed to create activity.");
    }
  };

  const handleCreateBadge = async (e) => {
    e.preventDefault();
    try {
      await adminService.manageBadge(badgeForm);
      toast.success("Badge created successfully!");
      setShowBadgeModal(false);
      fetchAdminData();
    } catch (err) {
      toast.error("Failed to create badge.");
    }
  };

  const handleAddLeader = async (e) => {
    e.preventDefault();
    try {
      await adminService.addLeader(leaderForm);
      toast.success("Scout Leader added successfully!");
      setShowLeaderModal(false);
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add leader.");
    }
  };

  const handleViewLeaders = async () => {
    try {
      const users = await adminService.getUsers();
      const leaders = users.filter((u) => u.role_name?.toLowerCase() === 'leader');
      setLeadersList(leaders);
      setShowViewLeadersModal(true);
    } catch (err) {
      toast.error('Failed to load leaders list');
    }
  };

  const handleViewActivities = async () => {
    try {
      const activities = await activityService.getAll();
      setActivitiesList(activities);
      setShowViewActivitiesModal(true);
    } catch (err) {
      toast.error('Failed to load activities list');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const statCards = [
    { title: 'Total Scouts', value: stats.total_scouts, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', action: () => navigate('/admin/users') },
    { title: 'Scout Leaders', value: stats.total_leaders, icon: Shield, color: 'text-green-600', bg: 'bg-green-100', action: handleViewLeaders },
    { title: 'Scout Groups', value: stats.total_groups, icon: Map, color: 'text-amber-600', bg: 'bg-amber-100', action: () => navigate('/admin/groups') },
    { title: 'Activities', value: stats.total_activities, icon: ActivityIcon, color: 'text-purple-600', bg: 'bg-purple-100', action: handleViewActivities },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* HEADER */}
      <div className="bg-green-800 text-white p-6 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-green-100">System Overview & Management</p>
        </div>
        <Button
          variant="outline"
          onClick={() => { authService.logout(); navigate('/'); }}
          className="border-white text-white hover:bg-white/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* ROW 1: PRIMARY STATS (Kept EXACTLY as before) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <Card 
                 key={i} 
                 onClick={card.action}
                 className="border-none shadow-md cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-gray-300 transition-all hover:-translate-y-1 active:scale-95 duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{card.title}</p>
                      <h3 className="text-3xl font-bold mt-1">{card.value}</h3>
                    </div>
                    <div className={`p-3 rounded-xl ${card.bg}`}>
                      <Icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ROW 2: DETAILED SYSTEM CARDS (From Image 2) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* System Health */}
          <Card className="shadow-md border border-gray-100 rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-gray-800">System Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm font-medium text-gray-600">
              <div className="flex justify-between items-center border-b pb-2">
                <span>Database</span>
                <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> {stats.sys_db}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span>API Services</span>
                <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> {stats.sys_api}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Storage</span>
                <span className="text-blue-600 font-bold">{stats.sys_storage}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Registrations */}
          <Card className="shadow-md border border-gray-100 rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-gray-800">Recent Registrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm font-medium text-gray-600">
              <div className="flex justify-between items-center border-b pb-2">
                <span>New scouts this week:</span>
                <span className="font-bold text-gray-900">{stats.new_scouts_week}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span>Pending approvals:</span>
                <span className="font-bold text-gray-900">{stats.pending_approvals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Active groups:</span>
                <span className="font-bold text-gray-900">{stats.active_groups}</span>
              </div>
            </CardContent>
          </Card>

          {/* Award Statistics */}
          <Card className="shadow-md border border-gray-100 rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-gray-800">Award Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm font-medium text-gray-600">
              <div className="flex justify-between items-center border-b pb-2">
                <span>President's Award:</span>
                <span className="font-bold text-gray-900">{stats.president_awards}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span>Chief Commissioner's:</span>
                <span className="font-bold text-gray-900">{stats.chief_awards}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Eligible this month:</span>
                <span className="font-bold text-gray-900">{stats.eligible_month}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ROW 3: QUICK ACTIONS AND RECENT SYSTEM ACTIVITY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b bg-white">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Old Actions */}
              <Button onClick={() => navigate('/admin/users')} className="h-20 flex flex-col gap-2 rounded-xl text-xs bg-gray-900">
                <Users className="w-5 h-5" /> Manage Users
              </Button>
              <Button onClick={() => navigate('/admin/groups')} variant="outline" className="h-20 flex flex-col gap-2 rounded-xl text-xs">
                <Map className="w-5 h-5" /> Manage Groups
              </Button>
              <Button onClick={() => navigate('/admin/eligibility')} variant="outline" className="h-20 flex flex-col gap-2 rounded-xl text-xs">
                <Shield className="w-5 h-5" /> Eligibility Check
              </Button>
              <Button onClick={() => navigate('/admin/logs')} variant="secondary" className="h-20 flex flex-col gap-2 rounded-xl text-xs">
                <FileText className="w-5 h-5" /> System Logs
              </Button>
              
              {/* New Modal Trigger Actions */}
              <Button 
                onClick={() => setShowActivityModal(true)} 
                variant="outline" 
                className="h-20 flex flex-col gap-2 rounded-xl text-xs text-green-700 hover:bg-green-50 hover:text-green-800"
              >
                <PlusCircle className="w-5 h-5" /> Create Activity
              </Button>
              <Button 
                onClick={() => setShowBadgeModal(true)} 
                variant="outline" 
                className="h-20 flex flex-col gap-2 rounded-xl text-xs text-purple-700 hover:bg-purple-50 hover:text-purple-800"
              >
                <Medal className="w-5 h-5" /> Manage Badges
              </Button>
              <Button 
                onClick={() => setShowLeaderModal(true)} 
                className="h-20 flex flex-col gap-2 rounded-xl text-xs bg-blue-600 hover:bg-blue-700 md:col-span-3 lg:col-span-1"
              >
                <Shield className="w-5 h-5" /> Add Leader
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader className="border-b bg-white flex justify-between flex-row items-center">
              <CardTitle>Recent System Activity</CardTitle>
              <span className="text-green-500 text-xs font-bold animate-pulse px-2 py-1 bg-green-100 rounded-full">REAL-TIME</span>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {logs.length > 0 ? logs.map((item, i) => {
                  const diffMin = Math.abs(Math.round((new Date() - new Date(item.timestamp)) / 60000));
                  let timeStr = "";
                  if (diffMin < 1) {
                    timeStr = 'Just now';
                  } else if (diffMin < 60) {
                    timeStr = `${diffMin} min ago`;
                  } else if (diffMin < 1440) {
                    timeStr = `${Math.floor(diffMin/60)} hr ago`;
                  } else {
                    timeStr = new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }
                  
                  return (
                    <div key={i} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 block"></span>
                        {item.event}
                      </p>
                      <span className="text-xs text-gray-400 font-medium">{timeStr}</span>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent activity detected.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- MODALS (DIALOGS) --- */}
      
      {/* 1. Create Activity Modal */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md bg-white rounded-2xl shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-green-800 text-xl font-bold flex items-center gap-2">
              <ActivityIcon className="w-5 h-5" /> Activity Management
            </DialogTitle>
            <p className="text-sm text-gray-500">Create and manage scout activities</p>
          </DialogHeader>
          <form onSubmit={handleCreateActivity} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-bold text-gray-700">Activity Name</label>
              <input required value={activityForm.name} onChange={e => setActivityForm({...activityForm, name: e.target.value})} type="text" placeholder="Enter activity name" className="w-full mt-1 p-2 border rounded-lg bg-gray-50" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700">Date</label>
              <input required value={activityForm.session_date} onChange={e => setActivityForm({...activityForm, session_date: e.target.value})} type="date" className="w-full mt-1 p-2 border rounded-lg bg-gray-50" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700">Location</label>
              <input required value={activityForm.location} onChange={e => setActivityForm({...activityForm, location: e.target.value})} type="text" placeholder="Enter location" className="w-full mt-1 p-2 border rounded-lg bg-gray-50" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700">Category</label>
              <select value={activityForm.activity_type} onChange={e => setActivityForm({...activityForm, activity_type: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-gray-50">
                   <option>Outdoor</option>
                   <option>Community Service</option>
                   <option>Skills</option>
              </select>
            </div>
            <Button type="submit" className="w-full bg-[#16A34A] hover:bg-green-700 text-white font-bold py-6 text-lg rounded-xl mt-4">
              Create Activity
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Manage Badges Modal */}
      <Dialog open={showBadgeModal} onOpenChange={setShowBadgeModal}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md bg-white rounded-2xl shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-[#0B5D1E] text-xl font-bold flex items-center gap-2">
              <Medal className="w-5 h-5" /> Badge Management
            </DialogTitle>
            <p className="text-sm text-gray-500">Configure badge requirements</p>
          </DialogHeader>
          
          <div className="pt-4 bg-purple-50/50 p-4 rounded-xl mb-4 border border-purple-100">
             <div className="flex items-center gap-2 mb-3">
                 <span>🎖️</span>
                 <h4 className="font-bold text-gray-800">Active Badges</h4>
             </div>
             <div className="space-y-2">
                 {/* Dummy previews matching user UI */}
                 <div className="bg-white p-3 rounded-lg border flex justify-between items-center shadow-sm">
                     <span className="font-medium text-gray-700 text-sm">First Aid Badge</span>
                     <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg">Edit</Button>
                 </div>
                 <div className="bg-white p-3 rounded-lg border flex justify-between items-center shadow-sm">
                     <span className="font-medium text-gray-700 text-sm">Camping Badge</span>
                     <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg">Edit</Button>
                 </div>
             </div>
          </div>

          <form onSubmit={handleCreateBadge} className="space-y-4 border-t pt-4">
            <h4 className="font-bold text-gray-800 text-sm">Add New Badge</h4>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <input required value={badgeForm.name} onChange={e => setBadgeForm({...badgeForm, name: e.target.value})} type="text" placeholder="Badge Name" className="w-full p-2 border rounded-lg bg-gray-50 text-sm" />
               </div>
               <div>
                  <input required value={badgeForm.badge_code} onChange={e => setBadgeForm({...badgeForm, badge_code: e.target.value})} type="text" placeholder="Code (ex: FA-101)" className="w-full p-2 border rounded-lg bg-gray-50 text-sm" />
               </div>
            </div>
            <div>
               <select value={badgeForm.badge_level} onChange={e => setBadgeForm({...badgeForm, badge_level: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50 text-sm">
                   <option value="ENTRY">Entry Level</option>
                   <option value="PROFICIENCY">Proficiency</option>
                   <option value="AWARDS">Awards</option>
               </select>
            </div>
            <Button type="submit" className="w-full bg-[#A855F7] hover:bg-purple-600 text-white font-bold py-6 rounded-xl shadow-md">
              + Add New Badge
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* 3. Add Leader Modal */}
      <Dialog open={showLeaderModal} onOpenChange={setShowLeaderModal}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md bg-white rounded-2xl shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-blue-700 text-xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5" /> Add Scout Leader
            </DialogTitle>
            <p className="text-sm text-gray-500">Create a new organizational leader account</p>
          </DialogHeader>
          <form onSubmit={handleAddLeader} className="space-y-3 pt-4">
            <div>
              <label className="text-xs font-bold text-gray-700">Full Name</label>
              <input required value={leaderForm.name} onChange={e => setLeaderForm({...leaderForm, name: e.target.value})} type="text" className="w-full mt-1 p-2 border rounded-lg bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700">Email Address (Login)</label>
              <input required value={leaderForm.email} onChange={e => setLeaderForm({...leaderForm, email: e.target.value})} type="email" className="w-full mt-1 p-2 border rounded-lg bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700">Initial Password</label>
              <input required value={leaderForm.password} onChange={e => setLeaderForm({...leaderForm, password: e.target.value})} type="password" placeholder="Min 6 characters" className="w-full mt-1 p-2 border rounded-lg bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700">Contact Number</label>
              <input required value={leaderForm.contact_number} onChange={e => setLeaderForm({...leaderForm, contact_number: e.target.value})} type="text" className="w-full mt-1 p-2 border rounded-lg bg-gray-50 text-sm" />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-xl shadow-md mt-4">
              Register Leader
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. View Leaders Modal */}
      <Dialog open={showViewLeadersModal} onOpenChange={setShowViewLeadersModal}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-gray-800 text-xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" /> Currently Enrolled Scout Leaders
            </DialogTitle>
            <p className="text-sm text-gray-500">List of all active leaders</p>
          </DialogHeader>
          <div className="pt-4 space-y-3">
             {leadersList.length > 0 ? leadersList.map((leader, idx) => (
                 <div key={idx} className="bg-gray-50 p-4 rounded-xl border flex justify-between items-center shadow-sm hover:shadow-md transition">
                     <div>
                         <h4 className="font-bold text-gray-800">{leader.full_name}</h4>
                         <p className="text-sm text-gray-500">{leader.email}</p>
                     </div>
                     <span className={`px-3 py-1 text-xs font-bold rounded-full ${leader.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         {leader.status}
                     </span>
                 </div>
             )) : (
                 <p className="text-gray-500 text-center py-4">No scout leaders exist currently.</p>
             )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. View Activities Modal */}
      <Dialog open={showViewActivitiesModal} onOpenChange={setShowViewActivitiesModal}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-gray-800 text-xl font-bold flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-purple-600" /> Available Activities
            </DialogTitle>
            <p className="text-sm text-gray-500">System registered scout activities</p>
          </DialogHeader>
          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
             {activitiesList.length > 0 ? activitiesList.map((act, idx) => {
                 const d = new Date(act.activity_date || act.date);
                 return (
                 <div key={idx} className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition">
                     <h4 className="font-bold text-gray-800 mb-1">{act.activity_name || act.name || act.title}</h4>
                     <p className="text-xs text-gray-600 mb-2 truncate" title={act.description}>{act.description}</p>
                     <div className="flex justify-between items-center text-xs font-semibold text-gray-500 mt-3 pt-3 border-t border-purple-100">
                         <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {isNaN(d) ? 'TBA' : d.toLocaleDateString()}</span>
                         <span className="px-2 py-1 bg-white rounded shadow-sm text-purple-700">{act.category || 'Outdoor'}</span>
                     </div>
                 </div>
             )}) : (
                 <p className="text-gray-500 text-center py-4 md:col-span-2">No activities have been published yet.</p>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
