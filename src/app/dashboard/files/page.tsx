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
import { useAuth, useCollection } from '@/firebase';
import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function FilesPage() {
  const { db, userProfile } = useAuth();
  const isCoreOrSemiCore = userProfile?.role === 'Core' || userProfile?.role === 'Semi-core';

  const filesQuery = useMemo(() => {
    if (!db) return null;
    if (isCoreOrSemiCore) {
      return collection(db, 'files');
    }
    if (userProfile?.teamId) {
      return query(collection(db, 'files'), where('teamId', '==', userProfile.teamId));
    }
    return null;
  }, [db, userProfile, isCoreOrSemiCore]);

  const { data: files, loading } = useCollection<FileItem>(filesQuery);

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-headline font-bold">Files</h1>
                <p className="text-muted-foreground">Access and manage all team documents.</p>
            </div>
            {isCoreOrSemiCore && (
              <Button size="sm" className="gap-1">
                  <PlusCircle className="h-4 w-4" />
                  Upload File
              </Button>
            )}
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-sm flex flex-col">
                <CardHeader className="p-0 relative">
                  <Skeleton className="w-full aspect-[4/3] rounded-t-lg" />
                </CardHeader>
                <CardContent className="p-4 flex-grow space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                   <Skeleton className="h-4 w-1/3" />
                   <Skeleton className="h-4 w-1/4" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {files?.map((file) => (
              <Card key={file.id} className="shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <CardHeader className="p-0 relative">
                  <Image
                    src={PlaceHolderImages.find(p => p.id === 'file-preview-1')?.imageUrl!} // Placeholder until file previews are implemented
                    alt={`Preview of ${file.name}`}
                    width={400}
                    height={300}
                    data-ai-hint={'document paper'}
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
                          {isCoreOrSemiCore && (
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
                    {/* In a real app, you'd fetch the user's name from their UID */}
                    <span>{file.uploadedBy.substring(0, 8)}...</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(file.uploadDate.toDate(), 'yyyy-MM-dd')}</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
            {files?.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-10">
                No files found.
              </div>
            )}
          </div>
        )}
    </div>
  );
}
