import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Upload, CheckCircle, Clock } from "lucide-react";
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

function ActivityTracking({ navigate }) {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [comment, setComment] = useState("");

  const activities = [
    {
      id: 1,
      name: "Tree Planting Campaign",
      status: "Completed",
      observedBy: "Leader John Silva",
      date: "Oct 14, 2025",
      statusColor: "text-green-600",
      icon: CheckCircle,
    },
    {
      id: 2,
      name: "First Aid Training",
      status: "Completed",
      observedBy: "Examiner Mary Fernando",
      date: "Oct 12, 2025",
      statusColor: "text-green-600",
      icon: CheckCircle,
    },
    {
      id: 3,
      name: "Community Service",
      status: "Pending",
      observedBy: "Leader John Silva",
      date: "Oct 10, 2025",
      statusColor: "text-yellow-600",
      icon: Clock,
    },
  ];

  const handleSubmitProof = () => {
    if (!selectedActivity) return;

    toast.success("Proof submitted successfully!", {
      description: "Your activity evidence has been sent for review.",
    });

    setSelectedActivity(null);
    setComment("");
  };

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <div className="bg-green-700 text-white py-6 px-6">
        <Button variant="ghost" onClick={() => navigate("scout-dashboard")}>
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
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Activity</th>
                  <th>Status</th>
                  <th>Observed By</th>
                  <th>Date</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => {
                  const StatusIcon = activity.icon;

                  return (
                    <tr
                      key={activity.id}
                      className="border-b hover:bg-green-50"
                    >
                      <td className="py-3">{activity.name}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <StatusIcon
                            className={`w-4 h-4 ${activity.statusColor}`}
                          />
                          <span className={activity.statusColor}>
                            {activity.status}
                          </span>
                        </div>
                      </td>
                      <td>{activity.observedBy}</td>
                      <td>{activity.date}</td>
                      <td className="text-center">
                        {activity.status === "Pending" ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() =>
                                  setSelectedActivity(activity.name)
                                }
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                Submit Proof
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Submit Activity Proof
                                </DialogTitle>
                                <DialogDescription>
                                  Upload evidence for {activity.name}
                                </DialogDescription>
                              </DialogHeader>

                              <Textarea
                                placeholder="Additional comments..."
                                value={comment}
                                onChange={(e) =>
                                  setComment(e.target.value)
                                }
                              />

                              <Button
                                className="w-full mt-4"
                                onClick={handleSubmitProof}
                              >
                                Submit
                              </Button>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-green-600 flex justify-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ActivityTracking;
