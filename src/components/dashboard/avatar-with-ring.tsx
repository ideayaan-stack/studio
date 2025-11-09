'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getRoleRingColor } from '@/lib/role-colors';
import type { Role } from '@/lib/types';

interface AvatarWithRingProps {
  src?: string | null;
  alt?: string;
  fallback: string;
  role?: Role | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
  xl: 'h-24 w-24',
};

const ringThickness = {
  sm: 'border-[2px]',
  md: 'border-[3px]',
  lg: 'border-[4px]',
  xl: 'border-[5px]',
};

export function AvatarWithRing({ 
  src, 
  alt, 
  fallback, 
  role, 
  size = 'md',
  className,
  onClick 
}: AvatarWithRingProps) {
  const ringColor = getRoleRingColor(role);
  const sizeClass = sizeClasses[size];
  const thickness = ringThickness[size];

  // Determine ring style based on role
  const isVolunteer = role === 'Volunteer';
  const isSemiCore = role === 'Semi-core';
  const isHead = role === 'Head';

  return (
    <div 
      className={cn('relative inline-flex items-center justify-center', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {isVolunteer ? (
        // Gradient ring for Volunteer
        <div className={cn('rounded-full p-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500')}>
          <div className="rounded-full bg-background p-[2px]">
            <Avatar className={cn(sizeClass, 'ring-0')}>
              {src && <AvatarImage src={src} alt={alt || 'Avatar'} />}
              <AvatarFallback className={sizeClass}>{fallback}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      ) : (
        // Solid, dashed, or dotted ring for other roles
        <div className={cn(
          'rounded-full p-[3px]',
          ringColor,
          thickness,
          isSemiCore ? 'border-dashed' : isHead ? 'border-dotted' : 'border-solid'
        )}>
          <Avatar className={cn(sizeClass, 'ring-0')}>
            {src && <AvatarImage src={src} alt={alt || 'Avatar'} />}
            <AvatarFallback className={sizeClass}>{fallback}</AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
}

