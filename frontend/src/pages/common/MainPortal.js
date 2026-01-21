import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { User, Users, Award, Shield, ArrowRight } from 'lucide-react';

export default function MainPortal() {
  const navigate = useNavigate();

  const roles = [
    {
      title: 'Scout Login',
      desc: 'Access your profile, progress, and badges.',
      icon: User,
      path: '/scout-login', // Fixed path to match App.js
      color: 'bg-green-100 text-green-700',
      hoverBorder: 'hover:border-green-500'
    },
    {
      title: 'Leader Login',
      desc: 'Manage your troop, approve activities.',
      icon: Users,
      path: '/leader-login',
      color: 'bg-blue-100 text-blue-700',
      hoverBorder: 'hover:border-blue-500'
    },
    {
      title: 'Examiner Login',
      desc: 'Evaluate badge requirements and progress.',
      icon: Award,
      path: '/examiner-login',
      color: 'bg-amber-100 text-amber-700',
      hoverBorder: 'hover:border-amber-500'
    },
    {
      title: 'Admin Login',
      desc: 'System administration and reporting.',
      icon: Shield,
      path: '/admin-login',
      color: 'bg-purple-100 text-purple-700',
      hoverBorder: 'hover:border-purple-500'
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-black font-sans">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-40 transform scale-105"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1534330207526-9e4e3b7d11f2?q=80&w=2000")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(4px)',
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">

        {/* Hero Section */}
        <div className="text-center mb-16 max-w-3xl animate-fade-in-up">
          <div className="inline-block p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-6">
            <img
              src="https://cdn-icons-png.flaticon.com/512/2317/2317963.png"
              alt="Logo"
              className="w-16 h-16 drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-200 to-teal-400 mb-6 drop-shadow-sm">
            Sri Lanka Scout SPMS
          </h1>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-light mb-6">
            Performance Management System. <br />
            <span className="text-white/80">Empowering the next generation of leaders.</span>
          </p>
          <div className="flex gap-4 justify-center text-sm">
            <button
              onClick={() => navigate('/scout-registration')}
              className="px-6 py-2 bg-[#E6B800] text-[#0B5D1E] font-semibold rounded-lg hover:bg-[#d4a600] transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              New Scout? Create Account
            </button>
            <button
              onClick={() => navigate('/password-recovery')}
              className="px-6 py-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl animate-fade-in-up delay-100">
          {roles.map((r, index) => (
            <Card
              key={r.title}
              onClick={() => navigate(r.path)}
              className={`group relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl ${r.hoverBorder}`}
            >
              {/* Hover Gradient Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <CardHeader className="relative pt-8 pb-4">
                <div className={`w-14 h-14 ${r.color} rounded-2xl flex items-center justify-center mb-4 text-2xl shadow-lg transition-transform group-hover:scale-110`}>
                  <r.icon className="w-7 h-7" />
                </div>
                <CardTitle className="text-xl text-white font-bold tracking-tight">
                  {r.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="relative">
                <p className="text-sm text-gray-400 mb-6 min-h-[40px]">
                  {r.desc}
                </p>
                <div className="flex items-center text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                  Login Access
                  <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>&copy; 2025 Sri Lanka Scout Association. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

