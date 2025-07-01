
"use client";

import { useState, useMemo, useCallback, useContext } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { LoggedTrip } from '@/types/tripplanner';
import type { PackingListCategory, PackingListItem } from '@/types/packing';
import { 
  fetchTrips, 
  fetchPackingList, 
  updatePackingList, 
  deletePackingList 
} from '@/lib/api-client';
import { generatePackingList, type PackingListGeneratorInput, type PackingListGeneratorOutput } from '@/ai/flows/packing-list-generator-flow';
import { generateWeatherPackingSuggestions, type WeatherPackingSuggesterOutput } from '@/ai/flows/weather-packing-suggester-flow';
import { generatePersonalizedPackingLists, type PersonalizedPackingListInput, type PersonalizedPackingListOutput, type GoogleTasksStructure } from '@/ai/flows/personalized-packing-list-flow';
import { NavigationContext } from '@/components/layout/AppShell';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Luggage, AlertTriangle, Wand2, Info, Loader2, Route, Calendar, Users, Edit3, Trash2, PlusCircle, RefreshCw, CloudRainWind, ChevronLeft, Sparkles, SendToBack, CalendarPlus } from 'lucide-react';

const activityOptions = [
  {
    category: 'Coastal & Water',
    activities: ['Beach Relaxation', 'Swimming', 'Surfing/Bodyboarding', 'Snorkeling', 'Fishing', 'Boating'],
  },
  {
    category: 'Nature & Adventure',
    activities: ['Bushwalking/Hiking', 'National Park Exploration', 'Bird Watching', 'Mountain Biking', '4WD Off-roading'],
  },
  {
    category: 'Alpine & Winter',
    activities: ['Alpine Hiking', 'Skiing/Snowboarding', 'Snow Play'],
  },
  {
    category: 'Relaxation & Leisure',
    activities: ['Relaxing at Camp', 'Reading', 'Photography', 'Campfires', 'Local Market Visits'],
  },
  {
    category: 'Urban & Cultural',
    activities: ['Visiting Museums', 'Shopping', 'Dining Out', 'Exploring Towns'],
  },
];


export default function TripPackingPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navContext = useContext(NavigationContext);
  
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [editingItemState, setEditingItemState] = useState<{ categoryId: string; item: PackingListItem } | null>(null);
  const [weatherSuggestions, setWeatherSuggestions] = useState<WeatherPackingSuggesterOutput | null>(null);
  const [personalizedLists, setPersonalizedLists] = useState<PersonalizedPackingListOutput | null>(null);

  const { data: trips = [], isLoading: isLoadingTrips, error: tripsError } = useQuery<LoggedTrip[]>({
    queryKey: ['trips', user?.uid],
    queryFn: fetchTrips,
    enabled: !!user,
  });
  
  const selectedTrip = useMemo(() => trips.find(t => t.id === selectedTripId), [trips, selectedTripId]);
  
  const { data: packingList = [], isLoading: isLoadingPackingList, error: packingListError } = useQuery<PackingListCategory[]>({
    queryKey: ['packingList', selectedTripId],
    queryFn: () => fetchPackingList(selectedTripId!).then(data => data.list || []),
    enabled: !!selectedTripId,
  });

  const updateListMutation = useMutation({
    mutationFn: (newList: PackingListCategory[]) => updatePackingList({ tripId: selectedTripId!, list: newList }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packingList', selectedTripId] });
      // Don't toast on every small change, only on major actions.
    },
    onError: (error: Error) => toast({ title: 'Save Failed', description: error.message, variant: 'destructive' }),
  });

  const generateListMutation = useMutation({
    mutationFn: generatePackingList,
    onSuccess: (data: PackingListGeneratorOutput) => {
      if (data && data.categories) {
        const newUiList: PackingListCategory[] = data.categories.map(cat => ({
          id: `cat_${cat.category_name.replace(/\s+/g, '_')}_${Date.now()}`,
          name: cat.category_name,
          items: cat.items.map(itemName => {
            const match = itemName.match(/^(\d+)\s*x\s+(.*)$/i);
            let quantity = 1;
            let name = itemName;
            if (match) {
              quantity = parseInt(match[1], 10) || 1;
              name = match[2];
            }
            return { id: `item_${name.replace(/\s+/g, '_')}_${Date.now()}_${Math.random()}`, name: name, quantity: quantity, packed: false, notes: '' };
          })
        }));
        updateListMutation.mutate(newUiList, { onSuccess: () => toast({ title: 'Master Packing List Generated!', description: 'Your new master list has been saved.' }) });
      } else {
        toast({ title: 'Generation Failed', description: 'The AI returned an unexpected format.', variant: 'destructive' });
      }
    },
    onError: (error: Error) => toast({ title: 'Generation Failed', description: error.message, variant: 'destructive' }),
  });

  const personalizeListMutation = useMutation({
    mutationFn: generatePersonalizedPackingLists,
    onSuccess: (data: PersonalizedPackingListOutput) => {
      setPersonalizedLists(data);
      toast({ title: 'Personalized Lists Created!', description: "Individual lists are ready." });
    },
    onError: (error: Error) => toast({ title: 'Personalization Failed', description: error.message, variant: 'destructive' }),
  });

  const deleteListMutation = useMutation({
    mutationFn: () => deletePackingList(selectedTripId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packingList', selectedTripId] });
      toast({ title: 'Packing List Cleared', description: 'You can now generate a new list.' });
    },
    onError: (error: Error) => toast({ title: 'Clear Failed', description: error.message, variant: 'destructive' }),
  });
  
  const weatherSuggestMutation = useMutation({
    mutationFn: generateWeatherPackingSuggestions,
    onSuccess: (data) => {
        setWeatherSuggestions(data);
        toast({ title: 'Weather Suggestions Ready!' });
    },
    onError: (error: Error) => toast({ title: 'Suggestion Failed', description: error.message, variant: 'destructive' }),
  });

  const handleNavigation = () => {
    navContext?.setIsNavigating(true);
  };

  const handleCreateGoogleTasks = useCallback((tasksData: GoogleTasksStructure) => {
    // This is where the actual API call to a new flow/endpoint would go.
    // For now, we'll simulate it.
    console.log("Simulating sending to Google Tasks:", tasksData);
    toast({
      title: "Sent to Google Tasks (Simulated)",
      description: `Task list "${tasksData.trip_task_name}" would be created now.`,
    });
  }, [toast]);

  const handleGenerateList = () => {
    if (!selectedTrip || !selectedTrip.plannedStartDate || !selectedTrip.plannedEndDate) {
        toast({ title: 'Cannot Generate List', description: 'Selected trip must have a start and end date.', variant: 'destructive'});
        return;
    }
    const travelers = selectedTrip.occupants
        ?.map(occ => ({ name: occ.name, type: occ.type, age: occ.age ?? undefined, notes: occ.notes ?? undefined }))
        .filter(t => t.name && t.type) || [];
    if (travelers.length === 0) travelers.push({ type: 'Adult', name: 'Traveler 1' });
    const aiInput: PackingListGeneratorInput = {
      destination: selectedTrip.endLocationDisplay,
      departureDate: format(parseISO(selectedTrip.plannedStartDate), 'yyyy-MM-dd'),
      returnDate: format(parseISO(selectedTrip.plannedEndDate), 'yyyy-MM-dd'),
      travelers: travelers,
      activities: selectedActivities.join(', ') || 'General touring and relaxation',
    };
    generateListMutation.mutate(aiInput);
  };
  
   const handlePersonalizeList = () => {
    if (!selectedTrip || packingList.length === 0) {
        toast({ title: 'Cannot Personalize List', description: 'A trip and a master list are required.', variant: 'destructive' });
        return;
    }
    const aiInput: PersonalizedPackingListInput = {
        trip_details: {
            name: selectedTrip.name,
            dates: `${format(parseISO(selectedTrip.plannedStartDate!), 'PP')} to ${format(parseISO(selectedTrip.plannedEndDate!), 'PP')}`,
            location_summary: weatherSuggestions?.weatherSummary || `Trip to ${selectedTrip.endLocationDisplay}`,
        },
        master_packing_list: packingList.reduce((acc, category) => {
            acc[category.name] = category.items.map(item => `${item.quantity}x ${item.name}`);
            return acc;
        }, {} as Record<string, string[]>),
        passengers: selectedTrip.occupants?.map(occ => ({
            id: occ.id,
            name: occ.name,
            type: `${occ.type}${occ.age ? ` (age ${occ.age})` : ''}`,
            specific_needs: occ.notes ? [occ.notes] : [],
        })) || [],
    };
    personalizeListMutation.mutate(aiInput);
  };

  const handleClearAndRegenerate = () => {
    if (window.confirm("Are you sure? This will clear the current list and generate a new one.")) {
      deleteListMutation.mutate(undefined, { onSuccess: () => handleGenerateList() });
    }
  };

  const handleGetWeatherSuggestions = () => {
    if (!selectedTrip || !selectedTrip.plannedStartDate) {
        toast({ title: 'Cannot Get Suggestions', description: 'Please select a trip with a start date.', variant: 'destructive' });
        return;
    }
    const durationInDays = selectedTrip.plannedStartDate && selectedTrip.plannedEndDate 
        ? differenceInDays(parseISO(selectedTrip.plannedEndDate), parseISO(selectedTrip.plannedStartDate)) + 1 : 1;
    const tripMonth = format(parseISO(selectedTrip.plannedStartDate), 'MMMM');
    weatherSuggestMutation.mutate({ destination: selectedTrip.endLocationDisplay, tripMonth, durationInDays });
  };
  
  const handleAddSuggestedItem = (itemToAdd: { itemName: string; notes?: string }) => {
    const categoryName = "Weather Suggested";
    const newList = [...packingList];
    let category = newList.find(c => c.name === categoryName);
    const newItem: PackingListItem = {
      id: `item_weather_${Date.now()}`, name: itemToAdd.itemName, quantity: 1, packed: false, notes: itemToAdd.notes,
    };
    if (category) {
      if (!category.items.some(i => i.name.toLowerCase() === newItem.name.toLowerCase())) {
        category.items.push(newItem);
      } else {
        toast({ title: "Item already exists", description: `"${itemToAdd.itemName}" is already in your list.` });
        return;
      }
    } else {
      newList.push({ id: `cat_weather_${Date.now()}`, name: categoryName, items: [newItem] });
    }
    handleListChange(newList);
    toast({ title: "Item Added", description: `"${itemToAdd.itemName}" was added to your list.` });
  };

  const handleListChange = useCallback((newList: PackingListCategory[]) => {
    updateListMutation.mutate(newList);
  }, [updateListMutation]);

  const handleTogglePacked = (categoryId: string, itemId: string) => {
    const newList = packingList.map(c => c.id === categoryId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, packed: !i.packed } : i) } : c);
    handleListChange(newList);
  };

  const handleUpdateItem = (categoryId: string, updatedItem: PackingListItem) => {
    const newList = packingList.map(c => c.id === categoryId ? { ...c, items: c.items.map(i => i.id === updatedItem.id ? updatedItem : i) } : c);
    handleListChange(newList);
    setEditingItemState(null);
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    if (window.confirm("Are you sure?")) {
      const newList = packingList.map(c => c.id === categoryId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c).filter(c => c.items.length > 0);
      handleListChange(newList);
    }
  };
  
  const handleAddItem = (categoryId: string) => {
    const newItem: PackingListItem = { id: `item_manual_${Date.now()}`, name: 'New Item', quantity: 1, packed: false, notes: '' };
    const newList = packingList.map(c => c.id === categoryId ? { ...c, items: [...c.items, newItem] } : c);
    handleListChange(newList);
  };

  const handleActivityChange = (activity: string) => {
    setSelectedActivities(prev => prev.includes(activity) ? prev.filter(a => a !== activity) : [...prev, activity]);
  };

  const handleAddToCalendar = useCallback((trip: LoggedTrip) => {
    if (!trip.plannedStartDate) {
      toast({
        title: "Cannot Add to Calendar",
        description: "This trip does not have a planned start date.",
        variant: "destructive",
      });
      return;
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const packingListUrl = `${appUrl}/trip-packing?tripId=${trip.id}`;

    const title = encodeURIComponent(trip.name);
    const details = encodeURIComponent(
      `Trip from ${trip.startLocationDisplay} to ${trip.endLocationDisplay}.\n` +
      `Distance: ${trip.routeDetails.distance}, Duration: ${trip.routeDetails.duration}.\n\n` +
      `Reminder: Pack for this trip 3 days before departure!\n` +
      `View Packing List: ${packingListUrl}`
    );
    const location = encodeURIComponent(trip.endLocationDisplay);
    const startDateFormatted = format(parseISO(trip.plannedStartDate), "yyyyMMdd");
    
    let endDateFormatted: string;
    if (trip.plannedEndDate) {
      const actualEndDate = parseISO(trip.plannedEndDate);
      endDateFormatted = format(addDays(actualEndDate, 1), "yyyyMMdd");
    } else {
      endDateFormatted = format(addDays(parseISO(trip.plannedStartDate), 1), "yyyyMMdd");
    }
    const dates = `${startDateFormatted}/${endDateFormatted}`;
    
    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    window.open(calendarUrl, '_blank');
    toast({ title: "Opening Google Calendar", description: "Check the new tab to add the event."});
  }, [toast]);
  
  const anyMutationLoading = generateListMutation.isPending || updateListMutation.isPending || deleteListMutation.isPending || weatherSuggestMutation.isPending || personalizeListMutation.isPending;

  if (isLoadingTrips) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (tripsError) return <Alert variant="destructive"><AlertTitle>Error Loading Trips</AlertTitle><AlertDescription>{tripsError.message}</AlertDescription></Alert>;

  return (
    <div className="space-y-8">
       <Button asChild variant="link" className="p-0 h-auto font-body text-muted-foreground hover:text-primary -ml-1">
        <Link href="/trip-manager" onClick={handleNavigation}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Return to Trip Manager
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-headline mb-2 text-primary flex items-center"><Luggage className="mr-3 h-8 w-8" /> Trip Packing Assistant</h1>
        <p className="text-muted-foreground font-body mb-6">A multi-step assistant to generate, personalize, and share packing lists for your trips.</p>
      </div>
      
      <Card><CardHeader><CardTitle>1. Select Your Trip</CardTitle><CardDescription>Choose a saved trip to generate or view a packing list for.</CardDescription></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-2"><Label htmlFor="trip-select">Saved Trip</Label><Select onValueChange={setSelectedTripId} value={selectedTripId}><SelectTrigger id="trip-select"><SelectValue placeholder="Choose a trip..." /></SelectTrigger><SelectContent>{trips.map(trip => <SelectItem key={trip.id} value={trip.id}>{trip.name}</SelectItem>)}</SelectContent></Select></div>
          {selectedTrip && (
            <div className="space-y-2">
                <Alert variant="default" className="bg-secondary/30 border-secondary/50"><Info className="h-4 w-4" /><AlertTitle className="font-headline text-foreground">{selectedTrip.name}</AlertTitle>
                <AlertDescription className="text-xs space-y-1"><p className="flex items-center"><Route className="h-3 w-3 mr-1.5" />{selectedTrip.startLocationDisplay} to {selectedTrip.endLocationDisplay}</p><p className="flex items-center"><Calendar className="h-3 w-3 mr-1.5" />{selectedTrip.plannedStartDate ? format(parseISO(selectedTrip.plannedStartDate), "PP") : 'Date TBD'}</p><p className="flex items-center"><Users className="h-3 w-3 mr-1.5" />{selectedTrip.occupants?.length || 1} person(s)</p></AlertDescription></Alert>
                <Button onClick={() => handleAddToCalendar(selectedTrip)} variant="outline" size="sm" className="w-full" disabled={!selectedTrip.plannedStartDate}><CalendarPlus className="mr-2 h-4 w-4"/>Add to Google Calendar</Button>
            </div>
          )}
        </CardContent>
      </Card>
      
       <Card><CardHeader><CardTitle>2. Plan Activities (Optional)</CardTitle><CardDescription>Select planned activities for more tailored packing suggestions.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">{activityOptions.map(group => (<div key={group.category}><h4 className="font-semibold mb-2">{group.category}</h4><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{group.activities.map(activity => (<div key={activity} className="flex items-center space-x-2"><Checkbox id={`activity-${activity.replace(/\s+/g, '-')}`} checked={selectedActivities.includes(activity)} onCheckedChange={() => handleActivityChange(activity)}/><Label htmlFor={`activity-${activity.replace(/\s+/g, '-')}`} className="text-sm font-normal cursor-pointer">{activity}</Label></div>))}</div></div>))}</div>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="flex items-center"><Wand2 className="mr-2 h-5 w-5"/>3. Generate Master List</CardTitle><CardDescription>Uses all trip info to generate a comprehensive list for everyone.</CardDescription></CardHeader>
        <CardContent className="flex gap-4 items-center">
            <Button onClick={handleGenerateList} disabled={!selectedTripId || anyMutationLoading}><Wand2 className="mr-2 h-4 w-4" />Generate List</Button>
            {packingList.length > 0 && <Button onClick={handleClearAndRegenerate} variant="destructive" disabled={anyMutationLoading}><RefreshCw className="mr-2 h-4 w-4" />Clear & Regenerate</Button>}
        </CardContent>
      </Card>

      {isLoadingPackingList ? <Card><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card> :
       packingListError ? <Alert variant="destructive"><AlertTitle>Error Loading List</AlertTitle><AlertDescription>{packingListError.message}</AlertDescription></Alert> :
       selectedTripId && packingList.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Your Master Packing List</CardTitle><CardDescription>Check off items as you pack. Changes are saved automatically.</CardDescription></CardHeader>
          <CardContent>
                <Accordion type="multiple" defaultValue={packingList.map(c => c.id)} className="w-full">
                {packingList.map(category => (<AccordionItem value={category.id} key={category.id}><AccordionTrigger className="font-headline text-lg">{category.name}</AccordionTrigger>
                    <AccordionContent className="space-y-2">{category.items.map(item => (<div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"><div className="flex items-center gap-3"><Checkbox id={item.id} checked={item.packed} onCheckedChange={() => handleTogglePacked(category.id, item.id)} disabled={anyMutationLoading}/><div className="grid gap-0.5"><Label htmlFor={item.id} className={`text-base ${item.packed ? 'line-through text-muted-foreground' : ''}`}>{item.name} <span className="text-muted-foreground">({item.quantity})</span></Label>{item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}</div></div><div className="flex items-center"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingItemState({ categoryId: category.id, item })} disabled={anyMutationLoading}><Edit3 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(category.id, item.id)} disabled={anyMutationLoading}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>))}<Button variant="outline" size="sm" className="mt-2" onClick={() => handleAddItem(category.id)} disabled={anyMutationLoading}><PlusCircle className="mr-2 h-4 w-4"/>Add Item</Button></AccordionContent></AccordionItem>))}
                </Accordion>
          </CardContent>
        </Card>
       ) : null
      }
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><Sparkles className="mr-2 h-5 w-5"/>4. Personalize & Share</CardTitle>
            <CardDescription>Creates individual packing lists for each passenger. You can then optionally send them to Google Tasks.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button className="mt-4" onClick={handlePersonalizeList} disabled={!selectedTripId || packingList.length === 0 || anyMutationLoading}><Users className="mr-2 h-4 w-4"/>Personalize Lists</Button>
            {personalizeListMutation.isPending && <div className="flex items-center gap-2 mt-4"><Loader2 className="h-4 w-4 animate-spin"/><p>Personalizing...</p></div>}
            {personalizedLists && (
              <div className="mt-4 space-y-4">
                {personalizedLists.passenger_lists.map(p => (
                  <Card key={p.passenger_id} className="bg-muted/50">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{p.passenger_name}'s List</CardTitle>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {/* Wrap button in a div to allow tooltip to show on disabled button */}
                              <div>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCreateGoogleTasks(p.google_tasks_structure)}
                                  disabled={!userProfile?.googleAuth?.refreshToken}
                                >
                                  <SendToBack className="mr-2 h-4 w-4"/> Send to Google Tasks
                                </Button>
                              </div>
                            </TooltipTrigger>
                            {!userProfile?.googleAuth?.refreshToken && (
                              <TooltipContent>
                                <p>Connect Google Account in My Account page.</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="whitespace-pre-wrap font-sans text-sm">{p.messenger_message}</pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
        </CardContent>
      </Card>

      {editingItemState && (<EditItemDialog isOpen={!!editingItemState} onClose={() => setEditingItemState(null)} itemState={editingItemState} onSave={handleUpdateItem}/>)}
    </div>
  );
}

interface EditItemDialogProps {
  isOpen: boolean; onClose: () => void; itemState: { categoryId: string; item: PackingListItem };
  onSave: (categoryId: string, item: PackingListItem) => void;
}

function EditItemDialog({ isOpen, onClose, itemState, onSave }: EditItemDialogProps) {
  const [name, setName] = useState(itemState.item.name);
  const [quantity, setQuantity] = useState(itemState.item.quantity);
  const [notes, setNotes] = useState(itemState.item.notes || '');
  const handleSave = () => { onSave(itemState.categoryId, { ...itemState.item, name, quantity, notes }); };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent><DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label htmlFor="edit-name">Item Name</Label><Input id="edit-name" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="edit-quantity">Quantity</Label><Input id="edit-quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></div>
          <div className="space-y-2"><Label htmlFor="edit-notes">Notes</Label><Textarea id="edit-notes" value={notes} onChange={e => setNotes(e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSave}>Save Changes</Button></div>
      </DialogContent>
    </Dialog>
  );
}
