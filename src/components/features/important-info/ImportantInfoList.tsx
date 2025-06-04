
"use client";

import type { EmergencyContact, TravelDocument } from '@/types/importantInfo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Phone, UserCircle, FileText, CalendarDays, Building, StickyNote } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ImportantInfoListProps<T extends EmergencyContact | TravelDocument> {
  items: T[];
  onDelete: (id: string) => void;
  title: string;
  itemType: 'contact' | 'document';
  className?: string;
}

export function ImportantInfoList<T extends EmergencyContact | TravelDocument>({
  items,
  onDelete,
  title,
  itemType,
  className,
}: ImportantInfoListProps<T>) {
  if (items.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="font-headline text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground font-body text-center py-4">
            No {itemType === 'contact' ? 'contacts' : 'documents'} added yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="font-headline text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="bg-secondary/20 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-headline text-primary">
                    {itemType === 'contact' ? (item as EmergencyContact).name : (item as TravelDocument).type}
                  </CardTitle>
                  {itemType === 'document' && (
                    <CardDescription className="font-body text-sm">
                      {(item as TravelDocument).policyNumber} - {(item as TravelDocument).provider}
                    </CardDescription>
                  )}
                   {itemType === 'contact' && (
                    <CardDescription className="font-body text-sm">
                      {(item as EmergencyContact).relationship}
                    </CardDescription>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} aria-label={`Delete ${itemType}`}>
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm font-body">
              {itemType === 'contact' && (
                <>
                  <p className="flex items-center"><Phone className="mr-2 h-4 w-4 text-accent" /> Phone: {(item as EmergencyContact).phone}</p>
                  {(item as EmergencyContact).notes && <p className="flex items-start"><StickyNote className="mr-2 mt-1 h-4 w-4 text-accent flex-shrink-0" /> Notes: {(item as EmergencyContact).notes}</p>}
                </>
              )}
              {itemType === 'document' && (
                <>
                  {(item as TravelDocument).expiryDate && (
                    <p className="flex items-center">
                      <CalendarDays className="mr-2 h-4 w-4 text-accent" />
                      Expiry: {format(parseISO((item as TravelDocument).expiryDate!), 'PPP')}
                    </p>
                  )}
                  {(item as TravelDocument).contactPhone && (
                    <p className="flex items-center"><Phone className="mr-2 h-4 w-4 text-accent" /> Provider Contact: {(item as TravelDocument).contactPhone}</p>
                  )}
                  {(item as TravelDocument).notes && <p className="flex items-start"><StickyNote className="mr-2 mt-1 h-4 w-4 text-accent flex-shrink-0" /> Notes: {(item as TravelDocument).notes}</p>}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
