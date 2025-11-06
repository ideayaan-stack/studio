import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  tooltip: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  deadline: string;
  teamId: string;
  assignee: {
    name: string;
    avatarUrl: string;
    avatarHint: string;
  };
};

export type Team = {
  id: string;
  name: string;
  memberCount: number;
  description: string;
};

export type FileItem = {
  id: string;
  name: string;
  type: 'PDF' | 'Image' | 'Doc';
  uploadDate: string;
  uploadedBy: string;
  previewUrl: string;
  previewHint: string;
};

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
