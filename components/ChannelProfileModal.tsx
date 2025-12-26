import React, { useEffect, useState } from 'react';
import { ChannelProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: ChannelProfile) => void;
  initialProfile?: ChannelProfile;
}

export const ChannelProfileModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialProfile }) => {
  const [profile, setProfile] = useState<ChannelProfile>({
    name: '',
    niche: '',
    audience: '',
    voice: ''
  });

  useEffect(() => {
    if (initialProfile) setProfile(initialProfile);
  }, [initialProfile]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
        <h2 className="text-xl font-bold text-white mb-1">Channel Memory</h2>
        <p className="text-zinc-500 text-sm mb-6">Gemini will use this context for every script generation.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1 uppercase font-bold">Channel Name</label>
            <input 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 transition-all"
              value={profile.name}
              onChange={e => setProfile({...profile, name: e.target.value})}
              placeholder="e.g. Tech With Tim"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1 uppercase font-bold">Niche</label>
            <input 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 transition-all"
              value={profile.niche}
              onChange={e => setProfile({...profile, niche: e.target.value})}
              placeholder="e.g. Software Engineering Career Advice"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1 uppercase font-bold">Target Audience</label>
            <input 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 transition-all"
              value={profile.audience}
              onChange={e => setProfile({...profile, audience: e.target.value})}
              placeholder="e.g. Junior Developers, Students"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1 uppercase font-bold">Brand Voice / Tone</label>
            <textarea 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 transition-all min-h-[80px]"
              value={profile.voice}
              onChange={e => setProfile({...profile, voice: e.target.value})}
              placeholder="e.g. Encouraging, technically detailed, no fluff, fast-paced editing."
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors text-sm">Cancel</button>
          <button 
            onClick={() => { onSave(profile); onClose(); }}
            className="px-6 py-2 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors text-sm"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
};