
"use client";

import type { LoggedTrip } from '@/types/tripplanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Repeat, Route, Fuel, CalendarDays as CalendarIconLucide, CalendarPlus, StickyNote, PlayCircle, CheckSquare, RotateCcw, Car } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


interface TripLogItemProps {
  trip: LoggedTrip;
  onDelete: (id: string) => void;
  onRecall: (trip: LoggedTrip) => void;
  onAddToCalendar: (trip: LoggedTrip) => void;
  onStartTrip: (tripId: string) => void;
  onToggleComplete: (tripId: string) => void;
}

export function TripLogItem({ trip, onDelete, onRecall, onAddToCalendar, onStartTrip, onToggleComplete }: TripLogItemProps) {
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
    <Card className={`flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 ${trip.isCompleted ? 'bg-muted/50' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-xl text-primary flex items-center">
              {trip.isVehicleOnly && <Car className="h-5 w-5 mr-2 text-accent" />}
              {trip.name}
            </CardTitle>
            {trip.isCompleted && <Badge variant="default" className="bg-green-600 text-white font-body">Completed</Badge>}
        </div>
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
          <span>{trip.routeDetails.distance.text} ({trip.routeDetails.duration.text})</span>
        </div>
        {trip.fuelEstimate && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Fuel className="mr-2 h-4 w-4 text-accent" />
            <span>{trip.fuelEstimate.fuelNeeded} / {trip.fuelEstimate.estimatedCost}</span>
          </div>
        )}
        <div className="text-xs text-muted-foreground">
            Efficiency: {trip.fuelEfficiency} Litres/100km, Price: ${trip.fuelPrice.toFixed(2)}/Litre
        </div>
        {trip.notes && (
          <div className="font-body mt-2 pt-2 border-t">
            <p className="text-sm font-semibold flex items-center"><StickyNote className="mr-2 h-4 w-4 text-primary" />Notes:</p>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap pl-6">{trip.notes}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button 
            variant={trip.isCompleted ? "outline" : "default"} 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onStartTrip(trip.id); }}
            className={`font-body ${trip.isCompleted ? '' : 'bg-green-600 hover:bg-green-700 text-white'}`}
        >
          <PlayCircle className="mr-2 h-4 w-4" /> {trip.isCompleted ? "View Checklists" : "Start Trip"}
        </Button>
        
        {trip.isCompleted ? (
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onToggleComplete(trip.id); }} className="font-body">
                <RotateCcw className="mr-2 h-4 w-4" /> Reopen Trip
            </Button>
        ) : (
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onToggleComplete(trip.id); }} className="font-body">
                <CheckSquare className="mr-2 h-4 w-4" /> Mark Completed
            </Button>
        )}

        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onAddToCalendar(trip); }} className="font-body text-primary" disabled={!trip.plannedStartDate}>
          <CalendarPlus className="mr-2 h-4 w-4" /> Add to Calendar
        </Button>
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onRecall(trip); }} className="font-body">
          <Repeat className="mr-2 h-4 w-4" /> Recall
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="font-body" onClick={e => e.stopPropagation()}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={e => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the trip "{trip.name}" and its associated packing list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(trip.id)}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
