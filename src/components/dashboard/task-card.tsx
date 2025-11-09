import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AvatarWithRing } from "@/components/dashboard/avatar-with-ring";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Calendar, Edit, ArrowRight, Trash2 } from "lucide-react";
import type { Task } from "@/lib/types";
import { format } from "date-fns";
import { useAuth } from "@/firebase";
import { canSeeAllTasks, isHead } from "@/lib/permissions";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onStatusChange?: (task: Task) => void;
  onAssign?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

export const TaskCard = React.memo(function TaskCard({ task, onEdit, onStatusChange, onAssign, onDelete }: TaskCardProps) {
  const { userProfile } = useAuth();
  
  // Core, Semi-core, and heads can fully edit.
  const canFullyEdit = canSeeAllTasks(userProfile) || (isHead(userProfile) && userProfile?.teamId === task.teamId);
  // The assigned volunteer can only update the status.
  const isAssignee = userProfile?.uid === task.assignee.uid;

  const getStatusVariant = (status: Task["status"]) => {
    switch (status) {
      case "Completed":
        return "default";
      case "In Progress":
        return "secondary";
      case "Pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

  return (
    <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow bg-card">
      <CardHeader className="p-4 flex flex-row items-start justify-between">
        <CardTitle className="text-base font-medium leading-none">{task.title}</CardTitle>
        {(canFullyEdit || isAssignee) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canFullyEdit ? (
                <>
                  {onEdit && (
                    <DropdownMenuItem onSelect={() => onEdit(task)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Task
                    </DropdownMenuItem>
                  )}
                  {onStatusChange && (
                    <DropdownMenuItem onSelect={() => onStatusChange(task)}>
                      Change Status
                    </DropdownMenuItem>
                  )}
                  {onAssign && (
                    <DropdownMenuItem onSelect={() => onAssign(task)}>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Assign To...
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      onSelect={() => onDelete(task)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                <>
                  {onStatusChange && (
                    <DropdownMenuItem onSelect={() => onStatusChange(task)}>
                      Change Status
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <p className="text-sm text-muted-foreground">{task.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(task.deadline.toDate(), 'MMM dd, yyyy')}</span>
          </div>
          <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>
        </div>
        <div className="flex items-center gap-2 pt-2">
            <AvatarWithRing
              src={task.assignee.avatarUrl}
              alt={task.assignee.name}
              fallback={getInitials(task.assignee.name)}
              role={undefined} // Task assignee role not available in task data
              size="sm"
            />
            <span className="text-sm font-medium">{task.assignee.name}</span>
        </div>
      </CardContent>
    </Card>
  );
});
