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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';

export default function ExaminerDashboard() {
  const navigate = useNavigate();
  const { state } = useLocation(); // examiner data

  const badgeSubmissions = [
    { id: 1, scout: 'Kavindu Perera', badge: 'First Aid', completion: 95 },
    { id: 2, scout: 'Anushka Silva', badge: 'Leadership', completion: 88 },
    { id: 3, scout: 'Nimali Fernando', badge: 'Environment', completion: 92 },
  ];

  const stats = {
    pending: badgeSubmissions.length,
    approved: 32,
    rejected: 3,
    total: 40,
  };

  const approve = (scout, badge) =>
    toast.success(`${badge} approved for ${scout}`);

  const reject = (scout, badge) =>
    toast.error(`${badge} rejected for ${scout}`);

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
                {badgeSubmissions.map((b) => (
                  <tr key={b.id} className="border-b">
                    <td className="p-2">{b.scout}</td>
                    <td className="p-2">{b.badge}</td>
                    <td className="p-2 text-center">{b.completion}</td>
                    <td className="p-2 text-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Evidence Review</DialogTitle>
                          </DialogHeader>
                          <Textarea placeholder="Comments..." />
                        </DialogContent>
                      </Dialog>
                    </td>
                    <td className="p-2 flex gap-2 justify-center">
                      <Button size="sm" onClick={() => approve(b.scout, b.badge)}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => reject(b.scout, b.badge)}
                      >
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
