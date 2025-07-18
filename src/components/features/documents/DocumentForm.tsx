
"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDocument, updateDocument } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { StoredDocument, documentTags } from '@/types/document';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, XCircle } from 'lucide-react';

const documentFormSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  description: z.string().optional(),
  fileUrl: z.string().url("Please enter a valid URL"),
  tags: z.array(z.string()).default([]),
});

type DocumentFormData = z.infer<typeof documentFormSchema>;

interface DocumentFormProps {
  initialData?: StoredDocument | null;
  onClose: () => void;
}

export function DocumentForm({ initialData, onClose }: DocumentFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, control } = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      fileUrl: initialData?.fileUrl || '',
      tags: initialData?.tags || [],
    },
  });

  const mutation = useMutation({
    mutationFn: (data: DocumentFormData) => {
      if (initialData) {
        return updateDocument(user!.uid, { ...initialData, ...data });
      }
      return createDocument(user!.uid, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', user?.uid] });
      toast({ title: initialData ? "Document Updated" : "Document Added" });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: DocumentFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div>
        <Label htmlFor="name">Document Name</Label>
        <Input id="name" {...register("name")} placeholder="e.g., Caravan Insurance Policy" />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea id="description" {...register("description")} placeholder="e.g., Policy #12345, expires next year." />
      </div>
      <div>
        <Label htmlFor="fileUrl">File URL</Label>
        <Input id="fileUrl" {...register("fileUrl")} placeholder="https://..." />
        {errors.fileUrl && <p className="text-sm text-destructive mt-1">{errors.fileUrl.message}</p>}
      </div>
      <div>
        <Label>Tags</Label>
        <div className="grid grid-cols-2 gap-2 p-2 border rounded-md">
            <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                    <>
                    {documentTags.map((tag) => (
                        <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                            id={tag}
                            checked={field.value?.includes(tag)}
                            onCheckedChange={(checked) => {
                            return checked
                                ? field.onChange([...field.value, tag])
                                : field.onChange(
                                    field.value?.filter((value) => value !== tag)
                                );
                            }}
                        />
                        <label htmlFor={tag} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {tag}
                        </label>
                        </div>
                    ))}
                    </>
                )}
            />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
            <XCircle className="mr-2 h-4 w-4"/> Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
            <Save className="mr-2 h-4 w-4"/> {initialData ? 'Update Document' : 'Save Document'}
        </Button>
      </div>
    </form>
  );
}
