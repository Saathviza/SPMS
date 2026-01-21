import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Users,
  Activity,
  FileText,
  LogOut,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

export default function LeaderDashboard() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [section, setSection] = useState('scouts');

  const scouts = [
    { id: 1, name: 'Kavindu Perera', progress: 85, eligibility: 90 },
    { id: 2, name: 'Anushka Silva', progress: 72, eligibility: 75 },
  ];

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-green-800 text-white p-6 flex justify-between">
        <div>
          <h1>Scout Leader Dashboard</h1>
          <p>Welcome, {state?.name || 'Leader'}</p>
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

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white p-4 shadow-lg">
          {[
            { id: 'scouts', label: 'Scouts', icon: Users },
            { id: 'activities', label: 'Activities', icon: Activity },
            { id: 'reports', label: 'Reports', icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded mb-2 ${
                  section === item.id
                    ? 'bg-amber-600 text-white'
                    : 'hover:bg-amber-50'
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
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2">Progress</th>
                      <th className="p-2">Eligibility</th>
                      <th className="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scouts.map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="p-2">{s.name}</td>
                        <td className="p-2 text-center">{s.progress}%</td>
                        <td className="p-2 text-center">{s.eligibility}%</td>
                        <td className="p-2 text-center">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {section === 'reports' && (
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={() => toast.success('Monthly Report downloaded')}>
                  Download Monthly Report
                </Button>
                <Button onClick={() => toast.success('Badge Report downloaded')}>
                  Download Badge Report
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

