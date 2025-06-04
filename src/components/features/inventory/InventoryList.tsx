
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
  caravanSpecs: CaravanWeightData;
}

export function InventoryList({ caravanSpecs }: InventoryListProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemWeight, setItemWeight] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1'); // Default quantity to 1
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  const totalWeight = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  }, [items]);

  const currentCaravanMass = caravanSpecs.tareMass + totalWeight;
  const remainingPayloadATM = caravanSpecs.atm - currentCaravanMass;
  // GTM calculation is complex and depends on towball download, which varies with load distribution.
  // For simplicity, we'll use a rough GTM check here. A more accurate GTM would need towball weight input.
  const estimatedTowballDownload = totalWeight * 0.1; // Common estimate: 10% of payload
  const currentLoadOnAxles = currentCaravanMass - estimatedTowballDownload;
  const remainingPayloadGTM = caravanSpecs.gtm - currentLoadOnAxles;


  const atmUsagePercentage = caravanSpecs.atm > 0 ? (currentCaravanMass / caravanSpecs.atm) * 100 : 0;


  const handleAddItem = () => {
    const weight = parseFloat(itemWeight);
    const quantity = parseInt(itemQuantity, 10);

    if (!itemName.trim()) {
      toast({ title: "Invalid Input", description: "Please enter a valid item name.", variant: "destructive" });
      return;
    }
    if (isNaN(weight) || weight <= 0) {
      toast({ title: "Invalid Weight", description: "Item weight must be a positive number.", variant: "destructive" });
      return;
    }
    if (isNaN(quantity) || quantity < 1) {
      toast({ title: "Invalid Quantity", description: "Item quantity must be at least 1.", variant: "destructive" });
      return;
    }

    const newItem: InventoryItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      name: itemName.trim(),
      weight: weight,
      quantity: quantity,
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
    setItemQuantity('1'); // Reset quantity to 1
    setEditingItem(null);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemWeight(item.weight.toString());
    setItemQuantity(item.quantity.toString());
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast({ title: "Item Removed", description: "Item has been removed from inventory." });
  };

  const getAlertVariant = (percentage: number) => {
    if (percentage > 100) return "destructive";
    if (percentage > 90) return "destructive"; 
    return "default";
  };
  
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
            <Label htmlFor="itemWeight" className="font-body">Weight per Item (kg)</Label>
            <Input id="itemWeight" type="number" value={itemWeight} onChange={(e) => setItemWeight(e.target.value)} placeholder="e.g., 2.5" className="font-body"/>
          </div>
          <div>
            <Label htmlFor="itemQuantity" className="font-body">Quantity</Label>
            <Input id="itemQuantity" type="number" min="1" value={itemQuantity} onChange={(e) => setItemQuantity(e.target.value)} placeholder="e.g., 2" className="font-body"/>
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
                <TableHead className="text-center font-body">Qty</TableHead>
                <TableHead className="text-right font-body">Unit Wt. (kg)</TableHead>
                <TableHead className="text-right font-body">Total Wt. (kg)</TableHead>
                <TableHead className="text-right font-body">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium font-body">{item.name}</TableCell>
                  <TableCell className="text-center font-body">{item.quantity}</TableCell>
                  <TableCell className="text-right font-body">{item.weight.toFixed(1)}</TableCell>
                  <TableCell className="text-right font-body font-semibold">{(item.weight * item.quantity).toFixed(1)}</TableCell>
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
             <TableCaption className="font-body text-base">Total Inventory Weight: {totalWeight.toFixed(1)} kg</TableCaption>
          </Table>
        )}

        <div className="space-y-4 pt-4">
          <h3 className="text-xl font-headline text-primary">Weight Summary & Compliance</h3>
          
          <Alert variant={getAlertVariant(atmUsagePercentage)}>
            <AlertTitle className="font-headline">ATM Status: {currentCaravanMass.toFixed(1)}kg / {caravanSpecs.atm > 0 ? caravanSpecs.atm.toFixed(0) : 'N/A'}kg</AlertTitle>
            <AlertDescription className="font-body">
              Remaining Payload (ATM): {caravanSpecs.atm > 0 ? remainingPayloadATM.toFixed(1) : 'N/A'} kg.
              {atmUsagePercentage > 100 && caravanSpecs.atm > 0 && " You are OVER the ATM limit!"}
              {atmUsagePercentage > 90 && atmUsagePercentage <= 100 && caravanSpecs.atm > 0 && " You are nearing the ATM limit."}
              {caravanSpecs.atm === 0 && " ATM not specified for active caravan. Cannot calculate usage."}
            </AlertDescription>
            {caravanSpecs.atm > 0 && <Progress value={Math.min(atmUsagePercentage, 100)} className="mt-2 [&>div]:bg-primary" />}
            {caravanSpecs.atm > 0 && atmUsagePercentage > 100 &&  <Progress value={atmUsagePercentage - 100} className="mt-1 [&>div]:bg-destructive" />}
          </Alert>

          {caravanSpecs.gtm > 0 && (
            <Alert variant={currentLoadOnAxles > caravanSpecs.gtm ? "destructive" : "default"}>
                <AlertTitle className="font-headline">GTM Status: {currentLoadOnAxles.toFixed(1)}kg / {caravanSpecs.gtm.toFixed(0)}kg</AlertTitle>
                <AlertDescription className="font-body">
                Remaining Payload (GTM): {remainingPayloadGTM.toFixed(1)} kg. 
                Ensure proper weight distribution. Towball download significantly impacts GTM.
                {currentLoadOnAxles > caravanSpecs.gtm && " You may be OVER the GTM limit!"}
                </AlertDescription>
                {caravanSpecs.gtm > 0 && <Progress value={Math.min((currentLoadOnAxles/caravanSpecs.gtm)*100, 100)} className="mt-2 [&>div]:bg-primary" />}
                 {caravanSpecs.gtm > 0 && currentLoadOnAxles > caravanSpecs.gtm &&  <Progress value={((currentLoadOnAxles/caravanSpecs.gtm)*100) - 100} className="mt-1 [&>div]:bg-destructive" />}
            </Alert>
          )}
           
          {caravanSpecs.maxTowballDownload > 0 && (
            <Alert variant={estimatedTowballDownload > caravanSpecs.maxTowballDownload ? "destructive" : "default"}>
                <AlertTitle className="font-headline">Est. Towball Download: {estimatedTowballDownload.toFixed(1)}kg / {caravanSpecs.maxTowballDownload.toFixed(0)}kg</AlertTitle>
                <AlertDescription className="font-body">
                Remaining Capacity (Towball): {(caravanSpecs.maxTowballDownload - estimatedTowballDownload).toFixed(1)} kg. 
                Adjust load distribution for optimal towball mass (typically 7-15% of ATM).
                {estimatedTowballDownload > caravanSpecs.maxTowballDownload && " Your estimated towball download might EXCEED the limit!"}
                </AlertDescription>
                 {caravanSpecs.maxTowballDownload > 0 && <Progress value={Math.min((estimatedTowballDownload/caravanSpecs.maxTowballDownload)*100, 100)} className="mt-2 [&>div]:bg-primary" />}
                 {caravanSpecs.maxTowballDownload > 0 && estimatedTowballDownload > caravanSpecs.maxTowballDownload &&  <Progress value={((estimatedTowballDownload/caravanSpecs.maxTowballDownload)*100) - 100} className="mt-1 [&>div]:bg-destructive" />}
            </Alert>
          )}
        </div>

      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground font-body">
          Always verify weights at a weighbridge. 
          Your caravan's specs: Tare: {caravanSpecs.tareMass > 0 ? `${caravanSpecs.tareMass.toFixed(0)}kg` : 'N/A'}, 
          ATM: {caravanSpecs.atm > 0 ? `${caravanSpecs.atm.toFixed(0)}kg` : 'N/A'}, 
          GTM: {caravanSpecs.gtm > 0 ? `${caravanSpecs.gtm.toFixed(0)}kg` : 'N/A'}.
          <br />
          Tare: Base weight of the empty caravan. ATM: Max loaded weight (uncoupled). GTM: Max weight on axles (coupled). Towball Download: Downward force on towbar.
        </p>
      </CardFooter>
    </Card>
  );
}
