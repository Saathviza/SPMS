import React, { useState, useEffect, useRef } from 'react';
import { feedbackService } from '../services/api';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { User, MessageSquare } from 'lucide-react';

export default function FeedbackWidget({ targetType, targetId, scoutId, currentRole }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    if (targetId && targetType) {
      fetchFeedbacks();
    }
  }, [targetType, targetId]);

  const fetchFeedbacks = async () => {
    try {
      const data = await feedbackService.getFeedback(targetType, targetId);
      setFeedbacks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const scrollToBottom = () => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await feedbackService.addFeedback(targetType, targetId, message, scoutId);
      setMessage('');
      fetchFeedbacks();
      toast.success("Feedback sent!");
    } catch (err) {
      toast.error("Failed to send feedback");
    }
  };

  return (
    <div className="flex flex-col border rounded-md bg-white overflow-hidden shadow-sm mt-4">
      <div className="bg-gray-100 p-2 font-semibold text-sm flex items-center border-b">
        <MessageSquare className="w-4 h-4 mr-2" /> Discussion & Feedback
      </div>
      
      <div className="p-3 max-h-48 overflow-y-auto w-full bg-slate-50 space-y-3">
        {loading ? (
           <p className="text-xs text-gray-400">Loading...</p>
        ) : feedbacks.length === 0 ? (
           <p className="text-xs text-gray-400 text-center italic">No feedback yet. Start the conversation!</p>
        ) : (
          feedbacks.map((f, i) => (
            <div key={i} className={`flex flex-col text-sm ${f.author_role === currentRole ? 'items-end' : 'items-start'}`}>
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> {f.author_name} ({f.author_role})
              </div>
              <div className={`p-2 rounded-lg max-w-[85%] whitespace-pre-wrap ${f.author_role === currentRole ? 'bg-amber-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                {f.message}
              </div>
            </div>
          ))
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-2 border-t bg-white flex gap-2">
        <Textarea 
          className="min-h-[40px] resize-none text-sm p-2 w-full border-gray-300"
          placeholder="Write direct feedback to the scout..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button size="sm" onClick={handleSend} className="bg-amber-600 hover:bg-amber-700 self-end">Send</Button>
      </div>
    </div>
  );
}
