
"use client";

import { useState, useMemo, useCallback, useContext, useRef } from 'react';
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
  const personalizedListsRef = useRef<HTMLDivElement>(null);

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
        queryClient.invalidateQueries({ queryKey: ['packingList', selectedTripId] });
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
      setTimeout(() => {
        personalizedListsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    },
    onError: (error: Error) => {
        let errorMessage = error.message;
        if (error.message.includes('expected 2-4 sections')) {
            errorMessage = "The AI could not generate a valid list. This can happen with very unusual destinations. Please try adjusting your trip details.";
        } else if (error.message.includes("single passenger")) {
            // Refined error handling based on new prompt logic.
            errorMessage = "The AI is designed to create unique lists for multiple passengers. For a single passenger, the master list is their personal list. You can send it directly to Google Tasks."
        }
        toast({ title: 'Personalization Failed', description: errorMessage, variant: 'destructive' });
    }
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
  
  const { mutate: createGoogleTasks, isPending: isCreatingTasks, variables: creatingTasksVariables } = useMutation({
    mutationFn: async (tasksData: GoogleTasksStructure) => {
      if (!user) throw new Error("User not authenticated");
      const idToken = await user.getIdToken(true);
      const response = await fetch('/api/google-tasks/create-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(tasksData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Google Tasks list.');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Google Tasks List Created!",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create List",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNavigation = () => {
    navContext?.setIsNavigating(true);
  };
  
  const handleSendMasterListToGoogle = useCallback(() => {
    if (!selectedTrip) return;
    const tasksData: GoogleTasksStructure = {
      trip_task_name: `Packing List for: ${selectedTrip.name}`,
      categories: packingList.map(category => ({
        category_name: category.name,
        items: category.items.map(item => `${item.quantity}x ${item.name}${item.notes ? ` (${item.notes})` : ''}`)
      }))
    };
    createGoogleTasks(tasksData);
  }, [selectedTrip, packingList, createGoogleTasks]);

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
      weatherSummary: weatherSuggestions?.weatherSummary,
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
    if (window.confirm("Are you sure? This will clear the current list and you will need to generate a new one.")) {
      deleteListMutation.mutate();
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
  
  const handleAddToCalendar = useCallback((trip: LoggedTrip) => {
    if (!trip.plannedStartDate) {
      toast({ title: "Cannot Add to Calendar", description: "This trip does not have a planned start date.", variant: "destructive"});
      return;
    }
    const appUrl = window.location.origin;
    const packingListUrl = `${appUrl}/trip-packing?tripId=${trip.id}`;

    const title = encodeURIComponent(trip.name);
    const details = encodeURIComponent(
      `Trip from ${trip.startLocationDisplay} to ${trip.endLocationDisplay}.\n` +
      `Distance: ${trip.routeDetails.distance.text}, Duration: ${trip.routeDetails.duration.text}.\n\n` +
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
  
  const handleListChange = useCallback((newList: PackingListCategory[], successMessage?: { title: string, description: string }) => {
    updateListMutation.mutate(newList, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['packingList', selectedTripId] });
            if (successMessage) {
                toast(successMessage);
            }
        }
    });
  }, [updateListMutation, queryClient, selectedTripId, toast]);

  const handleTogglePacked = (categoryId: string, itemId: string) => {
    const newList = packingList.map(c => c.id === categoryId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, packed: !i.packed } : i) } : c);
    handleListChange(newList);
  };

  const handleUpdateItem = (categoryId: string, updatedItem: PackingListItem) => {
    const newList = packingList.map(c => c.id === categoryId ? { ...c, items: c.items.map(i => i.id === updatedItem.id ? updatedItem : i) } : c);
    handleListChange(newList, { title: "Item Updated", description: `"${updatedItem.name}" has been updated.` });
    setEditingItemState(null);
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    if (window.confirm("Are you sure?")) {
      const newList = packingList.map(c => c.id === categoryId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c).filter(c => c.items.length > 0);
      handleListChange(newList, { title: "Item Deleted", description: "The item has been removed from your list." });
    }
  };
  
  const handleAddItem = (categoryId: string) => {
    const newItem: PackingListItem = { id: `item_manual_${Date.now()}`, name: 'New Item', quantity: 1, packed: false, notes: '' };
    const newList = packingList.map(c => c.id === categoryId ? { ...c, items: [...c.items, newItem] } : c);
    handleListChange(newList, { title: "Item Added", description: "A new item was added to your list." });
  };

  const handleActivityChange = (activity: string) => {
    setSelectedActivities(prev => prev.includes(activity) ? prev.filter(a => a !== activity) : [...prev, activity]);
  };
  
  const anyMajorMutationLoading = generateListMutation.isPending || updateListMutation.isPending || deleteListMutation.isPending || personalizeListMutation.isPending;
  const isGoogleTasksConnected = !!userProfile?.googleAuth?.refreshToken;

  if (isLoadingTrips) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (tripsError) return <Alert variant="destructive"><AlertTitle>Error Loading Trips</AlertTitle><AlertDescription>{(tripsError as Error).message}</AlertDescription></Alert>;

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
      
      <Card><CardHeader><CardTitle>1. Select Your Trip</CardTitle><CardDescription>Choose a saved trip to manage its packing list.</CardDescription></CardHeader>
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
      
      {selectedTripId && (
        <>
          {isLoadingPackingList ? (
            <Card><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          ) : packingListError ? (
            <Alert variant="destructive"><AlertTitle>Error Loading List</AlertTitle><AlertDescription>{(packingListError as Error).message}</AlertDescription></Alert>
          ) : packingList.length > 0 ? (
            // RECALL / EDIT VIEW
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Your Packing List for "{selectedTrip?.name}"</CardTitle>
                  <CardDescription>Review and edit your list, then personalize and share it below.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" defaultValue={packingList.map(c => c.id)} className="w-full">
                    {packingList.map(category => (
                      <AccordionItem value={category.id} key={category.id}>
                        <AccordionTrigger className="font-headline text-lg">{category.name}</AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          {category.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                              <div className="flex items-center gap-3">
                                <Checkbox id={item.id} checked={item.packed} onCheckedChange={() => handleTogglePacked(category.id, item.id)} disabled={updateListMutation.isPending}/>
                                <div className="grid gap-0.5">
                                  <Label htmlFor={item.id} className={`text-base ${item.packed ? 'line-through text-muted-foreground' : ''}`}>{item.name} <span className="text-muted-foreground">({item.quantity})</span></Label>
                                  {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                                </div>
                              </div>
                              <div className="flex items-center">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingItemState({ categoryId: category.id, item })} disabled={updateListMutation.isPending}><Edit3 className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(category.id, item.id)} disabled={updateListMutation.isPending}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" className="mt-2" onClick={() => handleAddItem(category.id)} disabled={updateListMutation.isPending}><PlusCircle className="mr-2 h-4 w-4"/>Add Item</Button>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  <div className="mt-6 border-t pt-4 flex flex-wrap gap-2 justify-between items-center">
                    <Button onClick={handleClearAndRegenerate} variant="destructive" disabled={anyMajorMutationLoading}><RefreshCw className="mr-2 h-4 w-4" />Clear List & Start Over</Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button onClick={handleSendMasterListToGoogle} variant="outline" disabled={isCreatingTasks || anyMajorMutationLoading || !isGoogleTasksConnected}>
                              {isCreatingTasks && creatingTasksVariables?.trip_task_name.includes(selectedTrip?.name || '|||') ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <SendToBack className="mr-2 h-4 w-4"/>}
                               Send Master List to Google Tasks
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {!isGoogleTasksConnected && (<TooltipContent><p>Connect your Google Account on the My Account page.</p></TooltipContent>)}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>

              {selectedTrip && (selectedTrip.occupants?.length || 0) > 1 && (
                <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center"><Sparkles className="mr-2 h-5 w-5"/>Personalize & Share</CardTitle>
                      <CardDescription>Creates individual packing lists for each passenger based on the list above.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button onClick={handlePersonalizeList} disabled={anyMajorMutationLoading}><Users className="mr-2 h-4 w-4"/>Personalize Lists</Button>
                      {personalizeListMutation.isPending && <div className="flex items-center gap-2 mt-4"><Loader2 className="h-4 w-4 animate-spin"/><p>Personalizing...</p></div>}
                      {personalizedLists && (
                        <div ref={personalizedListsRef} className="mt-4 space-y-4">
                          <h4 className="font-headline text-lg text-primary pt-4 border-t">Generated Lists:</h4>
                          {personalizedLists.passenger_lists.map(p => {
                            const isThisListSending = isCreatingTasks && creatingTasksVariables?.trip_task_name === p.google_tasks_structure.trip_task_name;
                            return (
                                <Card key={p.passenger_id} className="bg-muted/50">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                    <CardTitle>{p.passenger_name}'s List</CardTitle>
                                    <TooltipProvider>
                                        <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                            <Button size="sm" variant="outline" onClick={() => createGoogleTasks(p.google_tasks_structure)} disabled={isThisListSending || isCreatingTasks || !isGoogleTasksConnected}>
                                                {isThisListSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <SendToBack className="mr-2 h-4 w-4"/>}
                                                Send to Google Tasks
                                            </Button>
                                            </div>
                                        </TooltipTrigger>
                                        {!isGoogleTasksConnected && (<TooltipContent><p>Connect Google Account in My Account page.</p></TooltipContent>)}
                                        </Tooltip>
                                    </TooltipProvider>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <pre className="whitespace-pre-wrap font-sans text-sm">{p.messenger_message}</pre>
                                </CardContent>
                                </Card>
                            )
                           })}
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            // CREATE NEW LIST VIEW
            <>
              <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>Create a Packing List</AlertTitle>
                <AlertDescription>No packing list found for "{selectedTrip?.name}". Follow the steps below to create one.</AlertDescription>
              </Alert>
              <Card><CardHeader><CardTitle>2. Plan Activities (Optional)</CardTitle><CardDescription>Select planned activities for more tailored packing suggestions.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">{activityOptions.map(group => (<div key={group.category}><h4 className="font-semibold mb-2">{group.category}</h4><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{group.activities.map(activity => (<div key={activity} className="flex items-center space-x-2"><Checkbox id={`activity-${activity.replace(/\s+/g, '-')}`} checked={selectedActivities.includes(activity)} onCheckedChange={() => handleActivityChange(activity)}/><Label htmlFor={`activity-${activity.replace(/\s+/g, '-')}`} className="text-sm font-normal cursor-pointer">{activity}</Label></div>))}</div></div>))}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><CloudRainWind className="mr-2 h-5 w-5 text-primary"/>3. Get Weather Suggestions (Optional)</CardTitle>
                  <CardDescription>Get AI-powered suggestions based on typical weather for your destination and travel month.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleGetWeatherSuggestions} disabled={!selectedTripId || generateListMutation.isPending || weatherSuggestMutation.isPending} variant="outline">
                    {weatherSuggestMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                    Get Weather Suggestions
                  </Button>
                  {weatherSuggestions && (
                    <Alert className="mt-4">
                      <AlertTitle className="font-headline">{weatherSuggestions.weatherSummary}</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          {weatherSuggestions.suggestedItems.map(item => (
                            <li key={item.itemName}><strong>{item.itemName}:</strong> {item.notes}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              <Card><CardHeader><CardTitle className="flex items-center"><Wand2 className="mr-2 h-5 w-5"/>4. Generate Master List</CardTitle><CardDescription>Uses all trip info to generate a comprehensive list for everyone.</CardDescription></CardHeader>
                <CardContent className="flex gap-4 items-center">
                    <Button onClick={handleGenerateList} disabled={!selectedTripId || generateListMutation.isPending || weatherSuggestMutation.isPending}><Wand2 className="mr-2 h-4 w-4" />Generate List</Button>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

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
