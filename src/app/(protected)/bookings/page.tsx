
"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BookingEntry } from '@/types/booking';
import type { LoggedTrip } from '@/types/tripplanner';
import { sampleAffiliateLinks, type AffiliateLink } from '@/types/booking';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, BedDouble, ExternalLink, Info } from 'lucide-react';
import { BookingForm } from '@/components/features/bookings/BookingForm';
import { BookingList } from '@/components/features/bookings/BookingList';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchBookingsPageData, createBooking, updateBooking, deleteBooking } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAuthLoading } = useAuth();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingEntry | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['bookingsPageData', user?.uid],
    queryFn: fetchBookingsPageData,
    enabled: !!user && !isAuthLoading,
  });

  const bookings = data?.bookings || [];
  const trips = data?.trips || [];

  const groupedAffiliateLinks = sampleAffiliateLinks.reduce((acc, link) => {
    const category = link.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(link);
    return acc;
  }, {} as Record<string, AffiliateLink[]>);

  const createBookingMutation = useMutation({
    mutationFn: (newBookingData: Omit<BookingEntry, 'id' | 'timestamp'>) => createBooking(newBookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookingsPageData', user?.uid] });
      toast({ title: "Booking Added" });
      setIsFormOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error Adding Booking", description: error.message, variant: "destructive" });
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: (bookingData: BookingEntry) => updateBooking(bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookingsPageData', user?.uid] });
      toast({ title: "Booking Updated" });
      setIsFormOpen(false);
      setEditingBooking(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error Updating Booking", description: error.message, variant: "destructive" });
    },
  });
  
  const deleteBookingMutation = useMutation({
    mutationFn: (bookingId: string) => deleteBooking(bookingId),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bookingsPageData', user?.uid] });
        toast({ title: "Booking Deleted" });
    },
    onError: (error: Error) => {
        toast({ title: "Error Deleting Booking", description: error.message, variant: "destructive" });
    }
  });


  const handleSaveBooking = (data: Omit<BookingEntry, 'id' | 'timestamp'>) => {
    if (editingBooking) {
      updateBookingMutation.mutate({ ...editingBooking, ...data });
    } else {
      createBookingMutation.mutate(data);
    }
  };

  const handleEditBooking = (booking: BookingEntry) => {
    setEditingBooking(booking);
    setIsFormOpen(true);
  };

  const handleDeleteBooking = (id: string) => {
    const bookingToDelete = bookings.find(b => b.id === id);
    if (window.confirm(`Are you sure you want to delete the booking for ${bookingToDelete?.siteName}?`)) {
      deleteBookingMutation.mutate(id);
    }
  };

  const handleOpenFormForNew = () => {
    setEditingBooking(null);
    setIsFormOpen(true);
  };
  
  const isMutationLoading = createBookingMutation.isPending || updateBookingMutation.isPending;
  const pageIsLoading = isAuthLoading || isLoading;
  const pageError = error;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline mb-2 text-primary flex items-center">
            <BedDouble className="mr-3 h-8 w-8" /> Accommodation Bookings
          </h1>
          <p className="text-muted-foreground font-body">
            Log and manage your campsite and accommodation bookings here.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
          setIsFormOpen(isOpen);
          if (!isOpen) setEditingBooking(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenFormForNew} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle className="font-headline">{editingBooking ? 'Edit Booking' : 'Add New Booking'}</DialogTitle>
            </DialogHeader>
            <BookingForm
              initialData={editingBooking || undefined}
              onSave={handleSaveBooking}
              onCancel={() => { setIsFormOpen(false); setEditingBooking(null); }}
              isLoading={isMutationLoading}
              trips={trips}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {pageError && (
        <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>{(pageError as Error).message}</AlertDescription>
        </Alert>
      )}

      {pageIsLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <BookingList
            bookings={bookings}
            trips={trips}
            onEdit={handleEditBooking}
            onDelete={handleDeleteBooking}
        />
      )}

      <div className="pt-8 space-y-8">
        <h2 className="text-2xl font-headline text-primary mb-4">Book Your Stay</h2>
        <p className="text-muted-foreground font-body -mt-4">
          Explore these popular platforms to find and book your next caravan park or campsite.
        </p>

        {Object.entries(groupedAffiliateLinks).map(([category, links]) => (
          <div key={category}>
            <h3 className="text-xl font-headline text-primary mb-4">{category}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {links.map(link => (
                <Card key={link.id} className="hover:shadow-xl transition-shadow duration-300 flex flex-col">
                  <CardHeader className="flex-grow-0">
                    <CardTitle className="font-headline text-base text-primary flex items-center justify-between">
                      {link.name}
                      <ExternalLink className="h-4 w-4 text-accent" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-grow">
                    {link.icon && (
                      <div className="flex justify-center items-center h-32 w-full bg-muted/10 rounded-md mb-3">
                        <link.icon className="h-16 w-16 text-primary opacity-75" />
                      </div>
                    )}
                    <p className="text-muted-foreground font-body text-xs mb-3 line-clamp-2 flex-grow">{link.description}</p>
                    <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-body text-xs py-1.5 h-auto mt-auto">
                      <Link href={link.url} target="_blank" rel="noopener noreferrer sponsored">
                        Book here
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
