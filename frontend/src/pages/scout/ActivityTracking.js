import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Upload, CheckCircle, Clock, AlertCircle, FileText, Image as ImageIcon, X } from "lucide-react";
import { scoutService, authService, activityService } from '../../services/api';
import { connectSocket, getSocket } from '../../services/socket';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { toast } from "sonner";

function ActivityTracking() {
  const navigate = useNavigate();
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const user = authService.getCurrentUser();
      if (!user) {
        navigate('/');
        return;
      }
      const data = await scoutService.getMyActivities();
      setActivities(data);
    } catch (err) {
      console.error("Error fetching activities:", err);
      toast.error("Failed to load activities");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    // ── Socket listener ────────────────────────────────────────────
    connectSocket('scout');
    const socket = getSocket();
    const handleRefresh = () => fetchActivities(false);
    
    socket.on('my:activities:changed', handleRefresh);
    socket.on('proof:approved', handleRefresh);
    socket.on('proof:rejected', handleRefresh);

    return () => {
      socket.off('my:activities:changed', handleRefresh);
      socket.off('proof:approved', handleRefresh);
      socket.off('proof:rejected', handleRefresh);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmitProof = async () => {
    if (!selectedActivity || (!comment.trim() && files.length === 0)) {
      toast.error("Please provide some notes or evidence for the activity");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('activity_id', selectedActivity.id);
      formData.append('comment', comment);
      files.forEach(file => {
        formData.append('files', file);
      });

      await activityService.submitProof(formData);

      toast.success("Proof submitted successfully!", {
        description: "Your activity evidence has been sent for review.",
      });

      // Refresh data
      const updatedData = await scoutService.getMyActivities();
      setActivities(updatedData);

      setSelectedActivity(null);
      setComment("");
      setFiles([]);
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Failed to submit proof. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusInfo = (status) => {
    const s = String(status || '').toUpperCase();
    switch (s) {
      case 'COMPLETED':
      case 'APPROVED':
      case 'VERIFIED':
        return { color: 'text-green-600', icon: CheckCircle, label: 'Verified' };
      case 'PENDING':
      case 'SUBMITTED':
        return { color: 'text-amber-600', icon: CheckCircle, label: 'Submitted' };
      case 'IN_PROGRESS':
        return { color: 'text-blue-600', icon: Clock, label: 'Under Review' };
      case 'REGISTERED':
      case 'ATTENDED':
      case 'ENROLLED':
        return { color: 'text-blue-600', icon: Clock, label: 'Registered' };
      case 'REJECTED':
      case 'CANCELLED':
        return { color: 'text-red-600', icon: AlertCircle, label: 'Refused' };
      default:
        return { color: 'text-gray-500', icon: Clock, label: status || 'Unknown' };
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <div className="bg-green-700 text-white py-6 px-6">
        <Button variant="ghost" onClick={() => navigate("/scout/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1>Activity Tracking</h1>
        <p className="text-green-100">
          Monitor your activity participation and submissions
        </p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>My Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-center py-10 text-gray-500">No activities found.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Activity</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => {
                    let displayStatus = activity.status || 'Registered';
                    
                    // Priority: Submission > Tracking > Registration
                    if (activity.submission_status) {
                      displayStatus = activity.submission_status;
                    } else if (activity.tracking_status === 'COMPLETED') {
                      displayStatus = 'COMPLETED';
                    }

                    const statusInfo = getStatusInfo(displayStatus);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <tr
                        key={activity.registration_id}
                        className="border-b hover:bg-green-50"
                      >
                        <td className="py-3 font-medium">{activity.activity_name}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <StatusIcon
                              className={`w-4 h-4 ${statusInfo.color}`}
                            />
                            <span className={statusInfo.color}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </td>
                        <td>{new Date(activity.session_date).toLocaleDateString()}</td>
                        <td>{activity.location}</td>
                        <td className="text-center">
                          {['ENROLLED', 'REGISTERED', 'ATTENDED', 'PENDING'].includes(String(displayStatus || '').toUpperCase()) ? (
                            (() => {
                              const activityDate = new Date(activity.session_date);
                              const today = new Date();
                              // Reset hours for accurate date comparison
                              today.setHours(0, 0, 0, 0);
                              activityDate.setHours(0, 0, 0, 0);
                              
                              const isFuture = activityDate > today;

                              return isFuture ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Button
                                    size="sm"
                                    disabled
                                    className="bg-gray-200 text-gray-500 cursor-not-allowed opacity-70"
                                  >
                                    <Clock className="w-4 h-4 mr-1" />
                                    Not Started
                                  </Button>
                                  <span className="text-[10px] text-gray-400 font-medium">Available after {activityDate.toLocaleDateString()}</span>
                                </div>
                              ) : (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="bg-[#0B5D1E] hover:bg-green-800"
                                      onClick={() => setSelectedActivity(activity)}
                                    >
                                      <Upload className="w-4 h-4 mr-1" />
                                      Submit Proof
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Submit Activity Proof</DialogTitle>
                                      <DialogDescription>
                                        Upload evidence for {activity.activity_name}
                                      </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                      <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Comments / What you learned</label>
                                        <Textarea
                                          placeholder="What did you learn? Describe your experience..."
                                          value={comment}
                                          className="min-h-[120px] rounded-xl border-gray-200"
                                          onChange={(e) => setComment(e.target.value)}
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Evidence Files</label>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                          {files.map((f, i) => (
                                            <div key={i} className="flex items-center bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold border group">
                                              {f.type.startsWith('image/') ? <ImageIcon className="w-3 h-3 mr-2 text-green-600" /> : <FileText className="w-3 h-3 mr-2 text-blue-600" />}
                                              {f.name.slice(0, 10)}...
                                              <button onClick={() => removeFile(i)} className="ml-2 hover:text-red-500">
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="relative">
                                          <input type="file" multiple id="track-file-up" className="hidden" onChange={handleFileChange} />
                                          <label htmlFor="track-file-up" className="w-full h-24 flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                            <Upload className="w-6 h-6 text-gray-300" />
                                            <span className="text-sm font-bold text-gray-400">Add Evidence Files</span>
                                          </label>
                                        </div>
                                      </div>
                                    </div>

                                    <Button
                                      className="w-full mt-4 bg-[#0B5D1E] hover:bg-green-800 h-12 text-lg font-bold rounded-xl"
                                      onClick={handleSubmitProof}
                                    >
                                      Submit Final Evidence
                                    </Button>
                                  </DialogContent>
                                </Dialog>
                              );
                            })()
                          ) : (
                            <span className="text-green-600 font-black flex justify-center items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              {statusInfo.label}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ActivityTracking;
