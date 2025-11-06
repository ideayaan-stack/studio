import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Calendar } from "lucide-react";
import type { Task } from "@/lib/types";
import { format } from "date-fns";
import { useAuth } from "@/firebase";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { userProfile, isCoreAdmin } = useAuth();
  
  // Core admins, semi-core, and heads can edit.
  const canFullyEdit = isCoreAdmin || userProfile?.role === 'Head';
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
                  <DropdownMenuItem>Edit Task</DropdownMenuItem>
                  <DropdownMenuItem>Change Status</DropdownMenuItem>
                  <DropdownMenuItem>Assign To...</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive/90">Delete</DropdownMenuItem>
                </>
              ) : (
                 <DropdownMenuItem>Change Status</DropdownMenuItem>
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
            <Avatar className="h-6 w-6">
                {task.assignee.avatarUrl && <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} data-ai-hint={task.assignee.avatarHint} />}
                <AvatarFallback>{getInitials(task.assignee.name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{task.assignee.name}</span>
        </div>
      </CardContent>
    </Card>
  );
}
