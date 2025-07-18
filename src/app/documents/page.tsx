
"use client";

import { useState, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { fetchDocuments } from '@/lib/api-client';
import type { StoredDocument } from '@/types/document';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, FileText, UploadCloud, ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DocumentList } from '@/components/features/documents/DocumentList';
import { DocumentForm } from '@/components/features/documents/DocumentForm';
import { NavigationContext } from '@/components/layout/AppShell';
import Link from 'next/link';

export default function DocumentsPage() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<StoredDocument | null>(null);
  const navContext = useContext(NavigationContext);

  const { data: documents = [], isLoading, error } = useQuery<StoredDocument[]>({
    queryKey: ['documents', user?.uid],
    queryFn: () => fetchDocuments(),
    enabled: !!user,
  });
  
  const handleNavigation = () => {
    if (navContext) {
      navContext.setIsNavigating(true);
    }
  };

  const handleOpenFormForNew = () => {
    setEditingDocument(null);
    setIsFormOpen(true);
  };
  
  const handleEditDocument = (doc: StoredDocument) => {
    setEditingDocument(doc);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-2/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{(error as Error).message}</AlertDescription></Alert>;
  }

  return (
    <div className="space-y-8">
      <Button asChild variant="link" className="p-0 h-auto font-body text-muted-foreground hover:text-primary -ml-1">
        <Link href="/dashboard-details" onClick={handleNavigation}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Return to Dashboard Hub
        </Link>
      </Button>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline mb-2 text-primary flex items-center">
            <FileText className="mr-3 h-8 w-8" /> Document Locker
          </h1>
          <p className="text-muted-foreground font-body">
            A central, secure place for all your important documents.
          </p>
        </div>
         <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
          setIsFormOpen(isOpen);
          if (!isOpen) setEditingDocument(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenFormForNew} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-headline">{editingDocument ? 'Edit Document' : 'Add New Document'}</DialogTitle>
            </DialogHeader>
            <Alert>
              <UploadCloud className="h-4 w-4" />
              <AlertTitle>File Upload Notice</AlertTitle>
              <AlertDescription>
                To add a document, first upload it to a cloud service (like Google Drive, Dropbox, or Firebase Storage) and then paste the public sharing link into the "File URL" field below.
              </AlertDescription>
            </Alert>
            <DocumentForm
              initialData={editingDocument}
              onClose={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <DocumentList documents={documents} onEdit={handleEditDocument} />
    </div>
  );
}
