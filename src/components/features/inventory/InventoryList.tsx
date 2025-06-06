
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { InventoryItem, CaravanWeightData, CaravanInventories } from '@/types/inventory';
import { INVENTORY_STORAGE_KEY } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trash2, PlusCircle, Edit3, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface InventoryListProps {
  caravanSpecs: CaravanWeightData;
  initialCaravanInventory: InventoryItem[];
  activeCaravanId: string | null;
}

export function InventoryList({ caravanSpecs, initialCaravanInventory, activeCaravanId }: InventoryListProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialCaravanInventory || []);
  const [itemName, setItemName] = useState('');
  const [itemWeight, setItemWeight] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();
  const [isLocalStorageReady, setIsLocalStorageReady] = useState(false);

  useEffect(() => {
    setIsLocalStorageReady(true);
  }, []);
  
  useEffect(() => {
    setItems(initialCaravanInventory || []);
  }, [initialCaravanInventory, activeCaravanId]);


  const saveInventoryToStorage = (updatedItemsForCurrentCaravan: InventoryItem[]) => {
    if (!activeCaravanId || !isLocalStorageReady || typeof window === 'undefined') {
      if(!activeCaravanId) {
        toast({ title: "Cannot Save Inventory", description: "No active caravan selected.", variant: "destructive" });
      }
      return;
    }
    try {
      const allInventoriesJson = localStorage.getItem(INVENTORY_STORAGE_KEY);
      const allInventories: CaravanInventories = allInventoriesJson ? JSON.parse(allInventoriesJson) : {};
      allInventories[activeCaravanId] = updatedItemsForCurrentCaravan;
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(allInventories));
    } catch (error) {
      console.error("Error saving inventory to localStorage:", error);
      toast({ title: "Error Saving Inventory", description: "Could not save inventory changes.", variant: "destructive" });
    }
  };

  const totalWeight = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  }, [items]);

  const currentCaravanMass = caravanSpecs.tareMass + totalWeight;
  const remainingPayloadATM = caravanSpecs.atm > 0 ? caravanSpecs.atm - currentCaravanMass : 0;
  
  const estimatedTowballDownload = totalWeight * 0.1; 
  const currentLoadOnAxles = currentCaravanMass - estimatedTowballDownload;
  const remainingPayloadGTM = caravanSpecs.gtm > 0 ? caravanSpecs.gtm - currentLoadOnAxles : 0;

  const atmUsagePercentage = caravanSpecs.atm > 0 ? (currentCaravanMass / caravanSpecs.atm) * 100 : 0;
  const gtmUsagePercentage = caravanSpecs.gtm > 0 ? (currentLoadOnAxles / caravanSpecs.gtm) * 100 : 0;
  const towballUsagePercentage = caravanSpecs.maxTowballDownload > 0 ? (estimatedTowballDownload / caravanSpecs.maxTowballDownload) * 100 : 0;

  const handleAddItem = () => {
    if (!activeCaravanId) {
      toast({ title: "No Active Caravan", description: "Please select an active caravan to add items.", variant: "destructive" });
      return;
    }
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
    
    let updatedItems;
    if (editingItem) {
      updatedItems = items.map(item => item.id === editingItem.id ? newItem : item);
      toast({ title: "Item Updated", description: `${newItem.name} has been updated.` });
    } else {
      updatedItems = [...items, newItem];
      toast({ title: "Item Added", description: `${newItem.name} has been added to inventory.` });
    }
    
    setItems(updatedItems);
    saveInventoryToStorage(updatedItems);
    
    setItemName('');
    setItemWeight('');
    setItemQuantity('1');
    setEditingItem(null);
  };

  const handleEditItem = (itemToEdit: InventoryItem) => {
    if (!activeCaravanId) {
      toast({ title: "No Active Caravan", description: "Please select an active caravan to edit items.", variant: "destructive" });
      return;
    }
    setEditingItem(itemToEdit);
    setItemName(itemToEdit.name);
    setItemWeight(itemToEdit.weight.toString());
    setItemQuantity(itemToEdit.quantity.toString());
  };

  const handleDeleteItem = (id: string) => {
    if (!activeCaravanId) {
      toast({ title: "No Active Caravan", description: "Please select an active caravan to delete items.", variant: "destructive" });
      return;
    }
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    saveInventoryToStorage(updatedItems);
    toast({ title: "Item Removed", description: "Item has been removed from inventory." });
  };

  const getAlertStylingVariant = (currentValue: number, limit: number) => {
    if (limit <= 0) return "default";
    if (currentValue > limit) return "destructive";
    return "default";
  };
  
  const isFormDisabled = !activeCaravanId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Inventory Weight Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isFormDisabled && (
            <Alert variant="default" className="bg-muted">
                <AlertTriangle className="h-4 w-4 text-foreground" />
                <AlertTitle className="font-headline text-foreground">Select Active Caravan</AlertTitle>
                <AlertDescription className="font-body text-muted-foreground">
                Inventory management is disabled. Please set an active caravan in the 'Vehicles' section to add or modify items.
                </AlertDescription>
            </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="itemName" className="font-body">Item Name</Label>
            <Input id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g., Camping Chair" className="font-body" disabled={isFormDisabled}/>
          </div>
          <div>
            <Label htmlFor="itemWeight" className="font-body">Weight per Item (kg)</Label>
            <Input id="itemWeight" type="number" value={itemWeight} onChange={(e) => setItemWeight(e.target.value)} placeholder="e.g., 2.5" className="font-body" disabled={isFormDisabled}/>
          </div>
          <div>
            <Label htmlFor="itemQuantity" className="font-body">Quantity</Label>
            <Input id="itemQuantity" type="number" min="1" value={itemQuantity} onChange={(e) => setItemQuantity(e.target.value)} placeholder="e.g., 2" className="font-body" disabled={isFormDisabled}/>
          </div>
          <Button onClick={handleAddItem} className="md:col-span-3 bg-accent hover:bg-accent/90 text-accent-foreground font-body" disabled={isFormDisabled}>
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
                    <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)} disabled={isFormDisabled}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} disabled={isFormDisabled}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
             <TableCaption className="font-body text-base">Total Inventory Weight: {totalWeight.toFixed(1)} kg</TableCaption>
          </Table>
        )}
        {items.length === 0 && activeCaravanId && (
             <p className="text-muted-foreground text-center font-body">No inventory items added for the active caravan yet.</p>
        )}


        <div className="space-y-4 pt-4">
          <h3 className="text-xl font-headline text-primary">Weight Summary & Compliance</h3>
          
          <Alert variant={getAlertStylingVariant(currentCaravanMass, caravanSpecs.atm)}>
            <AlertTitle className="font-headline">ATM Status: {currentCaravanMass.toFixed(1)}kg / {caravanSpecs.atm > 0 ? caravanSpecs.atm.toFixed(0) : 'N/A'}kg</AlertTitle>
            <AlertDescription className="font-body">
              {caravanSpecs.atm > 0 ? (
                <>
                  Remaining Payload (ATM): {remainingPayloadATM.toFixed(1)} kg.
                  {atmUsagePercentage > 100 ? (
                    <>
                      <br />
                      <span className="font-semibold">You are OVER the ATM limit!</span>
                      {" Suggestions: Remove heavy items, choose lighter alternatives, or reduce quantities."}
                    </>
                  ) : atmUsagePercentage > 90 ? (
                    " You are nearing the ATM limit."
                  ) : (
                    "" 
                  )}
                </>
              ) : (
                "ATM not specified for active caravan. Cannot calculate usage."
              )}
            </AlertDescription>
            {caravanSpecs.atm > 0 && (
              <>
                <Progress value={Math.min(atmUsagePercentage, 100)} className="mt-2 [&>div]:bg-foreground" />
                {atmUsagePercentage > 100 &&  <Progress value={atmUsagePercentage - 100} className="mt-1 [&>div]:bg-destructive" />}
              </>
            )}
          </Alert>

          {caravanSpecs.gtm > 0 && (
            <Alert variant={getAlertStylingVariant(currentLoadOnAxles, caravanSpecs.gtm)}>
                <AlertTitle className="font-headline">GTM Status: {currentLoadOnAxles.toFixed(1)}kg / {caravanSpecs.gtm.toFixed(0)}kg</AlertTitle>
                <AlertDescription className="font-body">
                Remaining Payload (GTM): {remainingPayloadGTM.toFixed(1)} kg. 
                Ensure proper weight distribution as towball download significantly impacts GTM.
                {gtmUsagePercentage > 100 ? (
                    <>
                        <br />
                        <span className="font-semibold">You may be OVER the GTM limit!</span>
                        {" Suggestions: Reduce overall load or try moving heavier items closer to the caravan's axles."}
                    </>
                ) : gtmUsagePercentage > 90 ? (
                    " You are nearing the GTM limit."
                ) : (
                    ""
                )}
                </AlertDescription>
                <>
                    <Progress value={Math.min(gtmUsagePercentage, 100)} className="mt-2 [&>div]:bg-foreground" />
                    {gtmUsagePercentage > 100 &&  <Progress value={gtmUsagePercentage - 100} className="mt-1 [&>div]:bg-destructive" />}
                </>
            </Alert>
          )}
           
          {caravanSpecs.maxTowballDownload > 0 && (
            <Alert variant={getAlertStylingVariant(estimatedTowballDownload, caravanSpecs.maxTowballDownload)}>
                <AlertTitle className="font-headline">Est. Towball Download: {estimatedTowballDownload.toFixed(1)}kg / {caravanSpecs.maxTowballDownload.toFixed(0)}kg</AlertTitle>
                <AlertDescription className="font-body">
                Remaining Capacity (Towball): {(caravanSpecs.maxTowballDownload - estimatedTowballDownload).toFixed(1)} kg. 
                Adjust load distribution for optimal towball mass (typically 7-15% of ATM).
                {towballUsagePercentage > 100 ? (
                    <>
                        <br />
                        <span className="font-semibold">Your estimated towball download might EXCEED the limit!</span>
                        {" Suggestions: Try moving heavier items further back from the drawbar (towards or just behind the axles)."}
                    </>
                ) : (
                    ""
                )}
                </AlertDescription>
                 <>
                    <Progress value={Math.min(towballUsagePercentage, 100)} className="mt-2 [&>div]:bg-foreground" />
                    {towballUsagePercentage > 100 &&  <Progress value={towballUsagePercentage - 100} className="mt-1 [&>div]:bg-destructive" />}
                 </>
            </Alert>
          )}
        </div>

      </CardContent>
      <CardFooter className="flex flex-col items-start text-sm pt-4">
        <p className="font-body text-accent font-semibold mb-2">
          Important: Always verify weights at a weighbridge. This application provides estimates only and should not be relied upon for legal compliance.
        </p>
        <div className="text-muted-foreground font-body space-y-1">
          <p>
            <strong>Your Active Caravan's Specifications:</strong><br />
            <strong>Tare Mass:</strong> {caravanSpecs.tareMass > 0 ? `${caravanSpecs.tareMass.toFixed(0)}kg` : 'N/A'} <span className="text-xs italic">(Base weight of the empty caravan)</span><br />
            <strong>ATM (Aggregate Trailer Mass):</strong> {caravanSpecs.atm > 0 ? `${caravanSpecs.atm.toFixed(0)}kg` : 'N/A'} <span className="text-xs italic">(Max loaded weight, uncoupled)</span><br />
            <strong>GTM (Gross Trailer Mass):</strong> {caravanSpecs.gtm > 0 ? `${caravanSpecs.gtm.toFixed(0)}kg` : 'N/A'} <span className="text-xs italic">(Max weight on axles, coupled)</span><br />
            <strong>Max Towball Download:</strong> {caravanSpecs.maxTowballDownload > 0 ? `${caravanSpecs.maxTowballDownload.toFixed(0)}kg` : 'N/A'} <span className="text-xs italic">(Max downward force on towbar)</span>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
