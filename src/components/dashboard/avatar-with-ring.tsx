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

const ringSizeClasses = {
  sm: 'border-2',
  md: 'border-2',
  lg: 'border-3',
  xl: 'border-4',
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
  const ringSizeClass = ringSizeClasses[size];

  return (
    <div 
      className={cn('relative inline-block', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      <Avatar className={cn(sizeClass, 'ring-2 ring-background')}>
        {src && <AvatarImage src={src} alt={alt || 'Avatar'} />}
        <AvatarFallback className={sizeClass}>{fallback}</AvatarFallback>
      </Avatar>
      <div className={cn(
        'absolute -bottom-0.5 -right-0.5 rounded-full border-2',
        ringColor,
        'pointer-events-none z-10',
        size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : size === 'lg' ? 'h-5 w-5' : 'h-6 w-6',
        'bg-background'
      )} />
    </div>
  );
}

