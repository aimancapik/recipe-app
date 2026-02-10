
import React from 'react';

interface ProfileScreenProps {
  onBack: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  return (
    <div className="bg-background-light dark:bg-background-dark text-[#181711] dark:text-white min-h-screen flex flex-col">
      {/* Top App Bar */}
      <div className="sticky top-0 z-10 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 justify-between border-b border-primary/10">
        <div 
          onClick={onBack}
          className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-primary/10 cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Profile</h2>
        <div className="flex size-10 items-center justify-end">
          <button className="flex items-center justify-center rounded-full size-10 hover:bg-primary/10">
            <span className="material-symbols-outlined">edit</span>
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Profile Header */}
        <div className="flex p-6 flex-col items-center">
          <div className="relative">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-32 w-32 border-4 border-primary shadow-lg" 
              style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200")' }} 
            />
            <div className="absolute bottom-1 right-1 bg-primary p-1.5 rounded-full border-2 border-background-light dark:border-background-dark">
              <span className="material-symbols-outlined text-xs font-bold text-black">check</span>
            </div>
          </div>
          <div className="mt-4 flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold tracking-tight">Alex Miller</h1>
            <p className="text-slate-500 font-medium">Chef & Food Enthusiast</p>
            <div className="flex items-center gap-1 mt-1 text-sm text-slate-400">
              <span className="material-symbols-outlined text-sm">location_on</span>
              <span>New York, NY</span>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-3 px-4 py-2">
          {[
            { label: 'Recipes', val: '124' },
            { label: 'Followers', val: '1.2k' },
            { label: 'Following', val: '850' }
          ].map(stat => (
            <div key={stat.label} className="flex flex-1 flex-col gap-1 rounded-xl bg-white dark:bg-[#2d2c16] p-4 items-center text-center shadow-sm border border-primary/5">
              <p className="text-2xl font-bold leading-none">{stat.val}</p>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Menu Section */}
        <div className="px-4 mt-6 flex flex-col gap-2">
          <h3 className="px-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Account</h3>
          <MenuLink 
            icon="menu_book" 
            title="My Recipes" 
            subtitle="42 saved, 12 published" 
          />
          <MenuLink 
            icon="notifications" 
            title="Notifications" 
            badge="3 NEW" 
          />
          <MenuLink 
            icon="settings" 
            title="Settings" 
          />
          
          <h3 className="px-2 text-xs font-bold text-slate-400 uppercase tracking-widest mt-4 mb-1">Support</h3>
          <MenuLink 
            icon="help_center" 
            title="Help Center" 
          />
          <button className="flex items-center gap-4 bg-white dark:bg-[#2d2c16] px-4 py-4 rounded-xl shadow-sm border border-red-500/10 active:scale-[0.98] transition-transform mt-4">
            <div className="flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 shrink-0 size-10">
              <span className="material-symbols-outlined">logout</span>
            </div>
            <p className="text-base font-semibold flex-1 text-left text-red-600">Sign Out</p>
          </button>
        </div>
      </main>
    </div>
  );
};

const MenuLink: React.FC<{ icon: string; title: string; subtitle?: string; badge?: string }> = ({ icon, title, subtitle, badge }) => (
  <button className="flex items-center gap-4 bg-white dark:bg-[#2d2c16] px-4 py-4 rounded-xl shadow-sm border border-primary/5 active:scale-[0.98] transition-transform group">
    <div className="flex items-center justify-center rounded-lg bg-primary/20 text-[#222110] dark:text-primary shrink-0 size-10 transition-colors group-hover:bg-primary">
      <span className="material-symbols-outlined">{icon}</span>
    </div>
    <div className="flex-1 text-left">
      <p className="text-base font-semibold">{title}</p>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </div>
    {badge && (
      <div className="bg-primary px-2 py-0.5 rounded-full mr-2">
        <p className="text-[10px] font-bold text-black">{badge}</p>
      </div>
    )}
    <span className="material-symbols-outlined text-slate-300">chevron_right</span>
  </button>
);

export default ProfileScreen;
