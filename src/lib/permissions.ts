import type { Role, UserProfile } from './types';

/**
 * Role hierarchy: Core > Semi-core > Head > Volunteer
 */

/**
 * Check if user has Core role
 */
export function isCore(userProfile: UserProfile | null | undefined): boolean {
  return userProfile?.role === 'Core';
}

/**
 * Check if user has Semi-core role
 */
export function isSemiCore(userProfile: UserProfile | null | undefined): boolean {
  return userProfile?.role === 'Semi-core';
}

/**
 * Check if user has Head role
 */
export function isHead(userProfile: UserProfile | null | undefined): boolean {
  return userProfile?.role === 'Head';
}

/**
 * Check if user has Volunteer role
 */
export function isVolunteer(userProfile: UserProfile | null | undefined): boolean {
  return userProfile?.role === 'Volunteer';
}

/**
 * Check if user can manage permissions (change roles, assign teams)
 * Only Core can manage permissions
 */
export function canManagePermissions(userProfile: UserProfile | null | undefined): boolean {
  return isCore(userProfile);
}

/**
 * Check if user can create users
 * Only Core can create users
 */
export function canCreateUsers(userProfile: UserProfile | null | undefined): boolean {
  return isCore(userProfile);
}

/**
 * Check if user can create teams
 * Only Core can create teams
 */
export function canCreateTeams(userProfile: UserProfile | null | undefined): boolean {
  return isCore(userProfile);
}

/**
 * Check if user can manage teams (create, edit, delete)
 * Only Core can manage teams
 */
export function canManageTeams(userProfile: UserProfile | null | undefined): boolean {
  return isCore(userProfile);
}

/**
 * Check if user can assign tasks
 * Core and Semi-core can assign tasks to any team
 * Head can assign tasks to their team
 */
export function canAssignTasks(userProfile: UserProfile | null | undefined): boolean {
  return isCore(userProfile) || isSemiCore(userProfile) || isHead(userProfile);
}

/**
 * Check if user can create tasks
 * Core, Semi-core, and Head can create tasks
 */
export function canCreateTasks(userProfile: UserProfile | null | undefined): boolean {
  return isCore(userProfile) || isSemiCore(userProfile) || isHead(userProfile);
}

/**
 * Check if user can see all teams
 * Core and Semi-core can see all teams
 */
export function canSeeAllTeams(userProfile: UserProfile | null | undefined): boolean {
  return isCore(userProfile) || isSemiCore(userProfile);
}

/**
 * Check if user can see all tasks
 * Core and Semi-core can see all tasks
 */
export function canSeeAllTasks(userProfile: UserProfile | null | undefined): boolean {
  return isCore(userProfile) || isSemiCore(userProfile);
}

/**
 * Check if user can see all files
 * Core and Semi-core can see all files
 */
export function canSeeAllFiles(userProfile: UserProfile | null | undefined): boolean {
  return isCore(userProfile) || isSemiCore(userProfile);
}

/**
 * Check if user can upload files to any team
 * Core and Semi-core can upload to any team
 * Head and Volunteers can upload to their team only
 */
export function canUploadToAnyTeam(userProfile: UserProfile | null | undefined): boolean {
  return isCore(userProfile) || isSemiCore(userProfile);
}

/**
 * Check if user can access teams page
 * Core, Semi-core, and Head can access
 * Volunteers cannot access
 */
export function canAccessTeamsPage(userProfile: UserProfile | null | undefined): boolean {
  return isCore(userProfile) || isSemiCore(userProfile) || isHead(userProfile);
}

/**
 * Check if user can chat in all teams
 * Core and Semi-core can chat in all teams
 */
export function canChatInAllTeams(userProfile: UserProfile | null | undefined): boolean {
  return isCore(userProfile) || isSemiCore(userProfile);
}

/**
 * Get user's effective access level
 * Returns the highest role level for permission checks
 */
export function getAccessLevel(userProfile: UserProfile | null | undefined): 'core' | 'semi-core' | 'head' | 'volunteer' | 'none' {
  if (isCore(userProfile)) return 'core';
  if (isSemiCore(userProfile)) return 'semi-core';
  if (isHead(userProfile)) return 'head';
  if (isVolunteer(userProfile)) return 'volunteer';
  return 'none';
}

