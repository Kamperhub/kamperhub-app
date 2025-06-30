
"use client";

import { useState, useMemo, useCallback } from 'react';
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
import { generatePackingList } from '@/ai/flows/packing-list-generator-flow';

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
import { Luggage, AlertTriangle, Wand2, Info, Loader2, Route, Calendar, Users, Edit3, Trash2, PlusCircle, RefreshCw } from 'lucide-react';

// New structured activity options
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
  
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  
  const [editingItemState, setEditingItemState] = useState<{ categoryId: string; item: PackingListItem } | null>(null);

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
      const listWithUiState: PackingListCategory[] = data.packingList.map(category => ({
        id: `cat_${Date.now()}_${Math.random()}`,
        name: category.category,
        items: category.items.map(item => ({
          id: `item_${Date.now()}_${Math.random()}`,
          name: item.itemName,
          quantity: item.quantity,
          packed: false,
          notes: item.notes,
        })),
      }));
      updateListMutation.mutate(listWithUiState);
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

  const handleGenerateList = () => {
    if (!selectedTrip) {
      toast({ title: 'Please select a trip first.', variant: 'destructive' });
      return;
    }
    const durationInDays = selectedTrip.plannedStartDate && selectedTrip.plannedEndDate 
      ? differenceInDays(parseISO(selectedTrip.plannedEndDate), parseISO(selectedTrip.plannedStartDate)) + 1
      : 1;

    const adults = selectedTrip.occupants?.filter(o => !o.description.toLowerCase().includes('child')).length || 1;
    const children = selectedTrip.occupants?.filter(o => o.description.toLowerCase().includes('child')).length || 0;

    generateListMutation.mutate({
      destination: selectedTrip.endLocationDisplay,
      durationInDays,
      numberOfAdults: adults,
      numberOfChildren: children,
      activities: selectedActivities.join(', ') || 'General touring and relaxation',
    });
  };

  const handleClearAndRegenerate = () => {
    if (window.confirm("Are you sure you want to clear this list and generate a new one? All current items and progress will be lost.")) {
      deleteListMutation.mutate(undefined, {
        onSuccess: () => {
          handleGenerateList();
        }
      });
    }
  };

  const handleListChange = useCallback((newList: PackingListCategory[]) => {
    updateListMutation.mutate(newList);
  }, [updateListMutation]);

  const handleTogglePacked = (categoryId: string, itemId: string) => {
    const newList = packingList.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          items: category.items.map(item => 
            item.id === itemId ? { ...item, packed: !item.packed } : item
          ),
        };
      }
      return category;
    });
    handleListChange(newList);
  };

  const handleUpdateItem = (categoryId: string, updatedItem: PackingListItem) => {
    const newList = packingList.map(category => {
        if (category.id === categoryId) {
            return {
                ...category,
                items: category.items.map(item => item.id === updatedItem.id ? updatedItem : item)
            };
        }
        return category;
    });
    handleListChange(newList);
    setEditingItemState(null);
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      const newList = packingList.map(category => {
          if(category.id === categoryId) {
              return { ...category, items: category.items.filter(item => item.id !== itemId) };
          }
          return category;
      }).filter(category => category.items.length > 0);
      handleListChange(newList);
    }
  };
  
  const handleAddItem = (categoryId: string) => {
    const newItem: PackingListItem = {
      id: `item_manual_${Date.now()}`,
      name: 'New Item',
      quantity: 1,
      packed: false,
      notes: ''
    };
    const newList = packingList.map(category => {
      if(category.id === categoryId) {
        return { ...category, items: [...category.items, newItem]};
      }
      return category;
    });
    handleListChange(newList);
  };

  const handleActivityChange = (activity: string) => {
    setSelectedActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };
  
  const anyMutationLoading = generateListMutation.isPending || updateListMutation.isPending || deleteListMutation.isPending;

  if (isLoadingTrips) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (tripsError) return <Alert variant="destructive"><AlertTitle>Error Loading Trips</AlertTitle><AlertDescription>{tripsError.message}</AlertDescription></Alert>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-2 text-primary flex items-center">
          <Luggage className="mr-3 h-8 w-8" /> Trip Packing Assistant
        </h1>
        <p className="text-muted-foreground font-body mb-6">
          Select a trip and let our AI assistant generate a personalized packing list for you. Your lists are now saved automatically.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>1. Select Your Trip</CardTitle>
          <CardDescription>Choose a saved trip to generate or view a packing list for.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="trip-select">Saved Trip</Label>
            <Select onValueChange={setSelectedTripId} value={selectedTripId}>
              <SelectTrigger id="trip-select"><SelectValue placeholder="Choose a trip..." /></SelectTrigger>
              <SelectContent>{trips.map(trip => <SelectItem key={trip.id} value={trip.id}>{trip.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {selectedTrip && (
            <Alert variant="default" className="bg-secondary/30 border-secondary/50">
                <Info className="h-4 w-4" />
                <AlertTitle className="font-headline text-foreground">{selectedTrip.name}</AlertTitle>
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
        <CardHeader>
          <CardTitle>2. Plan Activities (Optional)</CardTitle>
          <CardDescription>Select the types of activities you're planning for more tailored suggestions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {activityOptions.map(group => (
              <div key={group.category}>
                <h4 className="font-semibold mb-2">{group.category}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {group.activities.map(activity => (
                    <div key={activity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`activity-${activity.replace(/\s+/g, '-')}`}
                        checked={selectedActivities.includes(activity)}
                        onCheckedChange={() => handleActivityChange(activity)}
                      />
                      <Label
                        htmlFor={`activity-${activity.replace(/\s+/g, '-')}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {activity}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {packingList.length === 0 ? (
            <Button onClick={handleGenerateList} disabled={!selectedTripId || anyMutationLoading} className="mt-4">
              {generateListMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Generate Packing List
            </Button>
          ) : (
             <Button onClick={handleClearAndRegenerate} variant="destructive" disabled={!selectedTripId || anyMutationLoading} className="mt-4">
              {deleteListMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Clear & Regenerate List
            </Button>
          )}
        </CardContent>
      </Card>

      {isLoadingPackingList && <Card><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>}
      {packingListError && <Alert variant="destructive"><AlertTitle>Error Loading List</AlertTitle><AlertDescription>{packingListError.message}</AlertDescription></Alert>}
      
      {!isLoadingPackingList && packingList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>3. Your Packing List</CardTitle>
            <CardDescription>Check off items as you pack them. Changes are saved automatically.</CardDescription>
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
          </CardContent>
        </Card>
      )}

      {editingItemState && (
        <EditItemDialog
          isOpen={!!editingItemState}
          onClose={() => setEditingItemState(null)}
          itemState={editingItemState}
          onSave={handleUpdateItem}
        />
      )}
    </div>
  );
}

// Edit Item Dialog Component
interface EditItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemState: { categoryId: string; item: PackingListItem };
  onSave: (categoryId: string, item: PackingListItem) => void;
}

function EditItemDialog({ isOpen, onClose, itemState, onSave }: EditItemDialogProps) {
  const [name, setName] = useState(itemState.item.name);
  const [quantity, setQuantity] = useState(itemState.item.quantity);
  const [notes, setNotes] = useState(itemState.item.notes || '');

  const handleSave = () => {
    onSave(itemState.categoryId, { ...itemState.item, name, quantity, notes });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Item Name</Label>
            <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-quantity">Quantity</Label>
            <Input id="edit-quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
