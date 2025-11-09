/**
 * Role color utilities for avatar rings and badges
 * Similar to Google Gemini Pro's colored rings
 */

export type Role = 'Core' | 'Semi-core' | 'Head' | 'Volunteer' | 'Unassigned';

export interface RoleColor {
  ring: string; // Border color for avatar ring
  bg: string; // Background color for badges
  text: string; // Text color
}

export const roleColors: Record<Role, RoleColor> = {
  'Core': {
    ring: 'border-red-500 border-solid',
    bg: 'bg-red-500',
    text: 'text-red-500',
  },
  'Semi-core': {
    ring: 'border-blue-500 border-dashed',
    bg: 'bg-blue-500',
    text: 'text-blue-500',
  },
  'Head': {
    ring: 'border-green-500 border-dotted',
    bg: 'bg-green-500',
    text: 'text-green-500',
  },
  'Volunteer': {
    ring: 'border-purple-500 border-solid',
    bg: 'bg-purple-500',
    text: 'text-purple-500',
  },
  'Unassigned': {
    ring: 'border-gray-400 border-solid',
    bg: 'bg-gray-400',
    text: 'text-gray-400',
  },
};

export type RingStyle = 'solid' | 'dashed' | 'dotted' | 'gradient';

export interface RoleRingStyle {
  style: RingStyle;
  color: string;
  gradient?: string;
}

export const roleRingStyles: Record<Role, RoleRingStyle> = {
  'Core': {
    style: 'solid',
    color: 'border-red-500',
  },
  'Semi-core': {
    style: 'dashed',
    color: 'border-blue-500',
  },
  'Head': {
    style: 'dotted',
    color: 'border-green-500',
  },
  'Volunteer': {
    style: 'gradient',
    color: 'border-purple-500',
    gradient: 'from-purple-500 via-pink-500 to-purple-500',
  },
  'Unassigned': {
    style: 'solid',
    color: 'border-gray-400',
  },
};

export function getRoleRingStyle(role?: Role | null): RoleRingStyle {
  if (!role) return roleRingStyles['Unassigned'];
  return roleRingStyles[role] || roleRingStyles['Unassigned'];
}

/**
 * Get role color configuration
 */
export function getRoleColor(role?: Role | null): RoleColor {
  if (!role) return roleColors['Unassigned'];
  return roleColors[role] || roleColors['Unassigned'];
}

/**
 * Get ring color class for avatar
 */
export function getRoleRingColor(role?: Role | null): string {
  return getRoleColor(role).ring;
}

/**
 * Get background color class for badges
 */
export function getRoleBgColor(role?: Role | null): string {
  return getRoleColor(role).bg;
}

/**
 * Get text color class
 */
export function getRoleTextColor(role?: Role | null): string {
  return getRoleColor(role).text;
}

