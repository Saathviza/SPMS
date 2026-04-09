import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  ArrowLeft, CheckCircle, Clock, Trophy,
  Download, Share2, AlertCircle, Send,
  PartyPopper, ExternalLink, Award,
  Facebook, Twitter, Linkedin, Github,
  FileBadge, CheckSquare, Sparkles,
  ChevronRight,
  Printer, Activity, TrendingUp, HeartHandshake
} from 'lucide-react';
import { Progress } from '../../components/ui/progress';
import { scoutService, authService } from '../../services/api';
import { getSocket } from '../../services/socket';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";

export default function AwardEligibility() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmissionPortal, setShowSubmissionPortal] = useState(false);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    badges_earned: 0,
    activities_completed: 0,
    required_badges: 10,
    required_activities: 20,
    service_project_completed: false,
    final_assessment_completed: false
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = authService.getCurrentUser();
        if (!user) {
          navigate('/');
          return;
        }
        setUserData(user);
        const data = await scoutService.getDashboardConfig();
        
        setStats(prev => ({
          ...prev,
          badges_earned: data.badges_earned || 0,
          activities_completed: data.activities_completed || 0,
        }));
      } catch (err) {
        console.error("Error fetching award stats:", err);
        toast.error("Failed to load eligibility data");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    // 🔴 NEW: Real-time Master WebSockets Listener
    const socket = getSocket();
    if (socket) {
      const handleBadgeChange = (data) => {
        const user = authService.getCurrentUser();
        if (data && data.scout_id && user && data.scout_id !== user.id && data.scout_id !== user.user_id) return;
        
        if (data && data.status === 'APPROVED') {
            toast.success("Progression Milestone Reached!", {
              description: `A badge was just awarded to you. Your overall eligibility matrix has jumped forward in real-time!`,
              icon: <Trophy className="h-5 w-5 text-amber-500" />
            });
        }
        fetchStats();
      };

      const handleActivitiesChanged = () => {
        fetchStats();
      };

      const handleApprovedProof = (data) => {
        toast.success("Progression Milestone Reached!", {
          description: `An activity was just approved by your examiner. Your eligibility progress bar has advanced in real-time!`,
          icon: <Activity className="h-5 w-5 text-blue-500" />
        });
        fetchStats();
      };

      socket.on('badge:status:changed', handleBadgeChange);
      socket.on('my:activities:changed', handleActivitiesChanged);
      socket.on('proof:approved', handleApprovedProof);
      
      return () => {
        socket.off('badge:status:changed', handleBadgeChange);
        socket.off('my:activities:changed', handleActivitiesChanged);
        socket.off('proof:approved', handleApprovedProof);
      };
    }
  }, [navigate]);

  const badgeProgress = Math.min(100, (stats.badges_earned / stats.required_badges) * 100);
  const activityProgress = Math.min(100, (stats.activities_completed / stats.required_activities) * 100);
  const serviceProgress = stats.service_project_completed ? 100 : 0;
  const assessmentProgress = stats.final_assessment_completed ? 100 : 0;

  const overallProgress = (badgeProgress + activityProgress + serviceProgress + assessmentProgress) / 4;

  const handleFormalApplication = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Application Submitted Successfully!", {
        description: "Your formal application for the President's Scout Award has been sent to the National Headquarters.",
      });
      setIsSubmitting(false);
      setShowSubmissionPortal(false);
    }, 3000);
  };

  const handleDownload = () => {
    const printContent = `
        <div style="font-family: 'Inter', sans-serif; padding: 50px; border: 20px solid #0B5D1E; text-align: center; color: #084516;">
            <h1 style="font-size: 50px; margin-bottom: 20px; font-weight: 900;">CERTIFICATE OF ELIGIBILITY</h1>
            <p style="font-size: 20px; margin-bottom: 40px;">This is to certify that</p>
            <h2 style="font-size: 40px; text-decoration: underline; margin-bottom: 40px;">${userData?.name || 'Scout'}</h2>
            <p style="font-size: 20px; margin-bottom: 40px;">has achieved</p>
            <h3 style="font-size: 30px; color: #E6B800; font-weight: 800;">${Math.round(overallProgress)}% ELIGIBILITY</h3>
            <p style="font-size: 18px; line-height: 1.6;">For the pursuit of the <b>President's Scout Award</b>.<br/>Registered Scout ID: ${userData?.id || 'N/A'}</p>
            <div style="margin-top: 100px; display: flex; justify-content: space-around;">
                <div>___________________<br/>National Commissioner</div>
                <div>___________________<br/>District Leader</div>
            </div>
            <p style="margin-top: 50px; font-size: 12px; color: #666;">Issued on: ${new Date().toLocaleDateString()}</p>
        </div>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>Certificate - ${userData?.name}</title></head><body>${printContent}</body></html>`);
    printWindow.document.close();
    printWindow.print();
    toast.success("Certificate generated", { description: "You can now print or save your eligibility certificate." });
  };

  const handleShare = () => {
    toast.success("Ready to Share!", {
      description: "Achievement link copied to clipboard. Share your excellence with the world!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B5D1E] mb-4"></div>
        <p className="text-[#0B5D1E] font-black tracking-widest uppercase text-sm">Validating Your Progress...</p>
      </div>
    );
  }

  const sections = [
    { title: 'Advanced Badges', progress: badgeProgress, current: stats.badges_earned, required: stats.required_badges, status: badgeProgress === 100 ? 'Completed' : 'Developing', icon: Award, color: 'bg-amber-500' },
    { title: 'Activity Engagement', progress: activityProgress, current: stats.activities_completed, required: stats.required_activities, status: activityProgress === 100 ? 'Completed' : 'Active', icon: Activity, color: 'bg-blue-600' },
    { title: 'Service Projects', progress: serviceProgress, current: stats.service_project_completed ? 1 : 0, required: 1, status: serviceProgress === 100 ? 'Completed' : 'Pending', icon: HeartHandshake, color: 'bg-red-500' },
    { title: 'Final Assessment', progress: assessmentProgress, current: stats.final_assessment_completed ? 1 : 0, required: 1, status: assessmentProgress === 100 ? 'Completed' : 'Locked', icon: CheckSquare, color: 'bg-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-[#F0FDF4] pb-24">
      {/* Formal Submission Portal Dialog */}
      <Dialog open={showSubmissionPortal} onOpenChange={setShowSubmissionPortal}>
        <DialogContent className="sm:max-w-[600px] bg-white rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          <div className="bg-[#0B5D1E] p-8 text-white relative">
            <Trophy className="absolute top-4 right-4 w-24 h-24 opacity-10" />
            <DialogHeader>
              <DialogTitle className="text-3xl font-black mb-2">President's Award Submission</DialogTitle>
              <DialogDescription className="text-green-100 text-lg">
                You are moments away from submitting your formal application. Please confirm your details.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Scout Name</p>
                <p className="font-black text-gray-800">{userData?.name}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Registration ID</p>
                <p className="font-black text-gray-800">SLS-{userData?.id || '001'}</p>
              </div>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4">
              <Sparkles className="text-amber-500 w-8 h-8 flex-shrink-0" />
              <p className="text-sm text-amber-900 leading-tight">
                By submitting, you certify that all activity logs, community service records, and merit badge requirements have been completed with scouting integrity.
              </p>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowSubmissionPortal(false)} className="rounded-xl px-8 py-6">Cancel</Button>
              <Button
                onClick={handleFormalApplication}
                disabled={isSubmitting}
                className="bg-[#0B5D1E] hover:bg-green-800 text-white rounded-xl px-12 py-6 font-bold text-lg flex-1 shadow-lg shadow-green-900/20"
              >
                {isSubmitting ? "Processing Application..." : "Confirm & Submit Portal"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B5D1E] to-[#084516] text-white py-16 px-8 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <Button
              onClick={() => navigate('/scout/dashboard')}
              variant="ghost"
              className="mb-8 text-green-100 hover:text-white hover:bg-white/10 border border-white/20 rounded-full px-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Base
            </Button>
            <h1 className="text-6xl font-black tracking-tighter mb-4">Award Eligibility</h1>
            <p className="text-green-100 text-2xl font-medium tracking-tight opacity-90 max-w-xl leading-snug">
              Mapping your journey to the <span className="text-amber-400 font-black italic">President's Scout Award</span>.
            </p>
          </div>
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2.5rem] shadow-2xl min-w-[320px]">
            <div className="flex items-center gap-6">
              <div className="p-5 bg-amber-400 rounded-3xl text-[#0B5D1E] shadow-xl animate-pulse">
                <Trophy className="w-12 h-12" />
              </div>
              <div>
                <p className="text-xs uppercase font-black tracking-[0.2em] text-green-200 mb-1">Current Eligibility</p>
                <h2 className="text-5xl font-black text-white">{Math.round(overallProgress)}%</h2>
              </div>
            </div>
            <div className="mt-6 h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: `${overallProgress}%` }}></div>
            </div>
          </Card>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Progress Breakdown */}
          <div className="lg:col-span-8 space-y-10">
            <Card className="shadow-2xl border-0 overflow-hidden rounded-[3rem] bg-white">
              <CardHeader className="bg-gray-50/50 p-10 border-b border-gray-100">
                <CardTitle className="text-3xl font-black text-gray-900 flex items-center gap-4">
                  <div className="bg-[#0B5D1E] p-2 rounded-xl text-white">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  Progress Visualization
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {sections.map((section, idx) => {
                    const Icon = section.icon;
                    return (
                      <div key={idx} className="group p-8 rounded-[2rem] border-2 border-gray-50 hover:border-green-100 hover:bg-green-50/20 transition-all duration-500">
                        <div className="flex items-start justify-between mb-6">
                          <div className={`p-4 rounded-2xl ${section.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-sm ${section.progress === 100 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {section.status}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-gray-800 mb-4">{section.title}</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-end text-sm">
                            <p className="font-bold text-gray-400">{section.current} / {section.required}</p>
                            <p className="font-black text-[#0B5D1E]">{Math.round(section.progress)}%</p>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-[1500ms] ${section.progress === 100 ? section.color : 'bg-gray-300'}`}
                              style={{ width: `${section.progress > 0 ? section.progress : 2}%` }} // Floor at 2% for visual
                            ></div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl rounded-[3rem] bg-gradient-to-br from-[#0B5D1E] to-[#084516] text-white overflow-hidden p-0 relative group">
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-[2000ms]">
                <FileBadge className="w-64 h-64" />
              </div>
              <CardContent className="p-12 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="bg-white/20 p-8 rounded-[2.5rem] backdrop-blur-md shadow-2xl">
                    <Award className="w-16 h-16 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black mb-4">The President's Endorsement</h3>
                    <p className="text-green-50/80 text-xl leading-relaxed font-medium">
                      Keep your digital folio updated. Once you hit 100%, our National Review Board will process your formal application for the highest honor in Sri Lankan Scouting.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Portal Actions */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-gray-50 p-8">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <Send className="w-5 h-5 text-[#0B5D1E]" />
                  Submission Portal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                  Final submission will unlock once your digital verification hits <span className="text-[#0B5D1E] font-black">100% eligibility</span>.
                </p>
                <Button
                  onClick={() => setShowSubmissionPortal(true)}
                  disabled={overallProgress < 100}
                  className={`w-full py-10 rounded-2xl font-black text-xl transition-all shadow-2xl ${overallProgress >= 100
                    ? 'bg-[#0B5D1E] hover:bg-green-800 text-white shadow-green-900/30'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed scale-95 opacity-80'
                    }`}
                >
                  <FileBadge className="w-6 h-6 mr-3" />
                  Submit Request
                </Button>
                {overallProgress < 100 && (
                  <div className="flex flex-col items-center gap-3 mt-8 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-700 text-center">
                      REQUIRE 100% TO UNLOCK
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Celebrate Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between py-8 px-6 text-gray-700 hover:bg-green-50 border-2 rounded-2xl group"
                    >
                      <div className="flex items-center font-bold">
                        <Share2 className="w-5 h-5 mr-4 text-[#0B5D1E]" />
                        Share Achievement
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4 rounded-2xl shadow-2xl border-0">
                    <div className="grid grid-cols-4 gap-2">
                      <Button variant="ghost" className="p-2 h-auto hover:bg-blue-50 text-blue-600 rounded-xl" onClick={handleShare}><Facebook /></Button>
                      <Button variant="ghost" className="p-2 h-auto hover:bg-sky-50 text-sky-500 rounded-xl" onClick={handleShare}><Twitter /></Button>
                      <Button variant="ghost" className="p-2 h-auto hover:bg-blue-50 text-blue-700 rounded-xl" onClick={handleShare}><Linkedin /></Button>
                      <Button variant="ghost" className="p-2 h-auto hover:bg-gray-50 text-gray-900 rounded-xl" onClick={handleShare}><Github /></Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full justify-between py-8 px-6 text-gray-700 hover:bg-green-50 border-2 rounded-2xl group"
                >
                  <div className="flex items-center font-bold">
                    <Printer className="w-5 h-5 mr-4 text-[#0B5D1E]" />
                    Download Certificate
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                </Button>

                <div className="pt-8 mt-4 border-t border-gray-100">
                  <Button
                    onClick={() => navigate('/scout/dashboard')}
                    variant="ghost"
                    className="w-full py-4 text-gray-400 hover:text-[#0B5D1E] hover:bg-green-50 rounded-2xl font-bold"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="p-8 text-center bg-white/50 backdrop-blur rounded-[2rem]">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3">
                <PartyPopper className="w-4 h-4 text-green-700" />
                EST. 1912 • SRI LANKA
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


