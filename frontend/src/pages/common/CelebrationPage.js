import { useNavigate, useLocation } from 'react-router-dom';
import { Award, Download, Share2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import ConfettiAnimation from '../../components/ConfettiAnimation';
import { toast } from 'sonner';

export default function CelebrationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const awardName = location.state?.awardName || "President's Scout Award";
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Confetti Animation */}
      <ConfettiAnimation />

      {/* Background with sunrise and Sri Lanka flag */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2000")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-orange-900/50 via-green-900/60 to-black/70" />

      <div className="relative z-10 text-center px-6 max-w-3xl">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-2xl">
          {/* Golden Badge Emblem */}
          <div className="mb-8 animate-bounce">
            <div className="inline-block p-6 bg-gradient-to-br from-[#E6B800] to-[#d4a600] rounded-full shadow-2xl">
              <Award size={100} className="text-white" />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-[#0B5D1E] mb-4">
            🎉 Congratulations! 🎉
          </h1>

          <p className="text-2xl text-gray-800 mb-2">
            <span className="font-bold text-[#E6B800]">{user.name || 'Scout'}</span>
          </p>

          <p className="text-xl text-gray-700 mb-8">
            You have achieved the <strong>{awardName}</strong>!
          </p>

          <div className="bg-gradient-to-r from-green-50 to-yellow-50 border-2 border-[#E6B800] rounded-lg p-6 mb-8">
            <p className="text-gray-800 italic">
              "This achievement represents your dedication, leadership, and commitment to the Scout values.
              You are now part of an elite group of scouts who have reached this milestone.
              Continue to lead by example and inspire others!"
            </p>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={() => {
                toast.success("Ready to Share!", {
                  description: "Achievement link copied to clipboard. Share your excellence with the world!",
                });
              }}
              className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 flex items-center gap-2 rounded-xl font-bold"
            >
              <Share2 size={20} />
              Share Achievement
            </Button>

            <Button
              onClick={() => {
                const printContent = `
                  <div style="font-family: sans-serif; padding: 50px; border: 15px solid #0B5D1E; text-align: center; color: #084516; background: #fff;">
                    <h1 style="font-size: 48px; margin-bottom: 20px;">CERTIFICATE OF ACHIEVEMENT</h1>
                    <p style="font-size: 24px;">This is to certify that</p>
                    <h2 style="font-size: 36px; text-decoration: underline;">${user.name || 'Scout'}</h2>
                    <p style="font-size: 20px;">has successfully achieved the</p>
                    <h3 style="font-size: 32px; color: #E6B800;">${awardName}</h3>
                    <p style="margin-top: 50px;">A Scout is always ready to serve.</p>
                    <p style="margin-top: 20px;">Issued on: ${new Date().toLocaleDateString()}</p>
                  </div>
                `;
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`<html><head><title>Certificate</title></head><body>${printContent}</body></html>`);
                printWindow.document.close();
                printWindow.print();
                toast.success("Certificate generated", { description: "You can now print or save your achievement certificate." });
              }}
              className="bg-[#E6B800] text-[#0B5D1E] hover:bg-[#d4a600] px-6 py-3 flex items-center gap-2 rounded-xl font-bold shadow-lg"
            >
              <Download size={20} />
              Download Certificate
            </Button>

            <Button
              onClick={() => navigate('/scout/dashboard')}
              className="bg-[#0B5D1E] text-white hover:bg-[#084516] px-6 py-3"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div >
  );
}
