
"use client";

import { useState, useMemo, useCallback, useContext } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays, parseISO } from 'date-fns';
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
import { generatePackingList, type PackingListGeneratorInput } from '@/ai/flows/packing-list-generator-flow.ts';
import { generateWeatherPackingSuggestions, type WeatherPackingSuggesterOutput } from '@/ai/flows/weather-packing-suggester-flow';
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
import { Luggage, AlertTriangle, Wand2, Info, Loader2, Route, Calendar, Users, Edit3, Trash2, PlusCircle, RefreshCw, CloudRainWind, ChevronLeft } from 'lucide-react';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navContext = useContext(NavigationContext);
  
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [editingItemState, setEditingItemState] = useState<{ categoryId: string; item: PackingListItem } | null>(null);
  const [weatherSuggestions, setWeatherSuggestions] = useState<WeatherPackingSuggesterOutput | null>(null);

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
      toast({ title: 'Packing List Saved!' });
    },
    onError: (error: Error) => toast({ title: 'Save Failed', description: error.message, variant: 'destructive' }),
  });

  const generateListMutation = useMutation({
    mutationFn: generatePackingList,
    onSuccess: (data) => {
      const newUiList: PackingListCategory[] = [];
      if (data && data.packing_list) {
        data.packing_list.forEach(traveler => {
          if (traveler.categories) {
            Object.entries(traveler.categories).forEach(([categoryKey, items]) => {
              if (items && items.length > 0) {
                const categoryNameMapping: { [key: string]: string } = {
                  clothing: "Clothing",
                  toiletries_hygiene: "Toiletries & Hygiene",
                  documents_money: "Documents & Money",
                  electronics: "Electronics",
                  health_safety: "Health & Safety",
                  miscellaneous: "Miscellaneous",
                  pet_supplies: "Pet Supplies",
                  baby_supplies: "Baby Supplies",
                };

                const uiCategoryName = `${categoryNameMapping[categoryKey] || categoryKey} - ${traveler.traveler_name}`;
                
                const uiItems: PackingListItem[] = items.map(itemNameString => {
                  const match = itemNameString.match(/^(\d+)\s+(.*)$/);
                  let quantity = 1;
                  let name = itemNameString;

                  if (match) {
                    quantity = parseInt(match[1], 10);
                    name = match[2];
                  }

                  return {
                    id: `item_${name.replace(/\s+/g, '_')}_${Date.now()}_${Math.random()}`,
                    name: name,
                    quantity: quantity,
                    packed: false,
                    notes: '',
                  };
                });

                newUiList.push({
                  id: `cat_${traveler.traveler_name}_${categoryKey}`,
                  name: uiCategoryName,
                  items: uiItems,
                });
              }
            });
          }
        });
      }
      updateListMutation.mutate(newUiList);
      toast({ title: 'Packing List Generated!', description: 'Your new list has been saved.' });
    },
    onError: (error: Error) => toast({ title: 'Generation Failed', description: error.message, variant: 'destructive' }),
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

  const handleGenerateList = () => {
    if (!selectedTrip || !selectedTrip.plannedStartDate || !selectedTrip.plannedEndDate) {
        toast({ title: 'Cannot Generate List', description: 'Selected trip must have a start and end date.', variant: 'destructive'});
        return;
    }
    const travelers = selectedTrip.occupants
        ?.map(occ => ({
            name: occ.name,
            type: occ.type,
            age: occ.age ?? undefined,
            notes: occ.notes ?? undefined,
        }))
        .filter(t => t.name && t.type) // Filter out invalid occupants
        || [];

    if (travelers.length === 0) {
        travelers.push({ type: 'Adult', name: 'Traveler 1' }); // Fallback if no valid occupants found
    }

    const aiInput: PackingListGeneratorInput = {
      destination: selectedTrip.endLocationDisplay,
      departureDate: format(parseISO(selectedTrip.plannedStartDate), 'yyyy-MM-dd'),
      returnDate: format(parseISO(selectedTrip.plannedEndDate), 'yyyy-MM-dd'),
      travelers: travelers,
      activities: selectedActivities.join(', ') || 'General touring and relaxation',
    };

    generateListMutation.mutate(aiInput);
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
  
  const anyMutationLoading = generateListMutation.isPending || updateListMutation.isPending || deleteListMutation.isPending || weatherSuggestMutation.isPending;

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
        <p className="text-muted-foreground font-body mb-6">Select a trip, get AI-powered suggestions, and manage your personalized packing list.</p>
      </div>
      
      <Card>
        <CardHeader><CardTitle>1. Select Your Trip</CardTitle><CardDescription>Choose a saved trip to generate or view a packing list for.</CardDescription></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="trip-select">Saved Trip</Label>
            <Select onValueChange={setSelectedTripId} value={selectedTripId}><SelectTrigger id="trip-select"><SelectValue placeholder="Choose a trip..." /></SelectTrigger><SelectContent>{trips.map(trip => <SelectItem key={trip.id} value={trip.id}>{trip.name}</SelectItem>)}</SelectContent></Select>
          </div>
          {selectedTrip && (
            <Alert variant="default" className="bg-secondary/30 border-secondary/50">
                <Info className="h-4 w-4" /><AlertTitle className="font-headline text-foreground">{selectedTrip.name}</AlertTitle>
                <AlertDescription className="text-xs space-y-1">
                  <p className="flex items-center"><Route className="h-3 w-3 mr-1.5" />{selectedTrip.startLocationDisplay} to {selectedTrip.endLocationDisplay}</p>
                  <p className="flex items-center"><Calendar className="h-3 w-3 mr-1.5" />{selectedTrip.plannedStartDate ? format(parseISO(selectedTrip.plannedStartDate), "PP") : 'Date TBD'}</p>
                  <p className="flex items-center"><Users className="h-3 w-3 mr-1.5" />{selectedTrip.occupants?.length || 1} person(s)</p>
                </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader><CardTitle>2. Plan Activities (Optional)</CardTitle><CardDescription>Select planned activities for more tailored packing suggestions.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {activityOptions.map(group => (
              <div key={group.category}>
                <h4 className="font-semibold mb-2">{group.category}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {group.activities.map(activity => (
                    <div key={activity} className="flex items-center space-x-2">
                      <Checkbox id={`activity-${activity.replace(/\s+/g, '-')}`} checked={selectedActivities.includes(activity)} onCheckedChange={() => handleActivityChange(activity)}/>
                      <Label htmlFor={`activity-${activity.replace(/\s+/g, '-')}`} className="text-sm font-normal cursor-pointer">{activity}</Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center"><CloudRainWind className="mr-2 h-5 w-5"/>3. Get Weather-Based Suggestions</CardTitle><CardDescription>Based on your destination and trip month, get AI-powered weather tips.</CardDescription></CardHeader>
        <CardContent>
            <Button onClick={handleGetWeatherSuggestions} disabled={!selectedTripId || !selectedTrip?.plannedStartDate || anyMutationLoading}>
                {weatherSuggestMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Get Weather Suggestions
            </Button>
            {weatherSuggestions && (
                <div className="mt-4 space-y-4">
                    <Alert variant="default" className="bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4" /><AlertTitle className="font-headline">Typical Weather Summary</AlertTitle>
                        <AlertDescription>{weatherSuggestions.weatherSummary}</AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        {weatherSuggestions.suggestedItems.map(item => (
                            <div key={item.itemName} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <div>
                                    <p className="font-semibold">{item.itemName}</p>
                                    <p className="text-xs text-muted-foreground">{item.notes}</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => handleAddSuggestedItem(item)} disabled={anyMutationLoading}><PlusCircle className="mr-2 h-4 w-4"/>Add to List</Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </CardContent>
      </Card>

      {isLoadingPackingList ? <Card><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card> :
       packingListError ? <Alert variant="destructive"><AlertTitle>Error Loading List</AlertTitle><AlertDescription>{packingListError.message}</AlertDescription></Alert> :
       selectedTripId ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>4. Your Packing List</CardTitle>
                    <CardDescription>Check off items as you pack. Changes are saved automatically.</CardDescription>
                </div>
                 {packingList.length === 0 ? (
                    <Button onClick={handleGenerateList} disabled={anyMutationLoading}><Wand2 className="mr-2 h-4 w-4" />Generate List</Button>
                ) : (
                    <Button onClick={handleClearAndRegenerate} variant="destructive" disabled={anyMutationLoading}><RefreshCw className="mr-2 h-4 w-4" />Clear & Regenerate</Button>
                )}
            </div>
          </CardHeader>
          <CardContent>
            {packingList.length > 0 && (
                <Accordion type="multiple" defaultValue={packingList.map(c => c.id)} className="w-full">
                {packingList.map(category => (
                    <AccordionItem value={category.id} key={category.id}>
                    <AccordionTrigger className="font-headline text-lg">{category.name}</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                        {category.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                            <Checkbox id={item.id} checked={item.packed} onCheckedChange={() => handleTogglePacked(category.id, item.id)} disabled={anyMutationLoading}/>
                            <div className="grid gap-0.5">
                                <Label htmlFor={item.id} className={`text-base ${item.packed ? 'line-through text-muted-foreground' : ''}`}>
                                {item.name} <span className="text-muted-foreground">({item.quantity})</span>
                                </Label>
                                {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                            </div>
                            </div>
                            <div className="flex items-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingItemState({ categoryId: category.id, item })} disabled={anyMutationLoading}><Edit3 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(category.id, item.id)} disabled={anyMutationLoading}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        </div>
                        ))}
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => handleAddItem(category.id)} disabled={anyMutationLoading}><PlusCircle className="mr-2 h-4 w-4"/>Add Item</Button>
                    </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            )}
          </CardContent>
        </Card>
       ) : null
      }

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
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
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

