import SignIn from './signin';
import SignUp from './signup';

export default function AuthLanding({ mode = 'signin' }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      
      {/* Left Column: Brand Hero Section (visible on desktop) */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%] bg-linear-to-br from-primary to-primary-container text-white p-12 flex-col justify-between relative overflow-hidden select-none">
        
        {/* Glow ambient effects */}
        <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] bg-white/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-black/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-[40%] left-[20%] w-[250px] h-[250px] bg-primary/20 rounded-full blur-2xl pointer-events-none animate-pulse" />

        {/* Logo Header */}
        <div className="relative z-10 flex items-center gap-2 text-2xl font-black italic tracking-tighter cursor-default">
          <span className="inline-block animate-bounce select-none">⚡</span>
          <span>BlitzBite</span>
        </div>

        {/* Content Section */}
        <div className="relative z-10 space-y-6 my-auto max-w-md">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Live Delivery Platform</span>
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-black leading-tight tracking-tight text-white">
            Real-Time<br />
            <span className="text-primary-container bg-white text-primary px-3 py-0.5 rounded-2xl inline-block mt-1 transform -rotate-1">
              Food Delivery
            </span>
          </h1>
          
          <p className="text-sm lg:text-base text-white/80 font-medium leading-relaxed">
            Satisfy your cravings instantly. BlitzBite connects you with premier local kitchens, presenting ultra-fast order tracking and seamless updates.
          </p>

          {/* Quick stats/benefits bento-style badges */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
              <span className="material-symbols-outlined text-lg text-amber-300">speed</span>
              <p className="text-xs font-black text-white">Ultra Fast</p>
              <p className="text-[10px] text-white/60">Averaging 25 minute delivery times</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
              <span className="material-symbols-outlined text-lg text-amber-300">map</span>
              <p className="text-xs font-black text-white">Live Tracking</p>
              <p className="text-[10px] text-white/60">Watch your rider on the map in real-time</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[10px] font-bold text-white/50 tracking-wider">
          © 2026 BLITZBITE. ALL RIGHTS RESERVED.
        </div>
      </div>

      {/* Right Column: Authenticated Forms Column */}
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background relative overflow-y-auto">
        {/* Mobile Header Branding (visible only on mobile) */}
        <div className="absolute top-6 left-6 md:hidden z-10 flex items-center gap-1.5 font-black text-2xl italic tracking-tighter text-primary select-none">
          <span>⚡</span>
          <span>BlitzBite</span>
        </div>
        
        {/* Forms Container */}
        <div className="w-full h-full">
          {mode === 'signin' ? <SignIn /> : <SignUp />}
        </div>
      </div>

    </div>
  );
}
