
"use client";

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { LoggedTrip } from '@/types/tripplanner';
import type { PackingListCategory, PackingListItem } from '@/types/packing';
import { fetchTrips } from '@/lib/api-client';
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
import { Luggage, AlertTriangle, Wand2, Info, Loader2, Route, Calendar, Users, Edit3, Trash2, PlusCircle } from 'lucide-react';

export default function TripPackingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [activities, setActivities] = useState('');
  const [generatedList, setGeneratedList] = useState<PackingListCategory[]>([]);
  
  const [editingItemState, setEditingItemState] = useState<{ categoryId: string; item: PackingListItem } | null>(null);

  const { data: trips = [], isLoading: isLoadingTrips, error: tripsError } = useQuery<LoggedTrip[]>({
    queryKey: ['trips', user?.uid],
    queryFn: fetchTrips,
    enabled: !!user,
  });
  
  const selectedTrip = useMemo(() => trips.find(t => t.id === selectedTripId), [trips, selectedTripId]);

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
      setGeneratedList(listWithUiState);
      toast({ title: 'Packing List Generated!', description: 'Your AI-powered packing list is ready.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Generation Failed', description: error.message, variant: 'destructive' });
    }
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
      activities: activities || 'General touring and relaxation',
    });
  };

  const handleTogglePacked = (categoryId: string, itemId: string) => {
    setGeneratedList(prevList => prevList.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          items: category.items.map(item => 
            item.id === itemId ? { ...item, packed: !item.packed } : item
          ),
        };
      }
      return category;
    }));
  };

  const handleUpdateItem = (categoryId: string, updatedItem: PackingListItem) => {
    setGeneratedList(prevList => prevList.map(category => {
        if (category.id === categoryId) {
            return {
                ...category,
                items: category.items.map(item => item.id === updatedItem.id ? updatedItem : item)
            };
        }
        return category;
    }));
    setEditingItemState(null);
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    setGeneratedList(prevList => prevList.map(category => {
        if(category.id === categoryId) {
            return { ...category, items: category.items.filter(item => item.id !== itemId) };
        }
        return category;
    }));
  };
  
  const handleAddItem = (categoryId: string) => {
    const newItem: PackingListItem = {
      id: `item_manual_${Date.now()}`,
      name: 'New Item',
      quantity: 1,
      packed: false,
      notes: ''
    };
    setGeneratedList(prevList => prevList.map(category => {
      if(category.id === categoryId) {
        return { ...category, items: [...category.items, newItem]};
      }
      return category;
    }));
  };
  
  if (isLoadingTrips) return <p>Loading trips...</p>;
  if (tripsError) return <p>Error loading trips: {tripsError.message}</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-2 text-primary flex items-center">
          <Luggage className="mr-3 h-8 w-8" /> Trip Packing Assistant
        </h1>
        <p className="text-muted-foreground font-body mb-6">
          Select a trip and let our AI assistant generate a personalized packing list for you.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>1. Select Your Trip</CardTitle>
          <CardDescription>Choose a saved trip to generate a packing list for.</CardDescription>
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
          <CardDescription>Give the AI some context about what you'll be doing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activities">Planned Activities</Label>
            <Textarea id="activities" value={activities} onChange={(e) => setActivities(e.target.value)} placeholder="e.g., hiking in national parks, swimming at the beach, fishing, visiting museums." />
          </div>
          <Button onClick={handleGenerateList} disabled={!selectedTripId || generateListMutation.isPending}>
            {generateListMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate Packing List
          </Button>
        </CardContent>
      </Card>

      {generateListMutation.isPending && <Skeleton className="h-64 w-full" />}
      
      {generatedList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>3. Your Packing List</CardTitle>
            <CardDescription>Check off items as you pack them. You can add, edit, or delete items as needed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={generatedList.map(c => c.id)} className="w-full">
              {generatedList.map(category => (
                <AccordionItem value={category.id} key={category.id}>
                  <AccordionTrigger className="font-headline text-lg">{category.name}</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    {category.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Checkbox id={item.id} checked={item.packed} onCheckedChange={() => handleTogglePacked(category.id, item.id)} />
                          <Label htmlFor={item.id} className="text-base data-[state=checked]:line-through">
                            {item.name} <span className="text-muted-foreground">({item.quantity})</span>
                          </Label>
                        </div>
                        <div className="flex items-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingItemState({ categoryId: category.id, item })}><Edit3 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(category.id, item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => handleAddItem(category.id)}><PlusCircle className="mr-2 h-4 w-4"/>Add Item</Button>
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
