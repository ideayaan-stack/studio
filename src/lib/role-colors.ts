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
    ring: 'border-red-500',
    bg: 'bg-red-500',
    text: 'text-red-500',
  },
  'Semi-core': {
    ring: 'border-blue-500',
    bg: 'bg-blue-500',
    text: 'text-blue-500',
  },
  'Head': {
    ring: 'border-green-500',
    bg: 'bg-green-500',
    text: 'text-green-500',
  },
  'Volunteer': {
    ring: 'border-purple-500',
    bg: 'bg-purple-500',
    text: 'text-purple-500',
  },
  'Unassigned': {
    ring: 'border-gray-400',
    bg: 'bg-gray-400',
    text: 'text-gray-400',
  },
};

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

