
"use client";

import type { LoggedTrip } from '@/types/tripplanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Repeat, Route, Fuel, CalendarDays as CalendarIconLucide, CalendarPlus } from 'lucide-react'; // Renamed to avoid conflict
import { format, parseISO } from 'date-fns';

interface TripLogItemProps {
  trip: LoggedTrip;
  onDelete: (id: string) => void;
  onRecall: (trip: LoggedTrip) => void;
  onAddToCalendar: (trip: LoggedTrip) => void;
}

export function TripLogItem({ trip, onDelete, onRecall, onAddToCalendar }: TripLogItemProps) {
  const renderDateRange = () => {
    if (trip.plannedStartDate && trip.plannedEndDate) {
      const startDate = format(parseISO(trip.plannedStartDate), "PP");
      const endDate = format(parseISO(trip.plannedEndDate), "PP");
      if (startDate === endDate) return startDate;
      return `${startDate} - ${endDate}`;
    }
    if (trip.plannedStartDate) {
      return `Starts: ${format(parseISO(trip.plannedStartDate), "PP")}`;
    }
    if (trip.plannedEndDate) {
      return `Ends: ${format(parseISO(trip.plannedEndDate), "PP")}`;
    }
    return null;
  };

  const dateRange = renderDateRange();

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">{trip.name}</CardTitle>
        <CardDescription className="font-body text-sm text-muted-foreground flex items-center">
          <CalendarIconLucide className="mr-2 h-4 w-4" /> Saved: {format(parseISO(trip.timestamp), "PPp")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
        <div className="font-body">
          <p className="text-sm font-semibold">From: <span className="font-normal">{trip.startLocationDisplay}</span></p>
          <p className="text-sm font-semibold">To: <span className="font-normal">{trip.endLocationDisplay}</span></p>
        </div>
        {dateRange && (
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIconLucide className="mr-2 h-4 w-4 text-primary" />
            <span>{dateRange}</span>
          </div>
        )}
        <div className="flex items-center text-sm text-muted-foreground">
          <Route className="mr-2 h-4 w-4 text-primary" />
          <span>{trip.routeDetails.distance} ({trip.routeDetails.duration})</span>
        </div>
        {trip.fuelEstimate && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Fuel className="mr-2 h-4 w-4 text-accent" />
            <span>{trip.fuelEstimate.fuelNeeded} / {trip.fuelEstimate.estimatedCost}</span>
          </div>
        )}
        <div className="text-xs text-muted-foreground">
            Efficiency: {trip.fuelEfficiency} L/100km, Price: ${trip.fuelPrice.toFixed(2)}/L
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-4">
        <Button variant="ghost" size="sm" onClick={() => onAddToCalendar(trip)} className="font-body text-primary" disabled={!trip.plannedStartDate}>
          <CalendarPlus className="mr-2 h-4 w-4" /> Calendar
        </Button>
        <Button variant="outline" size="sm" onClick={() => onRecall(trip)} className="font-body">
          <Repeat className="mr-2 h-4 w-4" /> Recall
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(trip.id)} className="font-body">
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
