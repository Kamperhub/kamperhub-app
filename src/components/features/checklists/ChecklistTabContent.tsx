
"use client";

import { useState, useEffect } from 'react';
import type { ChecklistItem, ChecklistCategory, AllTripChecklists, TripChecklistSet } from '@/types/checklist';
import { TRIP_CHECKLISTS_STORAGE_KEY } from '@/types/checklist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, PlusCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChecklistTabContentProps {
  category: ChecklistCategory;
  itemsForCategory: ChecklistItem[]; // Passed directly for the selected trip
  selectedTripId: string | null; // Now refers to the ID of the selected trip
}

export function ChecklistTabContent({ category, itemsForCategory, selectedTripId }: ChecklistTabContentProps) {
  const [items, setItems] = useState<ChecklistItem[]>(itemsForCategory || []);
  const [newItemText, setNewItemText] = useState('');
  const { toast } = useToast();
  const [isLocalStorageReady, setIsLocalStorageReady] = useState(false);

  useEffect(() => {
    setIsLocalStorageReady(true);
  }, []);

  useEffect(() => {
    // Update items when the passed prop changes (e.g., different trip selected)
    setItems(itemsForCategory || []);
  }, [itemsForCategory, selectedTripId]);

  const saveChecklistToStorage = (updatedItemsForCategory: ChecklistItem[]) => {
    if (!isLocalStorageReady || typeof window === 'undefined') return;

    if (!selectedTripId) {
      if (isLocalStorageReady) { 
        toast({ title: "Cannot Save Checklist", description: "No trip selected. Changes will not be saved.", variant: "destructive" });
      }
      return;
    }

    try {
      const allTripChecklistsJson = localStorage.getItem(TRIP_CHECKLISTS_STORAGE_KEY);
      let allTripChecklists: AllTripChecklists = {};

      if (allTripChecklistsJson) {
        try {
          const parsed = JSON.parse(allTripChecklistsJson);
          if (typeof parsed === 'object' && parsed !== null) {
            allTripChecklists = parsed;
          } else {
            console.warn("Trip checklist data in localStorage was malformed. Initializing as empty object.");
          }
        } catch (e) {
          console.error("Error parsing trip checklist data from localStorage. Initializing as empty object.", e);
        }
      }
      
      // Ensure the entry for the current trip exists
      if (typeof allTripChecklists[selectedTripId] !== 'object' || allTripChecklists[selectedTripId] === null) {
        // This ideally shouldn't happen if checklists are created on trip save.
        // For robustness, create a basic structure if missing.
        console.warn(`Checklist set for trip ${selectedTripId} was missing. Initializing.`);
        allTripChecklists[selectedTripId] = { 
            tripName: "Unknown Trip (Recovered)", // Attempt to get trip name if possible, or default
            preDeparture: category === 'preDeparture' ? updatedItemsForCategory : [],
            campsiteSetup: category === 'campsiteSetup' ? updatedItemsForCategory : [],
            packDown: category === 'packDown' ? updatedItemsForCategory : [],
         };
      } else {
         // Update the specific category for the selected trip
         allTripChecklists[selectedTripId][category] = updatedItemsForCategory;
      }
      
      localStorage.setItem(TRIP_CHECKLISTS_STORAGE_KEY, JSON.stringify(allTripChecklists));
    } catch (error) {
      console.error("Error saving trip checklist to localStorage:", error);
      toast({ title: "Error Saving Checklist", description: "Could not save checklist changes for this trip.", variant: "destructive" });
    }
  };

  const handleAddItem = () => {
    if (!selectedTripId) {
      toast({ title: "Action Disabled", description: "Select a trip to modify its checklists.", variant: "destructive" });
      return;
    }
    if (!newItemText.trim()) {
      toast({ title: "Cannot add empty item", variant: "destructive" });
      return;
    }
    const newItem: ChecklistItem = {
      id: `${category}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, // Ensure unique ID for the item
      text: newItemText.trim(),
      completed: false,
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    saveChecklistToStorage(updatedItems);
    setNewItemText('');
    toast({ title: "Item Added", description: `"${newItem.text}" added to ${category} checklist for the current trip.` });
  };

  const handleToggleItem = (id: string) => {
    if (!selectedTripId) {
       toast({ title: "Action Disabled", description: "Select a trip to modify its checklists.", variant: "destructive" });
      return;
    }
    const updatedItems = items.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
    setItems(updatedItems);
    saveChecklistToStorage(updatedItems);
  };

  const handleDeleteItem = (id: string) => {
    if (!selectedTripId) {
       toast({ title: "Action Disabled", description: "Select a trip to modify its checklists.", variant: "destructive" });
      return;
    }
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    saveChecklistToStorage(updatedItems);
    toast({ title: "Item Removed", description: "Item removed from this trip's checklist." });
  };

  const handleMoveItem = (id: string, direction: 'up' | 'down') => {
    if (!selectedTripId) {
      toast({ title: "Action Disabled", description: "Select a trip to modify its checklists.", variant: "destructive" });
      return;
    }
    const itemIndex = items.findIndex(item => item.id === id);
    if (itemIndex === -1) return;

    const newItems = [...items];
    if (direction === 'up' && itemIndex > 0) {
      [newItems[itemIndex - 1], newItems[itemIndex]] = [newItems[itemIndex], newItems[itemIndex - 1]];
    } else if (direction === 'down' && itemIndex < items.length - 1) {
      [newItems[itemIndex + 1], newItems[itemIndex]] = [newItems[itemIndex], newItems[itemIndex + 1]];
    } else {
      return; 
    }

    setItems(newItems);
    saveChecklistToStorage(newItems);
  };

  const isModificationDisabled = !selectedTripId;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add new checklist item for this trip"
            className="font-body"
            onKeyPress={(e) => e.key === 'Enter' && !isModificationDisabled && handleAddItem()}
            disabled={isModificationDisabled}
          />
          <Button onClick={handleAddItem} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body" disabled={isModificationDisabled}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>
        {items.length === 0 && selectedTripId && <p className="text-muted-foreground text-center font-body">No items in this checklist for the selected trip.</p>}
        {items.length === 0 && !selectedTripId && <p className="text-muted-foreground text-center font-body">Select a trip to manage its checklists.</p>}
        
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-md shadow-sm">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`item-${category}-${item.id}`}
                  checked={item.completed}
                  onCheckedChange={() => handleToggleItem(item.id)}
                  disabled={isModificationDisabled}
                />
                <Label
                  htmlFor={`item-${category}-${item.id}`}
                  className={cn("font-body text-base", item.completed && "line-through text-muted-foreground", isModificationDisabled && "cursor-not-allowed opacity-70")}
                >
                  {item.text}
                </Label>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveItem(item.id, 'up')}
                  disabled={isModificationDisabled || index === 0}
                  aria-label="Move item up"
                >
                  <ArrowUpCircle className="h-5 w-5 text-blue-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveItem(item.id, 'down')}
                  disabled={isModificationDisabled || index === items.length - 1}
                  aria-label="Move item down"
                >
                  <ArrowDownCircle className="h-5 w-5 text-blue-500" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDeleteItem(item.id)} 
                  disabled={isModificationDisabled}
                  aria-label="Delete item"
                >
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
