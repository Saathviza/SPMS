import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { leaderService, authService, scoutService } from '../../services/api';
import { connectSocket, getSocket } from '../../services/socket';
import {
  Users,
  Activity,
  FileText,
  LogOut,
  Eye,
  Check,
  X,
  Award,
  Download,
  MessageSquare,
  Image as ImageIcon,
  Trophy,
  Calendar,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import FeedbackWidget from '../../components/FeedbackWidget';

// ── TIMELINE VIEW SUB-COMPONENT ───────────────────────────────────────────
const TimelineView = ({ scoutId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const history = await scoutService.getTimeline(scoutId);
        setData(history);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [scoutId]);

  if (loading) return <div className="p-10 text-center animate-pulse text-amber-600 font-bold">Loading Chronicles...</div>;
  if (data.length === 0) return <div className="p-10 text-center text-gray-400 italic font-medium">No official milestones recorded yet.</div>;

  return (
    <div className="relative border-l-4 border-amber-200 ml-4 pl-8 space-y-8 py-4">
      {data.map((event, idx) => (
        <div key={idx} className="relative">
          <div className={`absolute -left-12 top-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${event.record_type === 'badge' ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'}`}>
             {event.record_type === 'badge' ? <Award className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
          </div>
          <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
             <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black uppercase text-amber-600">{event.record_type}</span>
                <span className="text-[10px] font-bold text-gray-400">{new Date(event.date).toLocaleDateString()}</span>
             </div>
             <h4 className="font-black text-gray-900 leading-tight">{event.title}</h4>
             <p className="text-xs text-gray-500 mt-1">{event.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function LeaderDashboard() {
  const navigate = useNavigate();
  const [section, setSection] = useState('overview');
  const [scouts, setScouts] = useState([]);
  const [pendingActivities, setPendingActivities] = useState([]);
  const [leaderData, setLeaderData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Report Preview State
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  
  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState([]);

  const fetchLeaderData = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user || user.role !== 'leader') {
        navigate('/');
        return;
      }
      setLeaderData(user);

      const scoutList = await leaderService.getScouts();
      setScouts(scoutList);

      const activities = await leaderService.getPendingActivities();
      setPendingActivities(activities);
      try {
        const rankings = await leaderService.getLeaderboard();
        setLeaderboard(rankings);
      } catch (e) { console.error("Leaderboard Error:", e); }
    } catch (err) {
      console.error("Error fetching leader data:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderData();
    
    // ── Socket listener ────────────────────────────────────────────
    connectSocket('leader');
    const socket = getSocket();

    const handleRefresh = (data) => {
      if (data?.message) {
        toast.info(data.message);
      }
      fetchLeaderData();
    };

    socket.on('activity:registered', handleRefresh);
    socket.on('proof:submitted', handleRefresh);
    socket.on('roster:updated', handleRefresh);
    socket.on('scout:graduated', (data) => {
        toast.success(`🎖️ BREAKING NEWS: A scout in your group has reached a major milestone!`);
        handleRefresh();
    });

    return () => {
      socket.off('activity:registered', handleRefresh);
      socket.off('proof:submitted', handleRefresh);
      socket.off('roster:updated', handleRefresh);
      socket.off('scout:graduated', handleRefresh);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);
  const handleApprove = async (approvalId) => {
    try {
      await leaderService.approveActivity({
        approval_id: approvalId,
        review_note: 'Approved by leader'
      });
      toast.success('Activity approved');
      // Refresh pending activities
      const activities = await leaderService.getPendingActivities();
      setPendingActivities(activities);
    } catch (err) {
      toast.error('Failed to approve activity');
    }
  };

  const handleReject = async (approvalId) => {
    try {
      await leaderService.rejectActivity({
        approval_id: approvalId,
        review_note: 'Rejected by leader'
      });
      toast.error('Activity rejected');
      // Refresh pending activities
      const activities = await leaderService.getPendingActivities();
      setPendingActivities(activities);
    } catch (err) {
      toast.error('Failed to reject activity');
    }
  };

  const handlePreviewReport = async (reportType) => {
    try {
      setReportLoading(true);
      const report = await leaderService.getReportFile(reportType);
      setSelectedReport(report);
      setReportModalOpen(true);
    } catch (err) {
      console.error("Preview failed:", err);
      toast.error("Report not available", {
        description: "The requested report file could not be found or generated."
      });
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownload = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-green-800 text-white p-6 flex justify-between items-center">
        <div>
          <h1>Scout Leader Dashboard</h1>
          <p>Welcome, {leaderData?.name || 'Leader'}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            authService.logout();
            navigate('/');
          }}
          className="border-white text-white hover:bg-white/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white p-4 shadow-lg min-h-[calc(100vh-100px)]">
          {[
            { id: 'overview', label: 'Scout Overview', icon: Users },
            { id: 'leaderboard', label: 'Troop Leaderboard', icon: Trophy },
            { id: 'activities', label: 'Pending Approvals', icon: Activity },
            { id: 'reports', label: 'Reports', icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded mb-2 ${section === item.id
                  ? 'bg-amber-600 text-white'
                  : 'hover:bg-amber-50 text-gray-700'
                  }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {section === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-amber-900 flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-xl">
                    <Users className="w-8 h-8 text-amber-600" />
                  </div>
                  Troop Scout Overview
                </h2>
                <div className="flex gap-2">
                   <div className="bg-white px-4 py-2 rounded-xl border-b-2 border-amber-500 shadow-md">
                      <p className="text-[10px] font-black uppercase text-gray-400">Total Scouts</p>
                      <p className="text-xl font-black text-amber-900 leading-none">{scouts.length}</p>
                   </div>
                </div>
              </div>

              {scouts.length === 0 ? (
                <Card className="border-2 border-dashed border-amber-200">
                  <CardContent className="flex flex-col items-center justify-center py-20">
                    <Users className="w-16 h-16 text-amber-100 mb-4" />
                    <p className="text-amber-800 font-bold text-xl uppercase italic">No scouts found in this group.</p>
                    <p className="text-gray-400 mt-2">Active members will appear here once registered.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {scouts.map((s) => (
                    <Card key={s.id} className="group border-none shadow-xl rounded-[2rem] overflow-hidden hover:shadow-2xl hover:scale-[1.03] transition-all bg-white">
                      <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
                      <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-xl font-black text-gray-900 group-hover:text-amber-800 transition-colors uppercase tracking-tight">{s.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[10px] font-bold text-gray-400 italic">ID: SLC-{s.id.toString().padStart(3,'0')}</span>
                               <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                               <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{s.age} Years Old</span>
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 group-hover:bg-amber-100 group-hover:rotate-12 transition-all">
                             <User className="w-6 h-6 text-amber-600" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                           <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                              <p className="text-[10px] font-black text-amber-700 uppercase mb-1">Badges</p>
                              <div className="flex items-center gap-2">
                                 <Award className="w-4 h-4 text-amber-600" />
                                 <span className="text-2xl font-black text-gray-900">{s.badges_earned}</span>
                              </div>
                           </div>
                           <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100">
                              <p className="text-[10px] font-black text-green-700 uppercase mb-1">Activities</p>
                              <div className="flex items-center gap-2">
                                 <Activity className="w-4 h-4 text-green-600" />
                                 <span className="text-2xl font-black text-gray-900">{s.activities_completed}</span>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           {/* Journey Progress Marker */}
                           <div>
                              <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 mb-1">
                                 <span>Milestone Progress</span>
                                 <span>{Math.min(100, Math.round((s.badges_earned / 21) * 100))}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                 <div 
                                   className="h-full bg-amber-500 rounded-full transition-all duration-1000" 
                                   style={{ width: `${Math.min(100, (s.badges_earned / 21) * 100)}%` }}
                                 />
                              </div>
                           </div>

                           <div className="flex gap-2 pt-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl h-12 shadow-lg shadow-amber-900/10"
                                    onClick={async () => {
                                      try {
                                        const journey = await scoutService.getTimeline(s.id);
                                        // We can't use state here easily because the dialog is already open 
                                        // Instead, we pass the data to the dialog content if possible
                                      } catch (e) { console.error(e); }
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-2" /> Journey
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl bg-amber-50/50 border-none shadow-2xl rounded-3xl overflow-hidden p-0">
                                   <div className="bg-amber-800 text-white p-6 pt-10">
                                      <h3 className="text-3xl font-black tracking-tighter mb-1 uppercase italic">{s.name}'s Scout Journey</h3>
                                      <p className="text-amber-200 font-bold tracking-widest text-xs uppercase opacity-80">Official Activity Timeline</p>
                                   </div>
                                   <div className="p-8 max-h-[60vh] overflow-y-auto">
                                      {/* Mini Journey Component Re-implemented for Quick View */}
                                      <TimelineView scoutId={s.id} />
                                   </div>
                                   <div className="p-6 bg-white border-t flex justify-end">
                                      <Button 
                                        variant="outline" 
                                        onClick={() => navigate(`/scout/profile/${s.id}`)}
                                        className="border-amber-600 text-amber-700 font-bold rounded-xl"
                                      >
                                        Go to Full Profile
                                      </Button>
                                   </div>
                                </DialogContent>
                              </Dialog>

                              <Button 
                                variant="outline" 
                                className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50 font-bold rounded-xl h-12"
                                onClick={() => navigate(`/scout/profile/${s.id}`)}
                              >
                                Portfolio
                              </Button>
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === 'leaderboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                  <Trophy className="w-8 h-8 text-amber-500" />
                  Troop Excellence Rankings
                </h2>
                <div className="bg-amber-100 px-4 py-2 rounded-full text-amber-800 text-sm font-bold flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Top Performers This Month
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {leaderboard.slice(0, 3).map((scout, idx) => (
                  <Card 
                    key={scout.scout_id} 
                    onClick={() => navigate(`/scout/profile/${scout.scout_id}`)}
                    className={`border-none shadow-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.07] active:scale-95 ${idx === 0 ? 'scale-105 ring-4 ring-amber-400 z-10' : 'scale-95'}`}
                  >
                    <div className={`h-2 ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-gray-300' : 'bg-amber-600'}`} />
                    <CardHeader className="text-center pb-2">
                      <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-2">
                         <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                      </div>
                      <CardTitle className="text-lg">{scout.name}</CardTitle>
                      <p className="text-sm font-bold text-amber-600 uppercase tracking-widest">{idx === 0 ? 'Group Champion' : idx === 1 ? 'Elite Scout' : 'Star Performer'}</p>
                    </CardHeader>
                    <CardContent className="text-center pt-0">
                      <div className="flex justify-center gap-4 text-xs font-bold text-gray-500 mb-4">
                        <span>{scout.badges} Badges</span>
                        <span>{scout.activities} Acts</span>
                      </div>
                      <div className="text-4xl font-black text-amber-900">{scout.points}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Total Points</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b">
                        <th className="p-4 text-left">Rank</th>
                        <th className="p-4 text-left">Scout Name</th>
                        <th className="p-4 text-center">Badges</th>
                        <th className="p-4 text-center">Activities</th>
                        <th className="p-4 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((scout, idx) => (
                        <tr 
                          key={scout.scout_id} 
                          onClick={() => navigate(`/scout/profile/${scout.scout_id}`)}
                          className="border-b hover:bg-amber-50 transition-colors cursor-pointer group"
                        >
                          <td className="p-4 font-black text-xl italic text-gray-300 group-hover:text-amber-500 transition-colors">#{idx + 1}</td>
                          <td className="p-4">
                            <div className="font-bold text-amber-900 group-hover:text-amber-700">{scout.name}</div>
                            <div className="text-[10px] text-gray-400 font-medium">Troop #124 - Colombo District</div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">🎯 {scout.badges}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">⚡ {scout.activities}</span>
                          </td>
                          <td className="p-4 text-right">
                             <span className="text-xl font-black text-amber-700">{scout.points}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {section === 'activities' && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Activity Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingActivities.length === 0 ? (
                  <p className="text-center py-10 text-gray-500">No pending activities to approve.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingActivities.map((a) => (
                      <div key={a.approval_id || a.id} className="flex justify-between items-center p-4 bg-white border rounded-lg shadow-sm">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-amber-900">{a.activity_name}</h4>
                          <p className="text-sm font-medium text-gray-700">Scout: {a.scout_name}</p>
                          <p className="text-xs text-gray-500">{new Date(a.date).toLocaleDateString()} - {a.location}</p>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                                <Eye className="w-4 h-4 mr-1" /> View Submission
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-amber-800">Review Submission</DialogTitle>
                                <DialogDescription>
                                  Proof submitted by {a.scout_name} for {a.activity_name}
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-6 mt-4">
                                {/* Comment Section */}
                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                  <h5 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-700 mb-2">
                                    <MessageSquare className="w-4 h-4" /> Scout's Comments
                                  </h5>
                                  <p className="text-gray-800 leading-relaxed font-medium">
                                    {a.scout_submission_notes || "No comments provided."}
                                  </p>
                                </div>

                                {/* Proof Files Section */}
                                {a.scout_evidence_files && (
                                  <div className="space-y-3">
                                    <h5 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-700">
                                      <ImageIcon className="w-4 h-4" /> Evidence / Proof
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4">
                                      {a.scout_evidence_files.split(',').map((path, idx) => (
                                        <div key={idx} className="relative group rounded-xl overflow-hidden border-2 border-amber-100 shadow-sm">
                                          <img
                                            src={`http://localhost:4000/${path}`}
                                            alt={`Proof ${idx + 1}`}
                                            className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-110"
                                            onError={(e) => {
                                              e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found';
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {!a.scout_evidence_files && !a.scout_submission_notes && (
                                  <div className="text-center py-8 text-gray-400">
                                    No evidence uploaded for this activity.
                                  </div>
                                )}
                                
                                <FeedbackWidget targetType="activity" targetId={a.approval_id || a.id} scoutId={a.scout_id} currentRole="leader" />
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(a.approval_id || a.id)}>
                            <Check className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(a.approval_id || a.id)}>
                            <X className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {section === 'reports' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: 'Monthly Progress Report',
                  desc: 'Overview of scout performance for the selected month',
                  icon: FileText,
                  color: 'text-blue-600',
                  bg: 'bg-blue-100'
                },
                {
                  title: 'Badge Achievement Report',
                  desc: 'Detailed badge completion and approval status',
                  icon: Award,
                  color: 'text-amber-600',
                  bg: 'bg-amber-100'
                },
                {
                  title: 'Attendance Report',
                  desc: 'Scout attendance across training and service activities',
                  icon: Users,
                  color: 'text-green-600',
                  bg: 'bg-green-100'
                }
              ].map((report) => (
                <Card key={report.title} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className={`p-3 rounded-xl ${report.bg}`}>
                      <report.icon className={`w-8 h-8 ${report.color}`} />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-800">
                      {report.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-6 min-h-[40px]">
                      {report.desc}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => handlePreviewReport(report.title)}
                        disabled={reportLoading}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Report
                      </Button>
                      <Button
                        variant="outline"
                        className="border-amber-600 text-amber-600 hover:bg-amber-50"
                        onClick={() => handlePreviewReport(report.title)}
                        disabled={reportLoading}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Report Preview Modal */}
          <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white p-0">
              <div className="sr-only">
                <DialogTitle>{selectedReport?.title || "Report Preview"}</DialogTitle>
                <DialogDescription>
                  A real-time generated scout report for {selectedReport?.groupName || 'this group'}.
                </DialogDescription>
              </div>
              <div className="p-8" id="printable-report">
                {/* Report Header */}
                <div className="flex flex-col items-center text-center mb-8 border-b-2 border-amber-800 pb-6">
                  <div className="flex items-center gap-4 mb-2">
                    <img src="/logo.png" alt="Logo" className="w-16 h-16" onError={(e) => e.target.style.display='none'} />
                    <div>
                      <h2 className="text-3xl font-black text-amber-900 uppercase">Sri Lanka Scout Association</h2>
                      <p className="text-amber-700 font-bold tracking-widest">{selectedReport?.groupName || 'Scout District Group'}</p>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mt-4 border-y border-gray-200 py-2 px-8">
                    {selectedReport?.title}
                  </h3>
                  <div className="flex justify-between w-full mt-4 text-xs text-gray-500 font-medium uppercase tracking-tighter">
                    <span>Generated on: {new Date().toLocaleString()}</span>
                    <span>System: Scout PMS V2.0</span>
                  </div>
                </div>

                {/* Report Content based on type */}
                <div className="space-y-6">
                  {selectedReport?.data?.activities && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-amber-800 border-l-4 border-amber-600 pl-3">Recent Scout Activities (Last 30 Days)</h4>
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-amber-50 text-amber-900 border-t-2 border-amber-800">
                            <th className="p-2 border text-left">Date</th>
                            <th className="p-2 border text-left">Scout Name</th>
                            <th className="p-2 border text-left">Activity</th>
                            <th className="p-2 border text-left text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReport.data.activities.length > 0 ? selectedReport.data.activities.map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="p-2 border">{new Date(item.date).toLocaleDateString()}</td>
                              <td className="p-2 border font-medium">{item.scout}</td>
                              <td className="p-2 border">{item.activity}</td>
                              <td className={`p-2 border text-center font-bold ${item.status === 'COMPLETED' ? 'text-green-600' : 'text-amber-600'}`}>
                                {item.status}
                              </td>
                            </tr>
                          )) : <tr><td colSpan="4" className="p-4 text-center text-gray-400">No recent activity data found.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedReport?.data?.badges && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-amber-800 border-l-4 border-amber-600 pl-3">Group Badge Achievement Status</h4>
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-amber-50 text-amber-900 border-t-2 border-amber-800">
                            <th className="p-2 border text-left font-bold">Scout Name</th>
                            <th className="p-2 border text-left font-bold">Badge Name</th>
                            <th className="p-2 border text-center font-bold">Status</th>
                            <th className="p-2 border text-left font-bold">Date Achieved</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReport.data.badges.length > 0 ? selectedReport.data.badges.map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="p-2 border font-medium">{item.scout}</td>
                              <td className="p-2 border">{item.badge}</td>
                              <td className={`p-2 border text-center font-bold text-xs ${item.status === 'COMPLETED' ? 'text-green-700 bg-green-50' : 'text-blue-700 bg-blue-50'}`}>
                                {item.status}
                              </td>
                              <td className="p-2 border text-gray-500">{item.date ? new Date(item.date).toLocaleDateString() : 'In Progress'}</td>
                            </tr>
                          )) : <tr><td colSpan="4" className="p-4 text-center text-gray-400">No badge records found.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedReport?.data?.attendance && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-amber-800 border-l-4 border-amber-600 pl-3">Group Attendance Summary</h4>
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-amber-50 text-amber-900 border-t-2 border-amber-800">
                            <th className="p-2 border text-left font-bold">Activity Date</th>
                            <th className="p-2 border text-left font-bold">Activity Name</th>
                            <th className="p-2 border text-center font-bold">Total Registered</th>
                            <th className="p-2 border text-center font-bold">Verified Attendance</th>
                            <th className="p-2 border text-center font-bold">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReport.data.attendance.length > 0 ? selectedReport.data.attendance.map((item, idx) => {
                            const percent = item.total_scouts > 0 ? ((item.attended / item.total_scouts) * 100).toFixed(0) : 0;
                            return (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="p-2 border">{new Date(item.date).toLocaleDateString()}</td>
                                <td className="p-2 border font-medium">{item.activity}</td>
                                <td className="p-2 border text-center">{item.total_scouts}</td>
                                <td className="p-2 border text-center font-bold text-green-700">{item.attended}</td>
                                <td className="p-2 border text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-12 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                      <div className="bg-green-600 h-full" style={{ width: `${percent}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold">{percent}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          }) : <tr><td colSpan="5" className="p-4 text-center text-gray-400">No attendance data found.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedReport?.data?.roster && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-amber-800 border-l-4 border-amber-600 pl-3">Official Troop Progress Roster</h4>
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-amber-50 text-amber-900 border-t-2 border-amber-800">
                            <th className="p-2 border text-left font-bold">Scout Name</th>
                            <th className="p-2 border text-left font-bold">Email</th>
                            <th className="p-2 border text-center font-bold">Badges</th>
                            <th className="p-2 border text-center font-bold">Activities</th>
                            <th className="p-2 border text-center font-bold">Milestone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReport.data.roster.length > 0 ? selectedReport.data.roster.map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="p-2 border font-black text-[#0B5D1E]">{item.scout}</td>
                              <td className="p-2 border text-xs text-gray-500">{item.email}</td>
                              <td className="p-2 border text-center font-bold font-mono">{item.badges}/21</td>
                              <td className="p-2 border text-center font-bold font-mono">{item.activities}/24</td>
                              <td className="p-2 border text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-tighter ${item.award_status === 'GRADUATED' ? 'bg-purple-600 text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                                  {item.award_status}
                                </span>
                              </td>
                            </tr>
                          )) : <tr><td colSpan="5" className="p-4 text-center text-gray-400">No records found.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Footer Signature Section for real reports */}
                <div className="mt-12 flex justify-between pt-8 border-t border-dashed border-gray-300">
                   <div className="text-center w-48">
                      <div className="border-b border-gray-400 h-10 w-full mb-2"></div>
                      <p className="text-[10px] font-bold uppercase text-gray-500">Scout Leader Signature</p>
                      <p className="text-xs font-black text-gray-800">{leaderData?.name}</p>
                   </div>
                   <div className="text-center w-48">
                      <div className="border-b border-gray-400 h-10 w-full mb-2"></div>
                      <p className="text-[10px] font-bold uppercase text-gray-500">District HQ Verification</p>
                   </div>
                </div>
              </div>

              {/* Action Bar Floating for Preview Mode only */}
              <div className="p-4 bg-gray-50 border-t flex justify-between items-center sticky bottom-0">
                <p className="text-xs text-gray-500 italic">This is an official system-generated report from Scout PMS.</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setReportModalOpen(false)}>Close</Button>
                  <Button 
                    className="bg-green-700 hover:bg-green-800"
                    onClick={() => {
                      const printContent = document.getElementById('printable-report');
                      const originalContent = document.body.innerHTML;
                      // Simple approach: Use window.print() but wrap in a clean style
                      window.print();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Print / Export to PDF
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

