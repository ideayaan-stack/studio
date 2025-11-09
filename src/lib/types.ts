import type { LucideIcon } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

export type Role = 'Core' | 'Semi-core' | 'Head' | 'Volunteer' | 'Unassigned';

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  role: Role;
  teamId?: string;
}

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  tooltip: string;
};

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  deadline: Timestamp;
  teamId: string;
  assignee: {
    uid: string;
    name: string;
    avatarUrl?: string;
    avatarHint?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


export interface Team {
  id: string;
  name: string;
  description: string;
  members: string[]; // array of user uids
  head: string; // user uid
  iconURL?: string | null; // team icon URL (ImgBB or base64)
}


export interface FileItem {
  id: string;
  name: string;
  type: string; // MIME type
  uploadDate: Timestamp;
  uploadedBy: string; // user uid
  url: string;
  teamId: string;
  taskId?: string;
  size: number; // in bytes
}

export type Message = {
  id: string;
  sender: {
    name: string;
    avatarUrl: string;
    avatarHint: string;
  };
  text: string;
  timestamp: string;
  isOwn: boolean;
};

export type ChatTeam = {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatarUrl: string;
  avatarHint: string;
};
