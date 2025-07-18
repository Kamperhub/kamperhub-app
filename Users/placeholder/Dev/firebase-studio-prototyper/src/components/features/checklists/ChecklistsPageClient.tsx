"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Info, ListChecks, PlusCircle, Trash2, Edit3, ChevronLeft, CheckCircle, Navigation, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import type { LoggedTrip } from '@/types/tripplanner';
import type { ChecklistItem, ChecklistStage } from '@/types/checklist';
import { useToast } from '@/hooks/use-toast';
import { updateTrip } from '@/lib/api-client';
import { fullRigChecklist, vehicleOnlyChecklist } from '@/types/checklist';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Utility to migrate old checklist format to new stage-based format
function migrateLegacyChecklist(legacyChecklist: any): ChecklistStage[] {
  if (!legacyChecklist || !Array.isArray(legacyChecklist) || legacyChecklist.some(stage => !stage.title || !Array.isArray(stage.items))) {
    // This is likely the old format { preDeparture: [], ... } or something unexpected.
    const stages: ChecklistStage[] = [];
    if (legacyChecklist?.preDeparture) {
      stages.push({ title: "Pre-Departure", items: legacyChecklist.preDeparture });
    }
    if (legacyChecklist?.campsiteSetup) {
      stages.push({ title: "Campsite Setup", items: legacyChecklist.campsiteSetup });
    }
    if (legacyChecklist?.packDown) {
      stages.push({ title: "Pack-Down", items: legacyChecklist.packDown });
    }
    if (stages.length > 0) {
      return stages;
    }
    // If migration fails or it's an unknown format, return a default
    return vehicleOnlyChecklist.map(stage => ({...stage, items: [...stage.items].map(item => ({...item}))}));
  }
  
  // If it's already the new format, just ensure it's a deep copy
  return legacyChecklist.map(stage => ({
    ...stage,
    items: stage.items.map((item: any) => ({...item})) 
  }));
}

export function ChecklistsPageClient({ serverTrips }: { serverTrips: LoggedTrip[] }) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistStage[]>([]);
  const [editingItem, setEditingItem] = useState<{ stageIndex: number; itemIndex: number } | null>(null);
  const [newItemText, setNewItemText] = useState<{ [stageIndex: number]: string }>({});

  const selectedTrip = useMemo(() => serverTrips.find(trip => trip.id === selectedTripId), [serverTrips, selectedTripId]);

  // Load and migrate checklist when a trip is selected
  useEffect(() => {
    if (selectedTrip) {
      if (selectedTrip.checklists && (Array.isArray(selectedTrip.checklists) || typeof selectedTrip.checklists === 'object')) {
         setChecklist(migrateLegacyChecklist(selectedTrip.checklists));
      } else {
        // If no checklist exists, create one from default templates
        const defaultChecklist = selectedTrip.isVehicleOnly ? vehicleOnlyChecklist : fullRigChecklist;
        setChecklist(defaultChecklist.map(stage => ({...stage, items: [...stage.items].map(item => ({...item}))}))); // Deep copy
      }
    } else {
      setChecklist([]);
    }
  }, [selectedTrip]);

  const updateTripMutation = useMutation({
    mutationFn: (updatedTrip: Partial<LoggedTrip> & { id: string }) => updateTrip(updatedTrip as LoggedTrip),
    onSuccess: (data) => {
      // Invalidate the query to refetch from the server, ensuring data consistency
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast({ title: "Checklist Saved" });
    },
    onError: (error: Error) => toast({ title: "Error Saving Checklist", description: error.message, variant: "destructive" }),
  });
  
  // Set initial trip from URL query param
  useEffect(() => {
    const tripIdFromQuery = searchParams.get('tripId');
    if (tripIdFromQuery && serverTrips.length > 0 && serverTrips.some(trip => trip.id === tripIdFromQuery)) {
      if (selectedTripId !== tripIdFromQuery) {
        setSelectedTripId(tripIdFromQuery);
      }
    }
  }, [searchParams, serverTrips, selectedTripId]);

  const { totalItems, completedItems } = useMemo(() => {
    let total = 0;
    let completed = 0;
    checklist.forEach(stage => {
      total += stage.items.length;
      completed += stage.items.filter(item => item.completed).length;
    });
    return { totalItems: total, completedItems: completed };
  }, [checklist]);
  const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const handleUpdateChecklist = (updatedChecklist: ChecklistStage[]) => {
    setChecklist(updatedChecklist);
    if(selectedTrip) {
      updateTripMutation.mutate({ id: selectedTrip.id, checklists: updatedChecklist });
    }
  };

  const handleToggleItem = (stageIndex: number, itemIndex: number) => {
    const newChecklist = [...checklist];
    const newItems = [...newChecklist[stageIndex].items];
    const itemToUpdate = { ...newItems[itemIndex] };
    itemToUpdate.completed = !itemToUpdate.completed;
    newItems[itemIndex] = itemToUpdate;
    newChecklist[stageIndex] = { ...newChecklist[stageIndex], items: newItems };
    handleUpdateChecklist(newChecklist);
  };
  
  const handleAddItem = (stageIndex: number) => {
    const text = newItemText[stageIndex]?.trim();
    if (!text) {
      toast({ title: "Cannot add empty item", variant: "destructive" });
      return;
    }
    const newItem: ChecklistItem = { id: `item_${Date.now()}`, text, completed: false };
    const newChecklist = [...checklist];
    newChecklist[stageIndex] = { ...newChecklist[stageIndex], items: [...newChecklist[stageIndex].items, newItem] };
    handleUpdateChecklist(newChecklist);
    setNewItemText(prev => ({ ...prev, [stageIndex]: '' }));
  };
  
  const handleDeleteItem = (stageIndex: number, itemIndex: number) => {
    const newChecklist = [...checklist];
    const newItems = [...newChecklist[stageIndex].items];
    newItems.splice(itemIndex, 1);
    newChecklist[stageIndex] = { ...newChecklist[stageIndex], items: newItems };
    handleUpdateChecklist(newChecklist);
  };

  const handleStartNavigation = useCallback(() => {
    if (!selectedTrip || !selectedTrip.routeDetails.startLocation || !selectedTrip.routeDetails.endLocation) {
        toast({ title: "Navigation Error", description: "Trip start or end location is missing.", variant: "destructive" });
        return;
    }
    const origin = `${selectedTrip.routeDetails.startLocation.lat},${selectedTrip.routeDetails.startLocation.lng}`;
    const destination = `${selectedTrip.routeDetails.endLocation.lat},${selectedTrip.routeDetails.endLocation.lng}`;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    window.open(googleMapsUrl, '_blank');
}, [selectedTrip, toast]);


  return (
    <div className="space-y-8">
       <Button asChild variant="link" className="p-0 h-auto font-body text-muted-foreground hover:text-primary -ml-1">
        <Link href="/trip-manager">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Return to Trip Manager
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary flex items-center"><ListChecks className="mr-3 h-8 w-8" /> Procedural Checklist</h1>
      </div>
      
      {serverTrips.length === 0 ? (
        <p className="text-muted-foreground text-center font-body py-6">No saved trips found. Plan a trip to manage its checklist.</p>
      ) : (
        <div className="mb-6">
          <Label htmlFor="trip-select" className="font-body text-base text-foreground mb-2 block">Select a Trip:</Label>
          <Select onValueChange={setSelectedTripId} value={selectedTripId || "none"}>
            <SelectTrigger id="trip-select" className="w-full md:w-[400px] font-body">
              <SelectValue placeholder="Choose a trip..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="font-body">-- Select a Trip --</SelectItem>
              {serverTrips.map(trip => <SelectItem key={trip.id} value={trip.id}>{trip.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedTripId && selectedTrip && (
        <div className="space-y-6">
          <div className="text-center">
            <Button
              onClick={handleStartNavigation}
              size="lg"
              disabled={overallProgress < 100}
              className={cn(
                "w-full font-body text-white animate-pulse",
                "disabled:animate-none disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed",
                overallProgress === 100
                  ? "bg-green-600 hover:bg-green-700"
                  : overallProgress > 0
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-destructive hover:bg-destructive/90"
              )}
            >
              <Navigation className="mr-2 h-5 w-5" /> Start Navigation
            </Button>
            {overallProgress < 100 && (
                <p className="text-xs text-muted-foreground mt-2 font-body">
                    Please complete all checklist items to enable navigation.
                </p>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Overall Progress for: {selectedTrip.name}</CardTitle>
              <CardDescription>{completedItems} of {totalItems} items completed</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={overallProgress} />
            </CardContent>
          </Card>

          {checklist.map((stage, stageIndex) => {
            const stageCompletedItems = stage.items.filter(i => i.completed).length;
            const stageTotalItems = stage.items.length;
            const stageProgress = stageTotalItems > 0 ? (stageCompletedItems / stageTotalItems) * 100 : 0;
            return (
              <Card key={stage.title}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-headline flex items-center">
                        {stageProgress === 100 && <CheckCircle className="h-5 w-5 mr-2 text-green-500" />}
                        {stage.title}
                    </CardTitle>
                    <span className="text-sm font-medium text-muted-foreground">{stageCompletedItems}/{stageTotalItems}</span>
                  </div>
                  <Progress value={stageProgress} className="mt-2" />
                </CardHeader>
                <CardContent className="space-y-2">
                  {stage.items.map((item, itemIndex) => (
                    <div key={item.id} className="flex items-center p-2 rounded-md hover:bg-muted/50">
                      <Checkbox id={item.id} checked={item.completed} onCheckedChange={() => handleToggleItem(stageIndex, itemIndex)} className="mr-3" />
                      <Label htmlFor={item.id} className={`text-base flex-grow ${item.completed ? 'line-through text-muted-foreground' : ''}`}>{item.text}</Label>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteItem(stageIndex, itemIndex)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <Input placeholder="Add new item..." value={newItemText[stageIndex] || ''} onChange={e => setNewItemText(prev => ({ ...prev, [stageIndex]: e.target.value }))} onKeyPress={e => e.key === 'Enter' && handleAddItem(stageIndex)} />
                    <Button onClick={() => handleAddItem(stageIndex)}><PlusCircle className="mr-2 h-4 w-4"/> Add</Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  );
}
