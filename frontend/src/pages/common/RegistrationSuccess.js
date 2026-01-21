import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function RegistrationSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const name = location.state?.name || 'Scout';

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background with sunrise and Sri Lanka flag */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2000")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-orange-900/60 via-green-900/70 to-black/80" />

      <div className="relative z-10 text-center px-6 max-w-2xl">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-12 shadow-2xl">
          <CheckCircle className="mx-auto text-green-600 mb-6 animate-bounce" size={80} />

          <h1 className="text-4xl font-bold text-[#0B5D1E] mb-4">
            🎉 Registration Successful!
          </h1>

          <p className="text-lg text-gray-700 mb-2">
            Thank you, <span className="font-bold text-[#E6B800]">{name}</span>!
          </p>

          <p className="text-gray-600 mb-8">
            Your registration request has been sent to your Scout Leader for approval.
            You will receive an email notification once your account is activated.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 text-left">
            <p className="text-sm text-blue-800">
              <strong>Next Steps:</strong>
              <br />
              • Your Scout Leader will review your application
              <br />
              • Once approved, you can log in and start your scouting journey
              <br />
              • Check your email for updates
            </p>
          </div>

          <Button
            onClick={() => navigate('/scout-login')}
            className="bg-[#0B5D1E] text-white hover:bg-[#084516] px-8 py-3 text-lg"
          >
            Go to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
