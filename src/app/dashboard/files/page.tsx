'use client';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, FileText, User, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FileItem } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';

const files: FileItem[] = [
  { id: '1', name: 'Event_Proposal_v2.pdf', type: 'PDF', uploadDate: '2024-10-15', uploadedBy: 'Alice J.', previewUrl: PlaceHolderImages.find(p => p.id === 'file-preview-1')?.imageUrl!, previewHint: PlaceHolderImages.find(p => p.id === 'file-preview-1')?.imageHint!, teamId: '1' },
  { id: '2', name: 'Marketing_Banner_Final.png', type: 'Image', uploadDate: '2024-10-18', uploadedBy: 'Bob W.', previewUrl: PlaceHolderImages.find(p => p.id === 'file-preview-2')?.imageUrl!, previewHint: PlaceHolderImages.find(p => p.id === 'file-preview-2')?.imageHint!, teamId: '2' },
  { id: '3', name: 'Budget_Sheet_Q4.xlsx', type: 'Doc', uploadDate: '2024-10-20', uploadedBy: 'Alice J.', previewUrl: PlaceHolderImages.find(p => p.id === 'file-preview-3')?.imageUrl!, previewHint: PlaceHolderImages.find(p => p.id === 'file-preview-3')?.imageHint!, teamId: '1' },
  { id: '4', name: 'Speaker_Confirmations.docx', type: 'Doc', uploadDate: '2024-10-22', uploadedBy: 'Charlie B.', previewUrl: PlaceHolderImages.find(p => p.id === 'file-preview-1')?.imageUrl!, previewHint: PlaceHolderImages.find(p => p.id === 'file-preview-1')?.imageHint!, teamId: '3' },
];

export default function FilesPage() {
  const { user } = useAuth();
  const isCoreTeam = user?.role === 'core-team';

  const displayedFiles = isCoreTeam ? files : files.filter(file => file.teamId === user?.teamId);

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-headline font-bold">Files</h1>
                <p className="text-muted-foreground">Access and manage all team documents.</p>
            </div>
            {isCoreTeam && (
              <Button size="sm" className="gap-1">
                  <PlusCircle className="h-4 w-4" />
                  Upload File
              </Button>
            )}
        </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {displayedFiles.map((file) => (
          <Card key={file.id} className="shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <CardHeader className="p-0 relative">
               <Image
                src={file.previewUrl}
                alt={`Preview of ${file.name}`}
                width={400}
                height={300}
                data-ai-hint={file.previewHint}
                className="object-cover rounded-t-lg aspect-[4/3]"
              />
              <div className="absolute top-2 right-2">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full bg-background/70 hover:bg-background">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Download</DropdownMenuItem>
                      {isCoreTeam && (
                        <>
                          <DropdownMenuItem>Rename</DropdownMenuItem>
                          <DropdownMenuItem>Move</DropdownMenuItem>
                          <DropdownMenuItem className='text-destructive focus:text-destructive focus:bg-destructive/10'>Delete</DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <CardTitle className="text-sm font-medium leading-normal flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0"/> 
                <span className='truncate hover:text-clip'>{file.name}</span>
              </CardTitle>
            </CardContent>
            <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>{file.uploadedBy}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{file.uploadDate}</span>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
