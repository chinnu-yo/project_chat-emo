'use client';

import React from 'react';
import { SenderRole } from '@/types';
import { User, MessageSquare } from 'lucide-react';

interface RoleToggleProps {
  currentRole: SenderRole;
  onRoleChange: (role: SenderRole) => void;
}

export const RoleToggle: React.FC<RoleToggleProps> = ({ currentRole, onRoleChange }) => {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800 backdrop-blur-md">
      <button
        type="button"
        onClick={() => onRoleChange('sender')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
          currentRole === 'sender'
            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 border border-emerald-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`}
      >
        <User className="w-3.5 h-3.5" />
        Sender (You)
      </button>

      <button
        type="button"
        onClick={() => onRoleChange('recipient')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
          currentRole === 'recipient'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50 border border-blue-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Recipient (Partner)
      </button>
    </div>
  );
};
