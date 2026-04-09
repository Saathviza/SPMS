import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Award, CheckCircle, Clock, Trophy, CheckCircle2, Medal, Download } from 'lucide-react';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { scoutService, authService } from '../../services/api';
import { getSocket } from '../../services/socket';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';

export default function BadgeProgress() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("completed");
  const [badgeData, setBadgeData] = useState({
    completed: [],
    pending: [],
    eligible: []
  });

  // Proof submission state
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState("");
  
  // Syllabus state
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);
  const [syllabusData, setSyllabusData] = useState([]);
  const [fetchingSyllabus, setFetchingSyllabus] = useState(false);

  // Certificate state
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [certData, setCertData] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const user = authService.getCurrentUser();
        if (!user) {
          navigate('/');
          return;
        }
        setUserData(user);
        const data = await scoutService.getBadges(user.id);

        const completed = data.filter(b =>
          ['Awarded', 'Completed', 'COMPLETED'].includes(b.status)
        );
        const pending = data.filter(b =>
          ['Pending', 'In Progress', 'PENDING', 'REJECTED', 'Rejected'].includes(b.status)
        );
        const eligible = data.filter(b =>
          ['Eligible', 'ELIGIBLE'].includes(b.status)
        );

        setBadgeData({ completed, pending, eligible });
      } catch (err) {
        console.error("Error fetching badges:", err);
        toast.error("Failed to load badge progress");
      } finally {
        setLoading(false);
      }
    };
    fetchBadges();

    // 🔴 NEW: Real-time Socket.io Tracker
    const socket = getSocket();
    if (socket) {
      const handleBadgeChange = (data) => {
        const user = authService.getCurrentUser();
        // Ignore if event belongs to another scout
        if (data && data.scout_id && user && data.scout_id !== user.id && data.scout_id !== user.user_id) return;
        
        toast.success("Real-Time Update", {
          description: `An Examiner just reviewed your badge: ${data?.badge_name || 'Application'}!`,
          icon: <Award className="h-5 w-5 text-green-500" />
        });
        
        // Re-fetch to instantly animate the UI
        fetchBadges();
      };

      socket.on('badge:status:changed', handleBadgeChange);
      
      return () => {
        socket.off('badge:status:changed', handleBadgeChange);
      };
    }
  }, [navigate]);

  const submitEvidence = async () => {
    if (!selectedBadge) return;
    try {
      await scoutService.applyForBadge(selectedBadge.id, submissionNotes);
      toast.success(`Evidence Submitted: ${selectedBadge.name}`, {
        description: "Your digital logbook entry was sent to the Examiner.",
        icon: <CheckCircle className="h-5 w-5 text-green-500" />
      });
      setIsSubmitOpen(false);
      setSubmissionNotes("");
      setSelectedBadge(null);
      
      // Refresh list
      const user = authService.getCurrentUser();
      const data = await scoutService.getBadges(user.id);
      const completed = data.filter(b => ['Awarded', 'Completed', 'COMPLETED'].includes(b.status));
      const pending = data.filter(b => ['Pending', 'In Progress', 'PENDING', 'SUBMITTED', 'REJECTED', 'Rejected'].includes(b.status));
      const eligible = data.filter(b => ['Eligible', 'ELIGIBLE'].includes(b.status));
      setBadgeData({ completed, pending, eligible });
    } catch (err) {
      toast.error("Failed to submit digital evidence.");
      console.error(err);
    }
  };

  const openSyllabus = async (badge) => {
    setSelectedBadge(badge);
    setIsSyllabusOpen(true);
    setFetchingSyllabus(true);
    try {
       const data = await scoutService.getBadgeSyllabus(badge.id || badge.badge_id);
       setSyllabusData(data);
    } catch (err) {
       toast.error("Failed to load badge syllabus details.");
    } finally {
       setFetchingSyllabus(false);
    }
  };

  const openCertificate = (badge) => {
    setCertData({
      scoutName: userData?.name || userData?.email?.split('@')[0] || 'Scout',
      badgeName: badge.name,
      date: badge.awarded_at || badge.achieved_date || new Date().toISOString(),
      examiner: "District Commissioner",
      leader: "Troop Leader",
      uuid: badge.certificate_uuid || `MOCK-${badge.id}-${Math.floor(Math.random()*1000)}`
    });
    setIsCertOpen(true);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100">
      {/* Header */}
      <div
        className="bg-gradient-to-r from-[#0B5D1E] to-green-700 text-white py-6 px-4 md:px-8 shadow-lg"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(11, 93, 30, 0.95), rgba(5, 150, 105, 0.95)), url(https://images.unsplash.com/photo-1673734609283-4154fa4be954?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080)',
          backgroundSize: 'cover',
          backgroundBlendMode: 'overlay',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={() => navigate('/scout/dashboard')}
            variant="ghost"
            className="mb-4 text-white hover:text-[#E6B800] hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1>Badge Progress & Results</h1>
          <p className="text-green-100">
            Track your achievements and badge journey
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Overview (Now Fully Clickable!) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
             icon={Award} value={badgeData.completed.length} label="Badges Earned" gradient="from-[#E6B800] to-amber-600" 
             onClick={() => setActiveTab('completed')}
          />
          <StatCard 
             icon={Clock} value={badgeData.pending.length} label="In Progress" gradient="from-yellow-500 to-amber-500" 
             onClick={() => setActiveTab('pending')}
          />
          <StatCard 
             icon={Trophy} value={badgeData.eligible.length} label="Awards Eligible" gradient="from-purple-500 to-purple-600" 
             onClick={() => setActiveTab('eligible')}
          />
        </div>

        {/* Tabs */}
        <Card className="shadow-xl">
          <CardContent className="p-6">
            <Tabs>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger 
                   value="completed" 
                   data-state={activeTab === 'completed' ? 'active' : 'inactive'}
                   onClick={() => setActiveTab('completed')}
                >
                  Completed ({badgeData.completed.length})
                </TabsTrigger>
                <TabsTrigger 
                   value="pending"
                   data-state={activeTab === 'pending' ? 'active' : 'inactive'}
                   onClick={() => setActiveTab('pending')}
                >
                  In Progress ({badgeData.pending.length})
                </TabsTrigger>
                <TabsTrigger 
                   value="eligible"
                   data-state={activeTab === 'eligible' ? 'active' : 'inactive'}
                   onClick={() => setActiveTab('eligible')}
                >
                  Awards Eligible ({badgeData.eligible.length})
                </TabsTrigger>
              </TabsList>

              {/* Completed */}
              {activeTab === 'completed' && (
              <TabsContent value="completed">
                {badgeData.completed.length === 0 ? (
                  <p className="text-center py-10 text-gray-500">No completed badges yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {badgeData.completed.map((badge, i) => {
                      const uniqueKey = badge.id ? `comp-${badge.id}` : `comp-idx-${i}`;
                      return (
                        <Card key={uniqueKey} className="hover:scale-105 transition-all">
                          <CardContent className="p-6 text-center">
                            <div className={`w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto flex items-center justify-center mb-4 text-white shadow-lg`}>
                              <Award size={40} />
                            </div>
                             <h3 className="font-bold text-[#0B5D1E]">{badge.name}</h3>
                             <p className="text-sm text-gray-500 mb-4">{badge.awarded_at || badge.achieved_date ? new Date(badge.awarded_at || badge.achieved_date).toLocaleDateString() : 'Recent'}</p>
                             <div className="flex flex-col gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full text-xs font-bold border-green-600 text-green-700"
                                  onClick={() => openSyllabus(badge)}
                                >
                                  View Pass Details
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="w-full text-xs font-bold bg-[#E6B800] hover:bg-amber-500 text-black shadow-sm"
                                  onClick={() => openCertificate(badge)}
                                >
                                  <Medal className="w-3 h-3 mr-1" /> View Certificate
                                </Button>
                             </div>
                           </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              )}

              {/* In Progress Only */}
              {activeTab === 'pending' && (
              <TabsContent value="pending">
                {badgeData.pending.length === 0 ? (
                  <p className="text-center py-10 text-gray-500">No badges currently in progress.</p>
                ) : (
                  <div className="space-y-6">
                    {badgeData.pending.map((badge, i) => {
                      const progressValue = badge.completion_percentage || 25;
                      const uniqueKey = badge.id ? `pend-${badge.id}` : `pend-idx-${i}`;
                      return (
                        <Card key={uniqueKey} className="border-l-4 border-amber-400">
                          <CardContent className="p-6">
                            <div className="flex justify-between mb-2">
                              <div>
                                <h3 className="font-bold text-gray-800">{badge.name}</h3>
                                <p className={`text-sm font-medium ${badge.status === 'PENDING' ? 'text-blue-600' : 'text-gray-600'}`}>
                                  {badge.status === 'PENDING' ? 'Awaiting Examiner Signature ⏳' : (badge.status || 'In Progress')}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className="text-amber-700 font-bold">{progressValue}%</span>
                                {badge.status !== 'PENDING' && (
                                  <Dialog open={isSubmitOpen && selectedBadge?.id === (badge.badge_id || badge.id)} onOpenChange={(open) => {
                                    if (!open) {
                                      setIsSubmitOpen(false);
                                      setSelectedBadge(null);
                                    } else {
                                      setSelectedBadge({ id: badge.badge_id || badge.id, name: badge.name });
                                      setIsSubmitOpen(true);
                                    }
                                  }}>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="outline" className="border-amber-600 text-amber-700 hover:bg-amber-50 shadow-sm mt-1">
                                        Upload Proof Log
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Submit Digital Logbook Evidence</DialogTitle>
                                        <DialogDescription>
                                          Provide notes, links, or file descriptions for your <strong>{badge.name}</strong> tasks. 
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4 pt-4">
                                        <Textarea 
                                          placeholder="Type your logbook entry here... (e.g. 'I led the hike on April 1st')" 
                                          className="w-full min-h-[150px] border-amber-200 focus-visible:ring-amber-500"
                                          value={submissionNotes}
                                          onChange={(e) => setSubmissionNotes(e.target.value)}
                                        />
                                        <div className="flex gap-3 justify-end mt-4">
                                          <Button variant="outline" onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
                                          <Button className="bg-amber-600 hover:bg-amber-700 font-bold text-white" onClick={submitEvidence} disabled={!submissionNotes.trim()}>
                                            Submit Proof to Examiner
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </div>
                            </div>
                            <Progress value={progressValue} className={`h-3 mb-2 ${badge.status === 'PENDING' ? 'bg-blue-100' : ''}`} />
                            <div className="flex justify-between items-center mt-3 text-gray-500">
                               <p className="text-xs italic flex-1 mr-4">
                                {badge.status === 'PENDING' ? "Awaiting Examiner Signature." : (badge.description || "Progressing...")}
                               </p>
                               <Button variant="ghost" size="sm" className="text-xs font-bold text-amber-700 bg-amber-50 h-7" onClick={() => openSyllabus(badge)}>
                                 View Checklist
                               </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              )}

              {/* Awards Eligible Only */}
              {activeTab === 'eligible' && (
              <TabsContent value="eligible">
                {badgeData.eligible.length === 0 ? (
                  <p className="text-center py-10 text-gray-500">No eligible awards at this time.</p>
                ) : (
                  <div className="space-y-6">
                    {badgeData.eligible.map((badge, i) => {
                      const progressValue = badge.completion_percentage || 85;
                      const uniqueKey = badge.id ? `elig-${badge.id}` : `elig-idx-${i}`;
                      return (
                        <Card key={uniqueKey} className="border-l-4 border-purple-500 bg-purple-50/30">
                          <CardContent className="p-6">
                            <div className="flex justify-between mb-2">
                              <div>
                                <h3 className="font-bold text-gray-800">{badge.name}</h3>
                                <p className="text-sm text-purple-700 font-black">ELIGIBLE FOR AWARD</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className="text-purple-700 font-bold">{progressValue}%</span>
                                <Dialog open={isSubmitOpen && selectedBadge?.id === (badge.badge_id || badge.id)} onOpenChange={(open) => {
                                  if (!open) {
                                    setIsSubmitOpen(false);
                                    setSelectedBadge(null);
                                  } else {
                                    setSelectedBadge({ id: badge.badge_id || badge.id, name: badge.name });
                                    setIsSubmitOpen(true);
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-700 font-bold shadow-md"
                                    >
                                      Submit Evidence
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Submit Digital Logbook Evidence</DialogTitle>
                                      <DialogDescription>
                                        You are applying for the <strong>{badge.name}</strong>. Provide your notes, proof links, or logbook entry below for the Badge Examiner.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                      <Textarea 
                                        placeholder="Type your logbook entry here. (e.g. 'I led the patrol hike on April 1st...' or paste a Google Drive link to your photos)" 
                                        className="w-full min-h-[150px] border-purple-200 focus-visible:ring-purple-500"
                                        value={submissionNotes}
                                        onChange={(e) => setSubmissionNotes(e.target.value)}
                                      />
                                      <div className="flex gap-3 justify-end mt-4">
                                        <Button variant="outline" onClick={() => setIsSubmitOpen(false)}>
                                          Cancel
                                        </Button>
                                        <Button className="bg-purple-600 hover:bg-purple-700 font-bold" onClick={submitEvidence} disabled={!submissionNotes.trim()}>
                                          Submit the Proof
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                            <Progress value={progressValue} className="h-3 mb-2 bg-purple-200" />
                            <p className="text-gray-500 text-sm italic">{badge.description || 'You are eligible to apply for this award.'}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {/* Pending ones after */}
                    {badgeData.pending.map((badge, i) => {
                      const progressValue = badge.completion_percentage || 25;
                      const uniqueKey = badge.id ? `pend-${badge.id}` : `pend-idx-${i}`;
                      return (
                        <Card key={uniqueKey} className="border-l-4 border-amber-400">
                          <CardContent className="p-6">
                            <div className="flex justify-between mb-2">
                              <div>
                                <h3 className="font-bold text-gray-800">{badge.name}</h3>
                                <p className="text-sm text-gray-600 font-medium">{badge.status || 'Pending Review'}</p>
                              </div>
                              <span className="text-amber-700 font-bold">{progressValue}%</span>
                            </div>
                            <Progress value={progressValue} className="h-3 mb-2" />
                            <p className="text-gray-500 text-sm italic">{badge.description || 'Complete the required activities to earn this merit.'}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
               )}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isSyllabusOpen} onOpenChange={setIsSyllabusOpen}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-3xl overflow-hidden border-0 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-600 to-amber-400"></div>
          <DialogHeader className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-green-700">
                <Award size={30} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-gray-900">{selectedBadge?.name} Syllabus</DialogTitle>
                <DialogDescription className="text-green-700 font-bold text-sm">Official Digital Progress Book Check-off</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 max-h-[60vh] overflow-y-auto px-1">
            {fetchingSyllabus ? (
              <div className="flex justify-center py-10"><div className="animate-spin h-8 w-8 border-b-2 border-green-700 rounded-full"></div></div>
            ) : (
              <div className="space-y-3">
                {syllabusData.map((req, idx) => (
                  <div key={req.requirement_id || idx} className={`p-4 rounded-2xl border-2 transition-all flex items-start gap-4 ${req.status === 'COMPLETED' ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}>
                    <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${req.status === 'COMPLETED' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-300'}`}>
                      {req.status === 'COMPLETED' ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 bg-gray-300 rounded-full"></div>}
                    </div>
                    <div>
                      <h5 className={`font-bold text-sm leading-tight ${req.status === 'COMPLETED' ? 'text-green-900' : 'text-gray-800'}`}>{req.title}</h5>
                      <p className={`text-xs mt-1 ${req.status === 'COMPLETED' ? 'text-green-700' : 'text-gray-500'}`}>{req.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-6 border-t mt-4 flex justify-end">
            <Button className="bg-[#0B5D1E] hover:bg-green-800 font-bold px-8" onClick={() => setIsSyllabusOpen(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 📜 DIGITAL MERIT BADGE CERTIFICATE MODAL */}
      <Dialog open={isCertOpen} onOpenChange={setIsCertOpen}>
        <DialogContent className="max-w-4xl max-h-[98vh] bg-[#fdfaf2] border-[12px] border-[#0B5D1E] p-0 shadow-2xl rounded-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Merit Badge Certificate</DialogTitle>
            <DialogDescription>Official digital certification for {certData?.badgeName}</DialogDescription>
          </DialogHeader>
          <div className="p-4 relative" id="printable-certificate">
            {/* Elegant Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0B5D1E 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
            
            {/* Certificate Border Details */}
            <div className="border border-[#0B5D1E]/20 p-4">
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-1">
                  <img src="/logo.png" alt="Logo" className="w-16 h-16" onError={(e) => e.target.style.display='none'} />
                </div>
                
                <h1 className="text-2xl font-serif font-black text-[#0B5D1E] uppercase tracking-[0.1em] mb-1 underline underline-offset-4">
                  Sri Lanka Scout Association
                </h1>
                
                <p className="text-md font-serif text-gray-600 italic">This is to certify that the merit badge for</p>
                
                <div className="py-1">
                  <h2 className="text-3xl font-serif font-black text-[#8B5E34] mb-1">
                    {certData?.badgeName}
                  </h2>
                  <div className="h-0.5 w-48 bg-gradient-to-r from-transparent via-[#E6B800] to-transparent mx-auto"></div>
                </div>

                <p className="text-md font-serif text-gray-600 italic">has been officially awarded to</p>
                
                <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-dashed border-gray-300 inline-block px-8 py-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {certData?.scoutName}
                </h3>

                <p className="text-xs font-medium text-gray-500 max-w-md mx-auto py-2 leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Having satisfied the district examiner in all requirements prescribed in the 
                  official syllabus and demonstrated the skills and scouting character.
                </p>

                <div className="flex justify-between items-center mt-4 px-8 relative">
                   {/* Signature 1 */}
                   <div className="text-center w-40 relative z-20">
                      <p className="text-[24px] font-['Dancing_Script'] text-gray-800 leading-none mb-1 translate-y-2" style={{ fontFamily: "'Dancing Script', cursive" }}>
                        {certData?.leader}
                      </p>
                      <div className="border-t border-gray-400 pt-1">
                         <p className="text-[8px] uppercase font-black tracking-widest text-[#0B5D1E]">Unit Leader</p>
                      </div>
                   </div>

                   {/* Golden Seal (Compact Watermark) */}
                   <div className="absolute left-1/2 -translate-x-1/2 -translate-y-2 transform scale-75 opacity-90 transition-transform duration-500 z-10">
                      <div className="w-20 h-20 bg-[#E6B800] rounded-full shadow-md border-2 border-white flex items-center justify-center relative overflow-hidden">
                         <div className="absolute inset-2 border-2 border-dashed border-white/40 rounded-full"></div>
                         <Award className="text-white w-10 h-10 relative z-10" />
                         <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent"></div>
                      </div>
                   </div>

                   {/* Signature 2 */}
                   <div className="text-center w-40 relative z-20">
                      <p className="text-[24px] font-['Dancing_Script'] text-gray-800 leading-none mb-1 translate-y-2" style={{ fontFamily: "'Dancing Script', cursive" }}>
                        {certData?.examiner}
                      </p>
                      <div className="border-t border-gray-400 pt-1">
                         <p className="text-[8px] uppercase font-black tracking-widest text-[#0B5D1E]">District Examiner</p>
                      </div>
                   </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                   <div className="text-left">
                      <p className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">OFFICIAL DATE: {certData?.date && new Date(certData.date).toLocaleDateString()}</p>
                      <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">VERIFIED ID: {certData?.uuid?.substring(0, 8).toUpperCase()}</p>
                   </div>
                   <div className="bg-white p-1 rounded shadow-sm flex items-center justify-center">
                      <QRCodeCanvas 
                         value={`http://192.168.1.6:3000/verify/badge/${certData?.uuid}`}
                         size={50}
                         bgColor={"#ffffff"}
                         fgColor={"#000000"}
                         level={"H"}
                      />
                   </div>
                </div>
              </div>
            </div>
          </div>


          <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCertOpen(false)}>Close</Button>
            <Button 
                className="bg-[#0B5D1E] hover:bg-green-800 font-bold"
                onClick={() => window.print()}
            >
              <Download className="w-4 h-4 mr-2" />
              Download / Print PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}


/* Small reusable stat card with onClick hook */
function StatCard({ icon: Icon, value, label, gradient, onClick }) {
  return (
    <Card 
      className={`shadow-lg transition-transform hover:shadow-2xl ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6 text-center">
        <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-full mx-auto flex items-center justify-center mb-3`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-900 text-3xl font-black">{value}</p>
        <p className="text-gray-600 font-bold tracking-tight">{label}</p>
      </CardContent>
    </Card>
  );
}
