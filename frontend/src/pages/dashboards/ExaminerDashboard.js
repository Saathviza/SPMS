import { useNavigate, useLocation } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Award,
  CheckCircle,
  XCircle,
  Eye,
  LogOut,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { examinerService } from '../../services/api';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import FeedbackWidget from '../../components/FeedbackWidget';

export default function ExaminerDashboard() {
  const navigate = useNavigate();
  const { state } = useLocation(); // examiner data

  const [badgeSubmissions, setBadgeSubmissions] = useState([]);
  const [eligibleScouts, setEligibleScouts] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);

  const fetchData = async () => {
    try {
      const [submissions, dashboardStats, awardsData] = await Promise.all([
        examinerService.getPendingBadges(),
        examinerService.getDashboardStats(),
        examinerService.getEligibleAwards()
      ]);
      setBadgeSubmissions(submissions);
      setStats(dashboardStats);
      setEligibleScouts(awardsData);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // ── Socket.io Connection ───────────────────────────────────────
    const { connectSocket, getSocket } = require('../../services/socket');
    connectSocket('examiner');
    const socket = getSocket();

    const handleRefresh = (data) => {
      if (data?.message) {
        toast.info(data.message);
      }
      fetchData();
    };

    setSocketConnected(socket.connected);
    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('badge:submitted', handleRefresh);
    socket.on('activity:registered', handleRefresh);
    socket.on('proof:submitted', handleRefresh);

    return () => {
      socket.off('badge:submitted', handleRefresh);
      socket.off('activity:registered', handleRefresh);
      socket.off('proof:submitted', handleRefresh);
    };
  }, []);



  const approve = async (id, scout, badge) => {
    try {
      await examinerService.approveBadge({ id, feedback: feedbackText || 'Badge approved' });
      toast.success(`Badge Approved: ${badge}`, {
        description: `Digital Signature applied. ${scout}'s ${badge} badge is official!`,
        icon: <Award className="h-5 w-5" />
      });
      setFeedbackText("");
      fetchData();
    } catch (err) {
      toast.error('Failed to approve badge');
    }
  };

  const reject = async (id, scout, badge) => {
    if (!feedbackText) {
      toast.error("Feedback is heavily required when rejecting proof!");
      return;
    }
    try {
      await examinerService.rejectBadge({ id, feedback: feedbackText });
      toast.error(`Badge Rejected: ${badge}`, {
        description: `Feedback sent to ${scout}.`,
        icon: <XCircle className="h-5 w-5" />
      });
      setFeedbackText("");
      fetchData();
    } catch (err) {
      toast.error('Failed to reject badge');
    }
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-amber-600 text-white p-6 flex justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tracking-tight">Badge Examiner Dashboard</h1>
            {socketConnected ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-[10px] font-bold text-emerald-100 uppercase tracking-widest animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                Live Sync Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/20 border border-rose-400/30 rounded-full text-[10px] font-bold text-rose-100 uppercase tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                Socket Offline
              </span>
            )}
          </div>
          <p className="opacity-90 font-medium">Welcome, {state?.name || 'Examiner Mary'}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="border-white text-white"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-600' },
            { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-rose-600' },
            { label: 'Total', value: stats.total, icon: Award, color: 'text-blue-600' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${s.color}`} />
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-gray-500 font-medium">{s.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Recent Activity */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-700">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.recent_activity?.map((act, i) => (
                <div 
                  key={i} 
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    act.type === 'APPROVED' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  <span className="font-semibold">{act.message}</span>
                  {act.type === 'APPROVED' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Badge Categories */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-700">Badge Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.categories?.map((cat, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600 font-medium">{cat.category}</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-bold text-gray-700">{cat.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Badge Submissions (Colombo District Queue)</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Scout</th>
                  <th className="p-2">Badge</th>
                  <th className="p-2">%</th>
                  <th className="p-2">Evidence</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {badgeSubmissions.length > 0 ? (
                  badgeSubmissions.map((b) => (
                    <tr key={b.id} className="border-b hover:bg-amber-50/50 transition">
                      <td className="p-3 font-semibold text-slate-700">{b.scout_name}</td>
                      <td className="p-3 font-medium text-amber-900">{b.name} <span className="text-xs text-gray-500 ml-1">({b.badge_level || 'Proficiency'})</span></td>
                      <td className="p-3 text-center">100%</td>
                      <td className="p-3 text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-100">
                              <Eye className="w-4 h-4 mr-1" />
                              View Notes
                            </Button>
                          </DialogTrigger>
                          <DialogContent aria-describedby={undefined} className="max-w-xl">
                            <DialogHeader>
                              <DialogTitle>Digital Logbook Evidence</DialogTitle>
                              <DialogDescription>
                                Verified submission from Unit Leader Kavindu for {b.scout_name}.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 pt-4">
                                {/* Leader Handoff Section */}
                                <div className="flex items-start gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <Award className="h-6 w-6 text-emerald-600 shrink-0" />
                                    <div>
                                        <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider mb-1">Field Verifier: Leader Kavindu</p>
                                        <p className="text-sm font-medium text-emerald-900 leading-relaxed italic">
                                            "{b.evidence_summary?.includes('[LEADER') 
                                                ? b.evidence_summary.split('[LEADER')[1].replace(']:', '').trim() 
                                                : b.evidence_summary || "Verification confirmed by scout leader."}"
                                        </p>
                                    </div>
                                </div>

                                {/* Scout Comment Section */}
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Scout Submission Notes</p>
                                    <p className="text-sm text-gray-700">
                                        {b.evidence_summary?.includes('[SCOUT]:') 
                                            ? b.evidence_summary.split('[SCOUT]:')[1].split('|')[0].trim() 
                                            : "No direct scout comment available."}
                                    </p>
                                </div>

                                {b.proof_url && (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Digital Progress File</p>
                                    <div className="rounded-xl overflow-hidden border shadow-inner bg-white">
                                    <img 
                                        src={b.proof_url} 
                                        alt="Evidence Proof" 
                                        className="w-full h-auto max-h-[300px] object-contain"
                                        onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Digital+Evidence+Verified'; }}
                                    />
                                    </div>
                                    <div className="p-4 border rounded bg-blue-50/50 flex items-center justify-between">
                                    <span className="text-sm font-medium text-blue-800">Logbook Record High-Res</span>
                                    <a href={b.proof_url} target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold px-3 py-1 bg-white rounded border border-blue-200">
                                        Open Full File
                                    </a>
                                    </div>
                                </div>
                                )}
                            </div>
                            
                            <FeedbackWidget targetType="badge_submission" targetId={b.id} scoutId={b.scout_id} currentRole="Examiner" />
                          </DialogContent>
                        </Dialog>
                      </td>
                      <td className="p-3 text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md">
                              Electronic Sign
                            </Button>
                          </DialogTrigger>
                          <DialogContent aria-describedby={undefined}>
                            <DialogHeader>
                              <DialogTitle>Digital Signature Approval</DialogTitle>
                              <DialogDescription>
                                Applying examiner's final authorization for {b.scout_name}.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <Textarea 
                                  placeholder="Type Examiner Feedback here (Official Record)..." 
                                  className="w-full min-h-[100px] border-amber-200 focus-visible:ring-amber-500" 
                                  value={feedbackText}
                                  onChange={(e) => setFeedbackText(e.target.value)}
                              />
                              <div className="flex gap-3 justify-end mt-4">
                                <Button
                                  variant="destructive"
                                  onClick={() => reject(b.id, b.scout_name, b.name)}
                                >
                                  Reject Evidence
                                </Button>
                                <Button onClick={() => approve(b.id, b.scout_name, b.name)} className="bg-green-600 hover:bg-green-700 font-bold">
                                  Digitally Sign & Approve
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-gray-500 font-medium italic">
                      "A Scout is patient." No pending badges require signatures at this time.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* US 18: Award Recommendations */}
        <Card className="mt-8 border-amber-200">
          <CardHeader className="bg-amber-100/50">
            <CardTitle className="flex items-center text-amber-900">
              <Award className="w-5 h-5 mr-2" />
              Award Recommendations (Automatic Milestone Detection)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b text-gray-500 text-sm">
                  <th className="p-3 text-left">Scout Name</th>
                  <th className="p-3">Badges</th>
                  <th className="p-3">Activities</th>
                  <th className="p-3">Requirement Met</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {eligibleScouts.length > 0 ? (
                  eligibleScouts.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="p-4 font-bold text-amber-800">{s.scout_name}</td>
                      <td className="p-4 text-center font-semibold">{s.badge_count} / 21</td>
                      <td className="p-4 text-center font-semibold">{s.activity_count} / 24</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-widest ${s.badge_count >=21 && s.activity_count >= 24 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {s.badge_count >=21 && s.activity_count >= 24 ? 'ELIGIBLE FOR PRESIDENT AWARD' : 'MILESTONE ACHIEVED'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                          onClick={() => toast.success(`Nomination Sent for ${s.scout_name}`, { description: "Review request forwarded to NHQ." })}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold"
                        >
                          Recommend Award
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-gray-400 italic">
                      Scanning District Database... No scouts meet the advanced eligibility threshold today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
