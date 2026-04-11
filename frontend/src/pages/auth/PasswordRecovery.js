import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

import { Mail, CheckCircle } from 'lucide-react';
import { authService } from '../../services/api';

export default function PasswordRecovery() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // REAL backend call
      await authService.requestPasswordReset(email);

      // Always show success (security best practice)
      setSubmitted(true);
    } catch (err) {
      console.error('Password recovery error:', err);

      if (err.response) {
        setError(err.response.data?.message || 'Failed to send reset link');
      } else if (err.request) {
        setError('Server is unreachable');
      } else {
        setError('Unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative py-12">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2670")', // Dense green forest
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-sm" />

        <div className="relative z-10 w-full max-w-md px-4">
            <Card className="bg-white rounded-2xl shadow-2xl border-0 overflow-hidden">
              <CardContent className="p-10 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                   <CheckCircle className="w-10 h-10 text-[#0B5D1E]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Check your inbox</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  If an account exists for <b className="text-gray-800">{email}</b>, a reset link has been sent. Please check your spam folder if you don't receive it.
                </p>
                <Button 
                    onClick={() => navigate('/')}
                    className="w-full bg-[#0B5D1E] hover:bg-[#084516] text-white py-6 text-base font-semibold"
                >
                    Back to Login
                </Button>
              </CardContent>
            </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative py-12">
      {/* Background Image Setup */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2670")', // Dense green forest
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 z-0 bg-black/30 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-md px-4 flex flex-col items-center">
        
        {/* Top Header Area */}
        <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 bg-black/40 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/10">
                <Mail className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md">Password Recovery</h1>
            <p className="text-white/90 font-medium drop-shadow-md">Enter your email to reset your password</p>
        </div>

        {/* Main Card */}
        <Card className="w-full bg-white rounded-2xl shadow-2xl border-0 mb-6 py-4">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold text-[#0B5D1E] tracking-tight">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-gray-500 mt-2">
              We'll send you instructions to reset your password
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-800">Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                  className="bg-gray-50 border-gray-200 focus:border-[#0B5D1E] focus:ring-[#0B5D1E] h-12 text-base"
                />
              </div>

              <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0B5D1E] hover:bg-[#084516] text-white py-6 text-base font-semibold shadow-md"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
              </div>

              <div className="pt-4 text-center">
                  <p className="text-gray-500 text-sm mb-1">Remember your password?</p>
                  <button 
                     type="button"
                     onClick={() => navigate('/')} 
                     className="text-[#0B5D1E] font-bold text-sm hover:underline hover:text-green-800 transition-colors"
                  >
                      Back to Login
                  </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Bottom Help Card */}
        <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-5 text-center px-8 border border-white">
            <p className="text-sm text-gray-600 leading-relaxed">
                💡 <span className="font-bold text-[#0B5D1E]">Need help?</span> Contact your Scout Leader or system administrator for assistance.
            </p>
        </div>

      </div>
    </div>
  );
}
