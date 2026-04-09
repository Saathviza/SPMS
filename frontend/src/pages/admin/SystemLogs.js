import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { adminService } from '../../services/api';
import { ArrowLeft, Clock, Activity, Shield, Download, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemLogs() {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const data = await adminService.getLogs();
            setLogs(data);
        } catch (err) {
            toast.error("Failed to load system logs");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-indigo-800">Reading logs...</div>;

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <div className="bg-slate-800 text-white p-6 shadow-md border-b-4 border-slate-700">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            onClick={() => navigate('/admin/dashboard')}
                            className="text-white hover:bg-white/10"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold font-mono">System Audit Logs</h1>
                            <p className="text-slate-400 text-sm">Security events, system operations, and database activity</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-8 max-w-7xl mx-auto w-full">
                <Card className="shadow-2xl border-none bg-slate-900 overflow-hidden">
                    <CardHeader className="bg-slate-800 border-slate-700 py-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-slate-200 text-sm font-mono flex items-center gap-2">
                             <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                             Live Stream
                        </CardTitle>
                        <div className="flex gap-2">
                           <span className="flex items-center gap-1.5 text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300 uppercase font-bold tracking-widest">
                               <Shield className="w-3 h-3" />
                               Secure
                           </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 bg-[#0a0f1d] font-mono text-[13px] text-green-500/90 leading-relaxed max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {logs.map(log => (
                            <div key={log.id} className="mb-3 hover:bg-white/5 p-2 rounded transition-colors group">
                                <span className="text-slate-500 text-[11px] mr-3 font-mono">[{log.timestamp}]</span>
                                <span className="text-indigo-400 font-bold mr-2 uppercase tracking-tighter">EVENT</span>
                                <span className="text-slate-200">{log.event}</span>
                                <span className="ml-2 text-slate-500 text-xs italic group-hover:text-green-300 transition-colors">via {log.user}</span>
                            </div>
                        ))}
                        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 text-slate-600">
                             <div className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse"></div>
                             Listening for system events...
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #0a0f1d; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
            `}} />
        </div>
    );
}
