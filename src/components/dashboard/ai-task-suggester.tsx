'use client';
import { useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { suggestTasksAction, SuggestTasksState } from '@/app/actions';
import { Bot, Plus, Loader2, Sparkles, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const initialState: SuggestTasksState = {
  message: null,
  tasks: [],
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Suggesting...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Suggest Tasks
        </>
      )}
    </Button>
  );
}

export function AiTaskSuggester() {
  const [state, formAction] = useActionState(suggestTasksAction, initialState);
  const [open, setOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const handleCheckboxChange = (task: string, checked: boolean) => {
    setSelectedTasks(prev => 
      checked ? [...prev, task] : prev.filter(t => t !== task)
    );
  };

  const handleAddTasks = () => {
    // Here you would typically dispatch an action to add tasks to your global state or database
    console.log('Adding selected tasks:', selectedTasks);
    setOpen(false); // Close dialog after adding
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Bot className="mr-2 h-4 w-4" />
          Suggest with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2"><Sparkles className='text-accent'/>AI Task Suggester</DialogTitle>
            <DialogDescription>
              Describe your event, and let AI suggest a list of tasks to get you started.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Event Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="e.g., 'A 2-day national level technical symposium with 5 workshops and a coding competition.'"
                rows={4}
              />
            </div>

            {state.message && (
              <Alert variant={state.error ? "destructive" : "default"}>
                <AlertTitle>{state.error ? 'Oops!' : 'Suggestions Ready!'}</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}

            {state.tasks.length > 0 && (
                <div className='space-y-2'>
                    <Label>Suggested Tasks</Label>
                    <ScrollArea className='h-48 rounded-md border p-2'>
                        <div className='space-y-3 p-2'>
                            {state.tasks.map((task, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`task-${index}`}
                                        onCheckedChange={(checked) => handleCheckboxChange(task, !!checked)}
                                    />
                                    <label
                                        htmlFor={`task-${index}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {task}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
          </div>
          <DialogFooter>
            {state.tasks.length > 0 ? (
                <Button onClick={handleAddTasks} disabled={selectedTasks.length === 0}>
                    <Check className='mr-2 h-4 w-4' />
                    Add {selectedTasks.length > 0 ? `${selectedTasks.length} ` : ''} Selected
                </Button>
            ) : (
                <SubmitButton />
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
