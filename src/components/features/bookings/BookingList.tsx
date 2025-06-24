
"use client";

import { useMemo } from 'react';
import type { BookingEntry } from '@/types/booking';
import type { LoggedTrip } from '@/types/tripplanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2, Phone, Globe, CalendarDays, MapPin,Hash, StickyNote, DollarSign, Route } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface BookingListProps {
  bookings: BookingEntry[];
  trips: LoggedTrip[];
  onEdit: (booking: BookingEntry) => void;
  onDelete: (id: string) => void;
}

export function BookingList({ bookings, trips, onEdit, onDelete }: BookingListProps) {
  
  const tripMap = useMemo(() => new Map(trips.map(trip => [trip.id, trip.name])), [trips]);
  
  if (bookings.length === 0) {
    return (
      <p className="text-center text-muted-foreground font-body py-10">
        No bookings logged yet. Click "Add New Booking" to get started.
      </p>
    );
  }

  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = parseISO(a.checkInDate);
    const dateB = parseISO(b.checkInDate);
    // Sort by check-in date (most recent first), then by timestamp (most recent first) for tie-breaking
    if (dateA > dateB) return -1;
    if (dateA < dateB) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });


  return (
    <div className="space-y-6">
      {sortedBookings.map(booking => {
        const assignedTripName = booking.assignedTripId ? tripMap.get(booking.assignedTripId) : null;
        return (
          <Card key={booking.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="font-headline text-xl text-primary">{booking.siteName}</CardTitle>
                  <CardDescription className="font-body text-sm text-muted-foreground">
                    Logged: {format(parseISO(booking.timestamp), "PPp")}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(booking)} aria-label="Edit booking">
                    <Edit3 className="h-5 w-5 text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(booking.id)} aria-label="Delete booking">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center font-body">
                <CalendarDays className="mr-3 h-5 w-5 text-accent flex-shrink-0" />
                <div>
                  <span className="font-semibold">Check-in:</span> {format(parseISO(booking.checkInDate), "EEE, dd MMM yyyy")}
                  <br />
                  <span className="font-semibold">Check-out:</span> {format(parseISO(booking.checkOutDate), "EEE, dd MMM yyyy")}
                </div>
              </div>
              {booking.budgetedCost != null && (
                <div className="flex items-center font-body">
                    <DollarSign className="mr-3 h-5 w-5 text-accent flex-shrink-0" />
                    <div><span className="font-semibold">Budgeted Cost:</span> ${booking.budgetedCost.toFixed(2)}</div>
                </div>
              )}
              {assignedTripName && (
                  <div className="flex items-center font-body">
                      <Route className="mr-3 h-5 w-5 text-accent flex-shrink-0" />
                      <div><span className="font-semibold">Assigned Trip:</span> {assignedTripName}</div>
                  </div>
              )}
              {booking.locationAddress && (
                <div className="flex items-start font-body">
                  <MapPin className="mr-3 h-5 w-5 text-accent flex-shrink-0 mt-1" />
                  <div><span className="font-semibold">Address:</span> {booking.locationAddress}</div>
                </div>
              )}
              {booking.confirmationNumber && (
                <div className="flex items-center font-body">
                  <Hash className="mr-3 h-5 w-5 text-accent flex-shrink-0" />
                  <div><span className="font-semibold">Confirmation:</span> {booking.confirmationNumber}</div>
                </div>
              )}
              {(booking.contactPhone || booking.contactWebsite) && (
                <CardFooter className="p-0 pt-3 mt-3 border-t">
                  <div className="space-y-2 w-full">
                    {booking.contactPhone && (
                      <div className="flex items-center font-body">
                        <Phone className="mr-3 h-5 w-5 text-secondary flex-shrink-0" />
                        <a href={`tel:${booking.contactPhone}`} className="hover:underline">{booking.contactPhone}</a>
                      </div>
                    )}
                    {booking.contactWebsite && (
                      <div className="flex items-center font-body">
                        <Globe className="mr-3 h-5 w-5 text-secondary flex-shrink-0" />
                        <a href={booking.contactWebsite} target="_blank" rel="noopener noreferrer" className="hover:underline truncate block max-w-xs sm:max-w-sm md:max-w-md">
                          {booking.contactWebsite}
                        </a>
                      </div>
                    )}
                  </div>
                </CardFooter>
              )}
               {booking.notes && (
                <div className="flex items-start font-body pt-3 mt-3 border-t">
                  <StickyNote className="mr-3 h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                  <div>
                      <span className="font-semibold text-muted-foreground">Notes:</span>
                      <p className="whitespace-pre-wrap text-sm">{booking.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  );
}
