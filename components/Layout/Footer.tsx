
import React from 'react';

export const Footer = ({ simple }: { simple?: boolean }) => (
  <footer className={`border-t border-white/5 py-8 text-center ${simple ? 'mt-12' : 'mt-0'}`}>
    <p className="text-zinc-600 text-xs">© 2025 LOG AI Inc. All rights reserved.</p>
  </footer>
);
