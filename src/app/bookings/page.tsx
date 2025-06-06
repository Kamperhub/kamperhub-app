
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { BookingEntry } from '@/types/booking';
import { BOOKINGS_STORAGE_KEY, sampleAffiliateLinks, AffiliateLink } from '@/types/booking';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, BedDouble, ExternalLink, Info } from 'lucide-react';
import { BookingForm } from '@/components/features/bookings/BookingForm';
import { BookingList } from '@/components/features/bookings/BookingList';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingEntry[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingEntry | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      try {
        const storedBookings = localStorage.getItem(BOOKINGS_STORAGE_KEY);
        if (storedBookings) {
          setBookings(JSON.parse(storedBookings));
        }
      } catch (error) {
        console.error("Error loading bookings from localStorage:", error);
        toast({ title: "Error Loading Bookings", description: "Could not load your saved bookings.", variant: "destructive" });
      }
    }
  }, [hasMounted, toast]);

  const saveBookingsToStorage = useCallback((updatedBookings: BookingEntry[]) => {
    if (!hasMounted) return;
    try {
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updatedBookings));
    } catch (error) {
      console.error("Error saving bookings to localStorage:", error);
      toast({ title: "Error Saving Bookings", description: "Could not save your changes.", variant: "destructive" });
    }
  }, [toast, hasMounted]);

  const handleSaveBooking = (data: Omit<BookingEntry, 'id' | 'timestamp'>) => {
    let updatedBookings;
    const bookingData = { 
      ...data, 
      checkInDate: data.checkInDate, 
      checkOutDate: data.checkOutDate 
    };

    if (editingBooking) {
      updatedBookings = bookings.map(b => 
        b.id === editingBooking.id ? { ...editingBooking, ...bookingData, timestamp: new Date().toISOString() } : b
      );
      toast({ title: "Booking Updated", description: `Booking for ${data.siteName} updated.` });
    } else {
      const newBooking: BookingEntry = { 
        ...bookingData, 
        id: Date.now().toString(), 
        timestamp: new Date().toISOString() 
      };
      updatedBookings = [...bookings, newBooking];
      toast({ title: "Booking Added", description: `Booking for ${data.siteName} added.` });
    }
    setBookings(updatedBookings);
    saveBookingsToStorage(updatedBookings);
    setIsFormOpen(false);
    setEditingBooking(null);
  };

  const handleEditBooking = (booking: BookingEntry) => {
    setEditingBooking(booking);
    setIsFormOpen(true);
  };

  const handleDeleteBooking = (id: string) => {
    const bookingToDelete = bookings.find(b => b.id === id);
    if (window.confirm(`Are you sure you want to delete the booking for ${bookingToDelete?.siteName}?`)) {
      const updatedBookings = bookings.filter(b => b.id !== id);
      setBookings(updatedBookings);
      saveBookingsToStorage(updatedBookings);
      toast({ title: "Booking Deleted" });
    }
  };

  const handleOpenFormForNew = () => {
    setEditingBooking(null);
    setIsFormOpen(true);
  };

  if (!hasMounted) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-headline mb-6 text-primary">Accommodation Bookings</h1>
        <p className="font-body">Loading booking data...</p>
      </div>
    );
  }

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
            />
          </DialogContent>
        </Dialog>
      </div>

      <Alert variant="default" className="bg-primary/10 border-primary/30">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="font-headline text-primary">Manual Booking Log</AlertTitle>
        <AlertDescription className="font-body text-primary/80">
          This section is for manually logging bookings you've made externally. 
          KamperHub does not integrate directly with booking platforms for automated tracking.
          Booking data is stored locally in your browser.
        </AlertDescription>
      </Alert>

      <BookingList
        bookings={bookings}
        onEdit={handleEditBooking}
        onDelete={handleDeleteBooking}
      />

      <div className="pt-8">
        <h2 className="text-2xl font-headline text-primary mb-4">Book Your Stay</h2>
        <p className="text-muted-foreground font-body mb-6">
          Explore these popular platforms to find and book your next caravan park or campsite. 
          (Note: These are affiliate link placeholders. Replace URLs with your actual affiliate links.)
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {sampleAffiliateLinks.map(link => (
            <Card key={link.id} className="hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="font-headline text-base text-primary flex items-center justify-between">
                  {link.name}
                  <ExternalLink className="h-4 w-4 text-accent" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Image
                  src={`https://placehold.co/300x200.png`}
                  alt={`${link.name} placeholder image`}
                  width={300}
                  height={200}
                  className="rounded-md object-cover aspect-video mb-3"
                  data-ai-hint={link.dataAiHint || 'travel booking'}
                />
                <p className="text-muted-foreground font-body text-xs mb-3 line-clamp-2">{link.description}</p>
                <Button asChild className="w-full bg-secondary hover:bg-secondary/80 text-accent font-body text-xs py-1.5 h-auto">
                  <Link href={link.url} target="_blank" rel="noopener noreferrer sponsored">
                    Book here
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

