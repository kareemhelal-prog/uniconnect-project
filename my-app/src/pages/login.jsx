import React, { useState } from 'react';
import '../styles/login.css'; // استدعاء ملف التنسيق
import log from '../assets/log.png'; // تأكد أن اسم الصورة logo.png في فولدر assets

const Login = () => {
  // رابعاً: تجهيز الـ useState للحقول
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Email:", email);
    console.log("Password:", password);
  };

  return (
    <div className="login-page-wrapper">
      {/* الخلفية الملونة (Glow effects) */}
      <div className="bg-glow-top"></div>
      <div className="bg-glow-bottom"></div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        {/* اللوجو والعنوان */}
        <div className="flex flex-col items-center mb-12">
          <img
            src={log}
            alt="UniConnect Logo"
            className="w-24 h-24 mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          />
          <h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-cyan-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
            UniConnect
          </h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6 w-full items-start">
          {/* كارت تسجيل الدخول */}
          <div className="md:col-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[40px] p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full border border-cyan-500/20 rounded-[40px] pointer-events-none"></div>

            <h2 className="text-3xl font-semibold text-cyan-400 mb-10">
              Log In or Register
            </h2>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="University Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white placeholder:text-gray-500 outline-none focus:border-cyan-400/50 transition"
                required
              />

              <div className="flex items-center gap-4">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white placeholder:text-gray-500 outline-none focus:border-cyan-400/50 transition"
                  required
                />

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-gray-400 text-sm">Remember Me</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-full bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 text-white font-bold text-xl shadow-[0_0_25px_rgba(192,38,211,0.4)] hover:scale-[1.02] transition transform"
              >
                LOG IN
              </button>
            </form>

            <div className="text-center mt-6">
              <a href="#" className="text-gray-500 hover:text-cyan-400 text-sm transition">
                Forgot Password?
              </a>
            </div>
          </div>

          {/* كارت التسجيل الجديد */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[40px] p-10 flex flex-col items-center justify-center text-center shadow-2xl">
            <h3 className="text-white text-xl font-medium">New to</h3>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent mb-8">
              UniConnect?
            </span>
            <button className="border-2 border-cyan-400 text-cyan-400 px-8 py-2 rounded-full font-bold hover:bg-cyan-400 hover:text-black transition">
              REGISTER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


