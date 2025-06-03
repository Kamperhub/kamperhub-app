"use client";

import { useState, useEffect, useMemo } from 'react';
import type { InventoryItem, CaravanWeightData } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trash2, PlusCircle, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface InventoryListProps {
  caravanSpecs: CaravanWeightData; // Assume this is passed from a parent component or context
}

export function InventoryList({ caravanSpecs }: InventoryListProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemWeight, setItemWeight] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  const totalWeight = useMemo(() => items.reduce((sum, item) => sum + item.weight, 0), [items]);
  const currentCaravanMass = caravanSpecs.tareMass + totalWeight;
  const remainingPayloadATM = caravanSpecs.atm - currentCaravanMass;
  const remainingPayloadGTM = caravanSpecs.gtm - (currentCaravanMass - (0.1 * currentCaravanMass)); // Assuming towball download is 10% of current mass for GTM check

  const atmUsagePercentage = (currentCaravanMass / caravanSpecs.atm) * 100;


  const handleAddItem = () => {
    if (!itemName || !itemWeight || isNaN(parseFloat(itemWeight))) {
      toast({ title: "Invalid Input", description: "Please enter valid item name and weight.", variant: "destructive" });
      return;
    }
    const newItem: InventoryItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      name: itemName,
      weight: parseFloat(itemWeight),
      category: itemCategory || 'General',
    };

    if (editingItem) {
      setItems(items.map(item => item.id === editingItem.id ? newItem : item));
      toast({ title: "Item Updated", description: `${newItem.name} has been updated.` });
    } else {
      setItems([...items, newItem]);
      toast({ title: "Item Added", description: `${newItem.name} has been added to inventory.` });
    }
    
    setItemName('');
    setItemWeight('');
    setItemCategory('');
    setEditingItem(null);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemWeight(item.weight.toString());
    setItemCategory(item.category);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast({ title: "Item Removed", description: "Item has been removed from inventory." });
  };

  const getAlertVariant = (percentage: number) => {
    if (percentage > 100) return "destructive";
    if (percentage > 90) return "destructive"; // Shadcn Alert doesn't have 'warning', use destructive for nearing
    return "default"; // This will look like a normal info box
  };
  
  const getProgressColor = (percentage: number) => {
    if (percentage > 100) return "bg-destructive";
    if (percentage > 90) return "bg-orange-500"; // Custom orange for warning
    return "bg-primary";
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Inventory Weight Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="itemName" className="font-body">Item Name</Label>
            <Input id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g., Camping Chair" className="font-body"/>
          </div>
          <div>
            <Label htmlFor="itemWeight" className="font-body">Weight (kg)</Label>
            <Input id="itemWeight" type="number" value={itemWeight} onChange={(e) => setItemWeight(e.target.value)} placeholder="e.g., 2.5" className="font-body"/>
          </div>
          <div>
            <Label htmlFor="itemCategory" className="font-body">Category</Label>
            <Input id="itemCategory" value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} placeholder="e.g., Furniture" className="font-body"/>
          </div>
          <Button onClick={handleAddItem} className="md:col-span-3 bg-accent hover:bg-accent/90 text-accent-foreground font-body">
            <PlusCircle className="mr-2 h-4 w-4" /> {editingItem ? 'Update Item' : 'Add Item'}
          </Button>
        </div>

        {items.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">Name</TableHead>
                <TableHead className="font-body">Category</TableHead>
                <TableHead className="text-right font-body">Weight (kg)</TableHead>
                <TableHead className="text-right font-body">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium font-body">{item.name}</TableCell>
                  <TableCell className="font-body">{item.category}</TableCell>
                  <TableCell className="text-right font-body">{item.weight.toFixed(1)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
             <TableCaption className="font-body">Total Inventory Weight: {totalWeight.toFixed(1)} kg</TableCaption>
          </Table>
        )}

        <div className="space-y-4 pt-4">
          <h3 className="text-xl font-headline text-primary">Weight Summary & Compliance</h3>
          
          <Alert variant={getAlertVariant(atmUsagePercentage)}>
            <AlertTitle className="font-headline">ATM Status: {currentCaravanMass.toFixed(1)}kg / {caravanSpecs.atm}kg</AlertTitle>
            <AlertDescription className="font-body">
              Remaining Payload (ATM): {remainingPayloadATM.toFixed(1)} kg.
              {atmUsagePercentage > 100 && " You are OVER the ATM limit!"}
              {atmUsagePercentage > 90 && atmUsagePercentage <= 100 && " You are nearing the ATM limit."}
            </AlertDescription>
            <Progress value={Math.min(atmUsagePercentage, 100)} className="mt-2 [&>div]:bg-primary" />
             {atmUsagePercentage > 100 &&  <Progress value={atmUsagePercentage - 100} className="mt-1 [&>div]:bg-destructive" />}
          </Alert>

          {/* Simplified GTM check placeholder */}
          {currentCaravanMass > caravanSpecs.gtm && (
             <Alert variant="destructive">
                <AlertTitle className="font-headline">GTM Warning</AlertTitle>
                <AlertDescription className="font-body">
                Your current estimated load might exceed GTM ({caravanSpecs.gtm}kg). Ensure proper weight distribution.
                </AlertDescription>
            </Alert>
          )}
           {/* Simplified Towball Download check placeholder */}
          {totalWeight * 0.1 > caravanSpecs.maxTowballDownload && ( // Example: 10% of payload on towball
             <Alert variant="destructive">
                <AlertTitle className="font-headline">Towball Mass Warning</AlertTitle>
                <AlertDescription className="font-body">
                Your estimated towball download might exceed the limit ({caravanSpecs.maxTowballDownload}kg). Adjust load distribution.
                </AlertDescription>
            </Alert>
          )}
        </div>

      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground font-body">
          Always verify weights at a weighbridge. Tare: {caravanSpecs.tareMass}kg, ATM: {caravanSpecs.atm}kg, GTM: {caravanSpecs.gtm}kg.
        </p>
      </CardFooter>
    </Card>
  );
}
