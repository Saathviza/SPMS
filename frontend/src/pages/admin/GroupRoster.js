import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { adminService } from '../../services/api';
import { ArrowLeft, Users, Shield, Award, Calendar, Mail, Search, Printer } from 'lucide-react';
import { toast } from 'sonner';

export default function GroupRoster() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [roster, setRoster] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRoster();
    }, [id]);

    const fetchRoster = async () => {
        try {
            const data = await adminService.getGroupRoster(id);
            setRoster(data);
        } catch (err) {
            toast.error("Failed to load group roster");
        } finally {
            setLoading(false);
        }
    };

    const filteredRoster = roster
        .filter(s => 
            s.scout_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.leader_name && s.leader_name.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => a.id - b.id); // Original/Earlier scouts at the top

    if (loading) return <div className="p-8 text-center text-amber-800">Loading detailed roster...</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <div className="bg-amber-900 text-white p-6 shadow-xl sticky top-0 z-10 border-b-4 border-amber-600">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            onClick={() => navigate('/admin/groups')}
                            className="text-white hover:bg-white/10"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight">Group Roster</h1>
                            <p className="text-amber-100/70 text-sm">Showing {filteredRoster.length} active scouts in this group</p>
                        </div>
                    </div>
                    
                    <div className="flex bg-white/10 rounded-full px-4 py-2 border border-white/20 w-full max-w-md items-center">
                        <Search className="w-4 h-4 text-amber-100 mr-2" />
                        <input 
                            type="text" 
                            placeholder="Search by scout or assigned leader..."
                            className="bg-transparent border-none text-white placeholder:text-amber-200/50 focus:ring-0 text-sm w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                        <Printer className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                <Card className="shadow-2xl border-none overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#1e293b] text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                                    <tr>
                                        <th className="px-6 py-4">Scout Information</th>
                                        <th className="px-6 py-4">Assigned Leader</th>
                                        <th className="px-6 py-4 text-center">Achievements</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {filteredRoster.map(scout => (
                                        <tr key={scout.id} className="hover:bg-amber-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-black shadow-sm group-hover:bg-amber-700 group-hover:text-white transition-all">
                                                        {scout.scout_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 leading-tight">{scout.scout_name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Mail className="w-3 h-3 text-slate-400" />
                                                            <span className="text-xs text-slate-500">{scout.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {scout.leader_name ? (
                                                    <div className="flex items-center gap-2 text-slate-700">
                                                        <Shield className="w-4 h-4 text-green-600" />
                                                        <span className="font-semibold text-sm">{scout.leader_name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Not Assigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold text-xs">
                                                    <Award className="w-3 h-3" />
                                                    {scout.badge_count} Badges
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${scout.status === 'ACTIVE' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                                <span className="text-xs font-bold text-slate-600">{scout.status}</span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => navigate(`/scout/profile/${scout.user_id || scout.id}`)}
                                                    className="text-amber-800 hover:text-amber-900 hover:bg-amber-100 font-bold text-[10px] uppercase"
                                                >
                                                    Profile
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
