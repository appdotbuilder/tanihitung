import React from 'react';

interface AdSlotProps {
  position: 'top' | 'bottom' | 'result';
  className?: string;
}

export function AdSlot({ position, className = '' }: AdSlotProps) {
  // For the MVP, we'll just show placeholder ads since we don't have actual AdSense configuration
  // In production, this would check for real environment variables and render actual ads
  
  return (
    <div className={`w-full ${className}`}>
      <div className="w-full min-h-[100px] bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-400 rounded">
        📢 Ad Space ({position})
      </div>
    </div>
  );
}