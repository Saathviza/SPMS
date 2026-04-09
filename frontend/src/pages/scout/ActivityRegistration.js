import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  ArrowLeft, Calendar, MapPin, Clock, Search,
  CheckCircle2, Info, Compass, Tent, ShieldAlert, HeartHandshake,
  Upload, FileText, Image as ImageIcon, X
} from "lucide-react";
import { toast } from "sonner";
import { activityService, scoutService } from '../../services/api';
import { getSocket, connectSocket } from '../../services/socket';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "../../components/ui/dialog";

const ACTIVITY_IMAGES = {
  'Camp': 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800',
  'Training': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
  'Service': 'https://images.unsplash.com/photo-1559027615-cd169c59d9b4?w=800',
  'Adventure': 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
  'Other': 'https://images.unsplash.com/photo-1501503060473-757345330a84?w=800'
};

function ActivityRegistration() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activities, setActivities] = useState([]);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredActivity, setRegisteredActivity] = useState("");
  const [registeredActivityId, setRegisteredActivityId] = useState(null);
  
  // Submit Proof States
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState([]);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  useEffect(() => {
    // 1) Initial Data Fetcher
    const fetchActivities = async () => {
      try {
        const [allData, myData] = await Promise.all([
          activityService.getAll(),
          scoutService.getMyActivities()
        ]);
        setActivities(allData);
        setRegisteredIds(new Set(myData.map(a => a.id)));
      } catch (err) {
        console.error("Error fetching activities:", err);
        toast.error("Failed to load available activities");
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();

    // 2) Autopilot Real-Time Refresher!
    connectSocket('scout');
    const socket = getSocket();
    
    // Listen for incoming Admin Overrides
    const handleGlobalUpdate = () => {
       console.log("Global Activity Catalog has been altered by Admin! Retooling instantly.");
       fetchActivities(); // Refresh silently
    };

    if (socket) {
        socket.on('global:activities:changed', handleGlobalUpdate);
    }

    return () => {
        if (socket) {
            socket.off('global:activities:changed', handleGlobalUpdate);
        }
    };
  }, []);

  const handleRegister = async (activityId, activityName) => {
    try {
      const response = await activityService.register({ activity_id: activityId });
      toast.success(response.message || `Successfully registered for ${activityName}!`, {
        description: "You've been successfully enrolled.",
        icon: <CheckCircle2 className="h-5 w-5" />
      });
      setRegisteredActivity(activityName);
      setRegisteredActivityId(activityId);
      setRegisteredIds(prev => new Set([...prev, activityId]));
      setShowSuccess(true);
    } catch (err) {
      console.error("Registration error:", err);
      const errorMsg = err.response?.data?.message || "Registration failed";
      toast.error(errorMsg);
      
      // If already registered, update state to reflect reality
      if (errorMsg.includes("already registered")) {
        setRegisteredIds(prev => new Set([...prev, activityId]));
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmitProof = async () => {
    if (!comment.trim() && files.length === 0) {
      toast.error("Please provide a comment or upload evidence.");
      return;
    }

    setIsSubmittingProof(true);
    try {
      const formData = new FormData();
      formData.append('activity_id', registeredActivityId);
      formData.append('comment', comment);
      files.forEach(file => {
        formData.append('files', file);
      });

      await activityService.submitProof(formData);
      
      toast.success("Proof submitted successfully!", {
        description: "A leader will review your submission shortly."
      });
      
      setShowSubmitModal(false);
      setComment("");
      setFiles([]);
      setShowSuccess(false); // Close the original success dialog too
    } catch (err) {
      console.error("Proof submission error:", err);
      toast.error("Failed to submit proof");
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const filteredActivities = activities.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.activity_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mb-4"></div>
        <p className="text-green-700 font-medium">Loading Scouting Adventures...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50/30">
      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-3xl">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle2 className="w-16 h-16 text-green-600 animate-bounce" />
              </div>
            </div>
            <DialogTitle className="text-center text-3xl font-black text-gray-900">Registration Successful!</DialogTitle>
            <DialogDescription className="text-center text-gray-600 text-lg mt-2">
              <span className="block font-bold text-green-700 text-xl mb-2">Congratulations!</span>
              You have successfully registered for <span className="font-extrabold text-[#0B5D1E]">{registeredActivity}</span>.
              <span className="block mt-2 font-medium">You are one step closer to completing your achievements.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-3 mt-6">
            <Button
              onClick={() => {
                setShowSuccess(false);
                setShowSubmitModal(true);
              }}
              className="bg-[#0B5D1E] hover:bg-green-800 text-white py-8 text-xl font-bold rounded-2xl shadow-lg border-2 border-green-400"
            >
              <Upload className="w-6 h-6 mr-2" /> Submit Proof Now
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSuccess(false)}
              className="py-6 rounded-2xl border-2 font-bold"
            >
              Do it Later
            </Button>
            <Button
              variant="link"
              onClick={() => navigate('/scout/dashboard')}
              className="text-gray-500 font-bold"
            >
              Back to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Proof Submission Modal */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent className="sm:max-w-xl bg-white rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-gray-900">Submit Activity Proof</DialogTitle>
            <DialogDescription className="text-lg">
              Upload your evidence for <span className="text-green-700 font-bold">{registeredActivity}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">What did you learn? (Activity Comments)</label>
              <textarea
                className="w-full min-h-[120px] p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all placeholder:text-gray-300 text-lg font-medium"
                placeholder="Describe your achievements and learning outcomes during this activity..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Evidence Files (Photos, PDFs, Certificates)</label>
              <div className="flex flex-wrap gap-3 mb-4">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm font-bold border border-green-100 group">
                    {file.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                    {file.name.slice(0, 15)}...
                    <button onClick={() => removeFile(index)} className="ml-2 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="relative">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-[2rem] cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all group"
                >
                  <Upload className="w-8 h-8 text-gray-300 group-hover:text-green-600 mb-2" />
                  <span className="font-bold text-gray-400 group-hover:text-green-800">Choose Evidence Files</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-8 rounded-[1.5rem] font-bold text-lg border-2"
              >
                Cancel
              </Button>
              <Button
                disabled={isSubmittingProof}
                onClick={handleSubmitProof}
                className="flex-[2] bg-[#0B5D1E] hover:bg-green-800 text-white py-8 rounded-[1.5rem] font-black text-xl shadow-xl shadow-green-900/20"
              >
                {isSubmittingProof ? "Submitting..." : "Submit Proof Now"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-gradient-to-r from-[#0B5D1E] to-[#084516] text-white p-12 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate("/scout/dashboard")}
                className="text-green-100 hover:text-white hover:bg-white/10 mb-6 border border-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
              </Button>
              <h1 className="text-5xl font-black tracking-tighter">Activity Portal</h1>
              <p className="text-green-100 mt-3 text-xl font-medium italic opacity-90">"Be Prepared for your next adventure."</p>
            </div>
            <div className="hidden lg:block opacity-20">
              <Compass className="w-40 h-40 text-white rotate-12" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 -mt-12">
        <Card className="mb-12 shadow-2xl border-0 overflow-hidden rounded-3xl">
          <CardContent className="p-0">
            <div className="relative group">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors w-6 h-6" />
              <Input
                className="pl-20 py-10 text-2xl border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 font-medium"
                placeholder="Search by keywords, locations, or activity types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {filteredActivities.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] shadow-xl border border-gray-100">
            <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">No Activities Found</h3>
            <p className="text-gray-400 text-lg max-w-md mx-auto">We couldn't find anything matching your search. Try different keywords or browse our full list.</p>
            <Button variant="ghost" className="mt-8 text-green-700 font-bold hover:bg-green-50" onClick={() => setSearchQuery("")}>
              Clear Search filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredActivities.map((a) => (
              <Card key={a.id} className="group overflow-hidden border-0 shadow-xl hover:shadow-[0_20px_50px_rgba(11,93,30,0.15)] transition-all duration-500 rounded-[2.5rem] flex flex-col bg-white">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={a.image_url || ACTIVITY_IMAGES[a.activity_type] || ACTIVITY_IMAGES['Other']}
                    alt={a.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-6 left-6">
                    <span className="bg-white/95 backdrop-blur px-5 py-2 rounded-2xl text-xs font-black text-[#0B5D1E] shadow-xl flex items-center uppercase tracking-widest">
                      {(a.activity_type === 'CAMPING' || a.activity_type === 'Camp') && <Tent className="w-4 h-4 mr-2" />}
                      {(a.activity_type === 'SERVICE' || a.activity_type === 'Service') && <HeartHandshake className="w-4 h-4 mr-2" />}
                      {(a.activity_type === 'TRAINING' || a.activity_type === 'Training') && <ShieldAlert className="w-4 h-4 mr-2" />}
                      {a.activity_type}
                    </span>
                  </div>
                </div>

                <div className="p-8 flex-grow flex flex-col">
                  <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-[#0B5D1E] transition-colors leading-tight">
                    {a.name}
                  </h3>

                  <div className="space-y-3 mb-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex-grow">
                    <div className="flex items-center text-sm font-bold text-gray-600">
                      <div className="bg-white p-1.5 rounded-lg shadow-sm mr-3">
                        <Calendar className="w-4 h-4 text-[#0B5D1E]" />
                      </div>
                      {new Date(a.session_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center text-sm font-bold text-gray-600">
                      <div className="bg-white p-1.5 rounded-lg shadow-sm mr-3">
                        <Clock className="w-4 h-4 text-[#0B5D1E]" />
                      </div>
                      {a.session_time || "Morning Session"}
                    </div>
                    <div className="flex items-center text-sm font-bold text-gray-600">
                      <div className="bg-white p-1.5 rounded-lg shadow-sm mr-3">
                        <MapPin className="w-4 h-4 text-[#0B5D1E]" />
                      </div>
                      {a.location}
                    </div>
                  </div>

                  {a.caption && (
                    <p className="text-[#0B5D1E] font-bold italic mb-6 text-sm px-2">
                      "{a.caption}"
                    </p>
                  )}

                  <Button
                    disabled={registeredIds.has(a.id)}
                    className={`w-full py-8 rounded-[1.5rem] font-black text-xl shadow-xl transition-all mt-auto ${
                      registeredIds.has(a.id) 
                        ? "bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed shadow-none" 
                        : "bg-[#0B5D1E] hover:bg-green-800 text-white shadow-green-900/30 active:scale-95"
                    }`}
                    onClick={() => handleRegister(a.id, a.name)}
                  >
                    {registeredIds.has(a.id) ? (
                      <span className="flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 mr-2" /> Registered
                      </span>
                    ) : "Register Now"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityRegistration;

