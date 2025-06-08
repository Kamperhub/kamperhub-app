
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { ChecklistItem, ChecklistCategory } from '@/types/checklist';
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
  initialItems: ChecklistItem[];
  onChecklistChange: (category: ChecklistCategory, newItems: ChecklistItem[]) => void;
  isDisabled?: boolean;
  entityName?: string; // Name of the trip or caravan for context in toasts
}

export function ChecklistTabContent({ 
  category, 
  initialItems, 
  onChecklistChange, 
  isDisabled = false,
  entityName 
}: ChecklistTabContentProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems || []);
  const [newItemText, setNewItemText] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Update items when the passed prop changes (e.g., different trip/caravan selected)
    setItems(initialItems || []);
  }, [initialItems]);

  const handleAddItem = () => {
    if (isDisabled) {
      toast({ title: "Action Disabled", description: "Select a trip or caravan to modify its checklists.", variant: "destructive" });
      return;
    }
    if (!newItemText.trim()) {
      toast({ title: "Cannot add empty item", variant: "destructive" });
      return;
    }
    const newItem: ChecklistItem = {
      id: `${category}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text: newItemText.trim(),
      completed: false,
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onChecklistChange(category, updatedItems);
    setNewItemText('');
    toast({ title: "Item Added", description: `"${newItem.text}" added to ${category} checklist${entityName ? ` for ${entityName}` : ''}.` });
  };

  const handleToggleItem = (id: string) => {
    if (isDisabled) return;
    const updatedItems = items.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
    setItems(updatedItems);
    onChecklistChange(category, updatedItems);
  };

  const handleDeleteItem = (id: string) => {
    if (isDisabled) return;
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    onChecklistChange(category, updatedItems);
    toast({ title: "Item Removed", description: `Item removed from ${category} checklist${entityName ? ` for ${entityName}` : ''}.` });
  };

  const handleMoveItem = (id: string, direction: 'up' | 'down') => {
    if (isDisabled) return;
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
    onChecklistChange(category, newItems);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder={`Add new ${category} item...`}
            className="font-body"
            onKeyPress={(e) => e.key === 'Enter' && !isDisabled && handleAddItem()}
            disabled={isDisabled}
          />
          <Button onClick={handleAddItem} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body" disabled={isDisabled}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>
        {items.length === 0 && !isDisabled && <p className="text-muted-foreground text-center font-body">No items in this checklist.</p>}
        {items.length === 0 && isDisabled && <p className="text-muted-foreground text-center font-body">Select a trip or caravan to manage its checklists.</p>}
        
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-md shadow-sm">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`item-${category}-${item.id}`}
                  checked={item.completed}
                  onCheckedChange={() => handleToggleItem(item.id)}
                  disabled={isDisabled}
                />
                <Label
                  htmlFor={`item-${category}-${item.id}`}
                  className={cn("font-body text-base", item.completed && "line-through text-muted-foreground", isDisabled && "cursor-not-allowed opacity-70")}
                >
                  {item.text}
                </Label>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveItem(item.id, 'up')}
                  disabled={isDisabled || index === 0}
                  aria-label="Move item up"
                >
                  <ArrowUpCircle className="h-5 w-5 text-blue-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveItem(item.id, 'down')}
                  disabled={isDisabled || index === items.length - 1}
                  aria-label="Move item down"
                >
                  <ArrowDownCircle className="h-5 w-5 text-blue-500" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDeleteItem(item.id)} 
                  disabled={isDisabled}
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
