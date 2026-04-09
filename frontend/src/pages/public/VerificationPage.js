import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, ShieldAlert, Award, Calendar, User, MapPin, ArrowLeft, Home, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function VerificationPage() {
    const { type, uuid } = useParams();
    const [status, setStatus] = useState('loading');
    const [certData, setCertData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const verifyCertificate = async () => {
            try {
                const endpoint = type === 'badge' ? `/verify/badge/${uuid}` : `/verify/milestone/${uuid}`;
                const response = await axios.get(`http://192.168.1.6:4000/api${endpoint}`);
                
                if (response.data.verified) {
                    setCertData(response.data.data);
                    setStatus('verified');
                } else {
                    setStatus('invalid');
                    setError(response.data.message);
                }
            } catch (err) {
                setStatus('invalid');
                setError(err.response?.data?.message || "This certificate cannot be verified at this time.");
            }
        };

        verifyCertificate();
    }, [type, uuid]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B5D1E] mb-4"></div>
                <p className="text-gray-500 font-medium italic">Verifying official SLSA records...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-xl mx-auto">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <img src="/logo192.png" alt="SLSA Logo" className="w-16 h-16 grayscale opacity-50" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight uppercase">Sri Lanka Scout Association</h1>
                    <p className="text-sm font-semibold text-gray-500 tracking-widest uppercase">Digital Performance Management System</p>
                </div>

                <Card className={`border-t-8 ${status === 'verified' ? 'border-[#0B5D1E]' : 'border-red-600'} shadow-2xl overflow-hidden rounded-2xl`}>
                    <CardContent className="p-0">
                        {status === 'verified' ? (
                            <div className="p-8 text-center bg-white">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 border-4 border-[#0B5D1E]/20 mb-6 animate-pulse">
                                    <ShieldCheck size={48} className="text-[#0B5D1E]" />
                                </div>
                                
                                <h2 className="text-3xl font-black text-gray-900 mb-2 leading-tight uppercase tracking-tighter">Verified Achievement</h2>
                                <p className="text-[#0B5D1E] font-bold text-sm uppercase tracking-widest mb-8">Official Digital Record Confirmed</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left border-y border-gray-100 py-8 my-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Achieved By</label>
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <User size={16} className="text-gray-400" />
                                            <span className="font-bold text-lg">{certData.scout_name}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{type === 'badge' ? 'Merit Badge' : 'Milestone Honour'}</label>
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <Award size={16} className="text-[#E6B800]" />
                                            <span className="font-bold text-lg">{certData.badge_name || certData.award_name}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">District/Group</label>
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <MapPin size={16} className="text-gray-400" />
                                            <span className="font-bold">{certData.group_name || "National Headquarters"}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completion Date</label>
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <Calendar size={16} className="text-gray-400" />
                                            <span className="font-bold">{new Date(certData.achieved_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 p-4 bg-green-50/50 rounded-xl border border-dashed border-green-200">
                                    <div className="flex items-start gap-3 text-left">
                                        <CheckCircle2 size={18} className="text-[#0B5D1E] mt-0.5 shrink-0" />
                                        <p className="text-xs text-green-800 font-medium leading-relaxed italic">
                                            This certificate is digitally signed and cryptographically linked to the central SLSA registry. It represents an official achievement recognized by the National Scout Headquarters.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-white">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-6">
                                    <ShieldAlert size={48} className="text-red-600" />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter">Verification Failed</h2>
                                <p className="text-red-600 font-bold text-sm uppercase tracking-widest mb-6">UNAUTHORIZED ACCESS</p>
                                
                                <Card className="bg-red-50 border-red-100 mb-8">
                                    <CardContent className="p-4">
                                        <p className="text-sm text-red-800 font-medium italic">
                                            {error}
                                        </p>
                                    </CardContent>
                                </Card>

                                <p className="text-xs text-gray-500 mb-8 leading-relaxed italic">
                                    If you believe this record is valid, please contact the Sri Lanka Scout Association headquarters or your District Commissioner for manual verification.
                                </p>
                            </div>
                        )}

                        <div className="bg-slate-50 p-6 flex flex-col sm:flex-row gap-3">
                            <Link to="/" className="flex-1">
                                <Button className="w-full bg-[#0B5D1E] hover:bg-green-800 font-black tracking-tight" size="lg">
                                    <Home className="w-4 h-4 mr-2" />
                                    PMS Home Portal
                                </Button>
                            </Link>
                            <Button variant="outline" className="flex-1 font-bold border-gray-300" onClick={() => window.print()}>
                                Print Verification Report
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-12 text-center text-gray-400 space-y-2">
                    <p className="text-[10px] uppercase font-black tracking-[0.3em]">Official Verification Authority</p>
                    <p className="text-[8px] font-medium">&copy; 2026 Sri Lanka Scout Association. All Rights Reserved.</p>
                </div>
            </div>
        </div>
    );
}
