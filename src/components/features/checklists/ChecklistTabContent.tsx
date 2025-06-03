"use client";

import { useState, useEffect } from 'react';
import type { ChecklistItem, ChecklistCategory } from '@/types/checklist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChecklistTabContentProps {
  category: ChecklistCategory;
  initialItems: ChecklistItem[];
}

export function ChecklistTabContent({ category, initialItems }: ChecklistTabContentProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [newItemText, setNewItemText] = useState('');
  const { toast } = useToast();

  // Effect to update local storage or backend when items change
  useEffect(() => {
    // Placeholder for saving logic, e.g., localStorage.setItem(`checklist_${category}`, JSON.stringify(items));
    console.log(`Checklist ${category} updated:`, items);
  }, [items, category]);

  const handleAddItem = () => {
    if (!newItemText.trim()) {
      toast({ title: "Cannot add empty item", variant: "destructive" });
      return;
    }
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      completed: false,
    };
    setItems([...items, newItem]);
    setNewItemText('');
    toast({ title: "Item Added", description: `"${newItem.text}" added to checklist.` });
  };

  const handleToggleItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast({ title: "Item Removed", description: "Item removed from checklist." });
  };

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
            onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
          />
          <Button onClick={handleAddItem} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body">
            <PlusCircle className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>
        {items.length === 0 && <p className="text-muted-foreground text-center font-body">No items in this checklist yet.</p>}
        <ul className="space-y-3">
          {items.map(item => (
            <li key={item.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-md shadow-sm">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`item-${item.id}`}
                  checked={item.completed}
                  onCheckedChange={() => handleToggleItem(item.id)}
                />
                <Label
                  htmlFor={`item-${item.id}`}
                  className={cn("font-body text-base", item.completed && "line-through text-muted-foreground")}
                >
                  {item.text}
                </Label>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                <Trash2 className="h-5 w-5 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
