import React from 'react';
import type { User } from '../types';

interface Props {
  theme: string;
  onToggleTheme: () => void;
  onLogout: () => void;
}

const AdjustHeader: React.FC<Props> = ({ theme, onToggleTheme, onLogout }) => {
  return (
    <header className="w-full bg-slate-800 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 20 L80 80 M80 20 L20 80" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
            </svg>
            <span className="font-semibold text-lg">AI CREAT</span>
          </div>
          <nav className="hidden md:flex items-center gap-4 text-sm text-slate-300">
            <a href="/user-dashboard" className="hover:text-white">Dashboard</a>
            <a href="#" className="text-cyan-300">Recreate</a>
            <a href="#" className="hover:text-white">Project History</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-md hover:bg-slate-700"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="p-2 rounded-md hover:bg-slate-700" title="Notifications">🔔</button>
          <button className="p-2 rounded-md hover:bg-slate-700" title="Settings">⚙️</button>
          <button onClick={onLogout} className="p-2 rounded-md hover:bg-slate-700" title="Logout">⎋</button>
          <img
            src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&auto=format&fit=crop&w=880&q=80"
            alt="User"
            className="w-8 h-8 rounded-full border border-slate-600"
          />
        </div>
      </div>
    </header>
  );
};

export default AdjustHeader;
