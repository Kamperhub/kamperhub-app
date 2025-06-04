
"use client";

import { useState, useEffect } from 'react';
import type { ChecklistItem, ChecklistCategory, CaravanChecklists } from '@/types/checklist';
import { CHECKLISTS_STORAGE_KEY } from '@/types/checklist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChecklistTabContentProps {
  category: ChecklistCategory;
  initialItems: ChecklistItem[];
  activeCaravanId: string | null;
}

export function ChecklistTabContent({ category, initialItems, activeCaravanId }: ChecklistTabContentProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [newItemText, setNewItemText] = useState('');
  const { toast } = useToast();
  const [isLocalStorageReady, setIsLocalStorageReady] = useState(false);

  useEffect(() => {
    setIsLocalStorageReady(true);
  }, []);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems, activeCaravanId]);

  const saveChecklistToStorage = (updatedItemsForCategory: ChecklistItem[]) => {
    if (!isLocalStorageReady || typeof window === 'undefined') return;

    if (!activeCaravanId) {
      if (isLocalStorageReady) { // Only show toast if LS is ready but no caravan is active
        toast({ title: "Cannot Save Checklist", description: "No active caravan selected. Changes will not be saved.", variant: "destructive" });
      }
      return;
    }

    try {
      const allCaravanChecklistsJson = localStorage.getItem(CHECKLISTS_STORAGE_KEY);
      let allCaravanChecklists: CaravanChecklists = {};

      if (allCaravanChecklistsJson) {
        try {
          const parsed = JSON.parse(allCaravanChecklistsJson);
          // Ensure the parsed data is an object; otherwise, initialize as empty.
          if (typeof parsed === 'object' && parsed !== null) {
            allCaravanChecklists = parsed;
          } else {
            console.warn("Checklist data in localStorage was malformed. Initializing as empty object.");
          }
        } catch (e) {
          console.error("Error parsing checklist data from localStorage. Initializing as empty object.", e);
          // If parsing fails, allCaravanChecklists remains {}
        }
      }
      
      // Ensure the entry for the active caravan exists and is an object
      if (typeof allCaravanChecklists[activeCaravanId] !== 'object' || allCaravanChecklists[activeCaravanId] === null) {
        allCaravanChecklists[activeCaravanId] = {};
      }
      
      // The activeCaravanId is guaranteed to be non-null here due to the earlier guard.
      // The ! operator is safe if the logic correctly ensures activeCaravanId is a string.
      allCaravanChecklists[activeCaravanId]![category] = updatedItemsForCategory;
      
      localStorage.setItem(CHECKLISTS_STORAGE_KEY, JSON.stringify(allCaravanChecklists));
    } catch (error) {
      console.error("Error saving checklist to localStorage:", error);
      toast({ title: "Error Saving Checklist", description: "Could not save checklist changes.", variant: "destructive" });
    }
  };

  const handleAddItem = () => {
    if (!activeCaravanId) {
      toast({ title: "Action Disabled", description: "Select an active caravan to modify checklists.", variant: "destructive" });
      return;
    }
    if (!newItemText.trim()) {
      toast({ title: "Cannot add empty item", variant: "destructive" });
      return;
    }
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      completed: false,
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    saveChecklistToStorage(updatedItems);
    setNewItemText('');
    toast({ title: "Item Added", description: `"${newItem.text}" added to ${category} checklist.` });
  };

  const handleToggleItem = (id: string) => {
    if (!activeCaravanId) {
       toast({ title: "Action Disabled", description: "Select an active caravan to modify checklists.", variant: "destructive" });
      return;
    }
    const updatedItems = items.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
    setItems(updatedItems);
    saveChecklistToStorage(updatedItems);
  };

  const handleDeleteItem = (id: string) => {
    if (!activeCaravanId) {
       toast({ title: "Action Disabled", description: "Select an active caravan to modify checklists.", variant: "destructive" });
      return;
    }
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    saveChecklistToStorage(updatedItems);
    toast({ title: "Item Removed", description: "Item removed from checklist." });
  };

  const isModificationDisabled = !activeCaravanId;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add new checklist item"
            className="font-body"
            onKeyPress={(e) => e.key === 'Enter' && !isModificationDisabled && handleAddItem()}
            disabled={isModificationDisabled}
          />
          <Button onClick={handleAddItem} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body" disabled={isModificationDisabled}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>
        {items.length === 0 && activeCaravanId && <p className="text-muted-foreground text-center font-body">No items in this checklist for the active caravan.</p>}
        {items.length === 0 && !activeCaravanId && <p className="text-muted-foreground text-center font-body">This default checklist is empty. Select an active caravan to add items.</p>}
        
        <ul className="space-y-3">
          {items.map(item => (
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
              <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} disabled={isModificationDisabled}>
                <Trash2 className="h-5 w-5 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
