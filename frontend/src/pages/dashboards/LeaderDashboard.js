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
import { leaderService, authService } from '../../services/api';
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
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

export default function LeaderDashboard() {
  const navigate = useNavigate();
  const [section, setSection] = useState('scouts');
  const [scouts, setScouts] = useState([]);
  const [pendingActivities, setPendingActivities] = useState([]);
  const [leaderData, setLeaderData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Report Preview State
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

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
            { id: 'scouts', label: 'My Scouts', icon: Users },
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
          {section === 'scouts' && (
            <Card>
              <CardHeader>
                <CardTitle>Scout Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {scouts.length === 0 ? (
                  <p className="text-center py-10 text-gray-500">No scouts in your group.</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="p-2">Name</th>
                        <th className="p-2 text-center">Badges</th>
                        <th className="p-2 text-center">Activities</th>
                        <th className="p-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scouts.map((s) => (
                        <tr key={s.id} className="border-t hover:bg-amber-50/50">
                          <td className="p-2 font-medium">{s.name}</td>
                          <td className="p-2 text-center">{s.badges_earned}</td>
                          <td className="p-2 text-center">{s.activities_completed}</td>
                          <td className="p-2 text-center">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/scout/profile/${s.id}`)}>
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
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
                      <div key={a.id} className="flex justify-between items-center p-4 bg-white border rounded-lg shadow-sm">
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
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(a.id)}>
                            <Check className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(a.id)}>
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
                },
                {
                  title: 'Full Troop Roster Progress Book',
                  desc: 'Complete digital record of all scouts with badge and activity counts',
                  icon: Users,
                  color: 'text-[#0B5D1E]',
                  bg: 'bg-green-50'
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

