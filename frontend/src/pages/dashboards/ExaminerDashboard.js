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

export default function ExaminerDashboard() {
  const navigate = useNavigate();
  const { state } = useLocation(); // examiner data

  const [badgeSubmissions, setBadgeSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState("");

  const fetchPendingBadges = async () => {
    try {
      const data = await examinerService.getPendingBadges();
      setBadgeSubmissions(data);
    } catch (err) {
      toast.error('Failed to load pending badges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBadges();
  }, []);

  const stats = {
    pending: badgeSubmissions.length,
    approved: 0,
    rejected: 0,
    total: badgeSubmissions.length,
  };

  const approve = async (id, scout, badge) => {
    try {
      await examinerService.approveBadge({ id, feedback: feedbackText || 'Badge approved' });
      toast.success(`Badge Approved: ${badge}`, {
        description: `Digital Signature applied. ${scout}'s ${badge} badge is official!`,
        icon: <Award className="h-5 w-5" />
      });
      setFeedbackText("");
      fetchPendingBadges();
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
      fetchPendingBadges();
    } catch (err) {
      toast.error('Failed to reject badge');
    }
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-amber-600 text-white p-6 flex justify-between">
        <div>
          <h1>Badge Examiner Dashboard</h1>
          <p>Welcome, {state?.name || 'Examiner'}</p>
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
            { label: 'Pending', value: stats.pending, icon: Clock },
            { label: 'Approved', value: stats.approved, icon: CheckCircle },
            { label: 'Rejected', value: stats.rejected, icon: XCircle },
            { label: 'Total', value: stats.total, icon: Award },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={i}>
                <CardContent className="p-6 text-center">
                  <Icon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xl">{s.value}</p>
                  <p className="text-gray-600">{s.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Badge Submissions</CardTitle>
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
                      <td className="p-3 font-semibold">{b.scout_name}</td>
                      <td className="p-3">{b.name} <span className="text-xs text-gray-500 ml-1">({b.badge_level})</span></td>
                      <td className="p-3 text-center">100%</td>
                      <td className="p-3 text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-100">
                              <Eye className="w-4 h-4 mr-1" />
                              View Notes
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Submitted Progress Book Evidence</DialogTitle>
                              <DialogDescription>
                                Proof submitted directly from the Scout's Digital Logbook.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="p-4 bg-gray-50 rounded-md border text-sm text-gray-700 font-medium whitespace-pre-wrap">
                              {b.evidence_summary || "No notes provided. (Refer to physical copies if necessary)"}
                            </div>
                            {b.proof_url && (
                              <div className="mt-4 p-4 border rounded bg-blue-50">
                                <a href={b.proof_url} target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">
                                  View Attached Proof File
                                </a>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </td>
                      <td className="p-3 text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md">
                              Review & Sign
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Digital Signature Approval</DialogTitle>
                              <DialogDescription>
                                This digital approval replaces the physical progress record book signature for {b.scout_name}.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <Textarea 
                                  placeholder="Type Examiner Feedback here (Required if rejecting)..." 
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
      </div>
    </div>
  );
}
