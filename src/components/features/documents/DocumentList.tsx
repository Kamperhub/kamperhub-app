
"use client";

import { StoredDocument } from "@/types/document";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { Edit, Trash2, ExternalLink, FileText } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDocument } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface DocumentListProps {
  documents: StoredDocument[];
  onEdit: (doc: StoredDocument) => void;
}

export function DocumentList({ documents, onEdit }: DocumentListProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => deleteDocument(user!.uid, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', user?.uid] });
      toast({ title: "Document Deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleDelete = (doc: StoredDocument) => {
    if(window.confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      deleteMutation.mutate(doc.id);
    }
  };

  if (documents.length === 0) {
    return <p className="text-center py-10 text-muted-foreground">No documents uploaded yet.</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((doc) => (
        <Card key={doc.id} className="flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="font-headline text-lg text-primary line-clamp-2">{doc.name}</CardTitle>
              <div className="flex flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(doc)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(doc)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{doc.description || "No description provided."}</p>
            {doc.tags && doc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {doc.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-3">
             <p>Updated: {format(parseISO(doc.updatedAt), "PP")}</p>
             <Button asChild size="sm" variant="outline">
                <Link href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> View File
                </Link>
             </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
