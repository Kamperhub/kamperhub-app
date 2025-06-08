
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { InventoryItem, CaravanWeightData, CaravanInventories } from '@/types/inventory';
import type { StoredVehicle } from '@/types/vehicle';
import { INVENTORY_STORAGE_KEY } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trash2, PlusCircle, Edit3, AlertTriangle, Car, HomeIcon, Weight, Axe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label as RechartsLabel } from 'recharts';

interface InventoryListProps {
  caravanSpecs: CaravanWeightData;
  activeTowVehicleSpecs: StoredVehicle | null;
  initialCaravanInventory: InventoryItem[];
  activeCaravanId: string | null;
}

const DonutChartCustomLabel = ({ viewBox, value, limit, unit, name }: { viewBox?: { cx?: number, cy?: number }, value: number, limit: number, unit: string, name: string }) => {
  const { cx, cy } = viewBox || { cx: 0, cy: 0 };
  const isLimitNotSet = limit <= 0;
  const percentage = !isLimitNotSet && limit > 0 && typeof value === 'number' && !isNaN(value) ? ((value / limit) * 100) : 0;
  const isOverLimit = !isLimitNotSet && typeof value === 'number' && !isNaN(value) && value > limit;
  const displayValue = typeof value === 'number' && !isNaN(value) ? value.toFixed(0) : '--';

  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="font-body">
      <tspan x={cx} dy="-1.5em" className="text-xs fill-muted-foreground">{name}</tspan>
      <tspan x={cx} dy="1.2em" className={`text-xl font-bold font-headline ${isOverLimit ? 'fill-destructive' : 'fill-primary'}`}>
        {displayValue}{unit}
      </tspan>
      {!isLimitNotSet ? (
        <tspan x={cx} dy="1.4em" className="text-xs fill-muted-foreground">
          ({percentage.toFixed(0)}%)
        </tspan>
      ) : (
        <tspan x={cx} dy="1.4em" className="text-xs fill-muted-foreground">
          (Limit N/A)
        </tspan>
      )}
    </text>
  );
};


export function InventoryList({ caravanSpecs, activeTowVehicleSpecs, initialCaravanInventory, activeCaravanId }: InventoryListProps) {
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
    return items.reduce((sum, item) => {
      const weight = typeof item.weight === 'number' && !isNaN(item.weight) ? item.weight : 0;
      const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
      return sum + (weight * quantity);
    }, 0);
  }, [items]);
  
  const atmLimit = useMemo(() => (typeof caravanSpecs.atm === 'number' && !isNaN(caravanSpecs.atm) ? caravanSpecs.atm : 0), [caravanSpecs.atm]);
  const gtmLimit = useMemo(() => (typeof caravanSpecs.gtm === 'number' && !isNaN(caravanSpecs.gtm) ? caravanSpecs.gtm : 0), [caravanSpecs.gtm]);
  const caravanMaxTowballDownloadLimit = useMemo(() => (typeof caravanSpecs.maxTowballDownload === 'number' && !isNaN(caravanSpecs.maxTowballDownload) ? caravanSpecs.maxTowballDownload : 0), [caravanSpecs.maxTowballDownload]);
  const tareMass = useMemo(() => (typeof caravanSpecs.tareMass === 'number' && !isNaN(caravanSpecs.tareMass) ? caravanSpecs.tareMass : 0), [caravanSpecs.tareMass]);

  const currentCaravanMass = useMemo(() => { 
    const calculatedMass = tareMass + totalWeight;
    return typeof calculatedMass === 'number' && !isNaN(calculatedMass) ? calculatedMass : 0;
  }, [tareMass, totalWeight]);
  
  const remainingPayloadATM = useMemo(() => {
    return atmLimit > 0 ? atmLimit - currentCaravanMass : 0;
  }, [atmLimit, currentCaravanMass]);
  
  const estimatedTowballDownload = useMemo(() => {
    const calculated = totalWeight * 0.1; 
    return typeof calculated === 'number' && !isNaN(calculated) ? Math.max(0, calculated) : 0;
  }, [totalWeight]);

  const currentLoadOnAxles = useMemo(() => { 
    const calculatedLoad = currentCaravanMass - estimatedTowballDownload;
    return typeof calculatedLoad === 'number' && !isNaN(calculatedLoad) ? Math.max(0, calculatedLoad) : 0;
  }, [currentCaravanMass, estimatedTowballDownload]);

  const remainingPayloadGTM = useMemo(() => {
    return gtmLimit > 0 ? gtmLimit - currentLoadOnAxles : 0;
  }, [gtmLimit, currentLoadOnAxles]);

  const vehicleMaxTowCapacity = useMemo(() => activeTowVehicleSpecs?.maxTowCapacity ?? 0, [activeTowVehicleSpecs]);
  const vehicleMaxTowballMass = useMemo(() => activeTowVehicleSpecs?.maxTowballMass ?? 0, [activeTowVehicleSpecs]);
  const vehicleGVM = useMemo(() => activeTowVehicleSpecs?.gvm ?? 0, [activeTowVehicleSpecs]); 
  const vehicleGCM = useMemo(() => activeTowVehicleSpecs?.gcm ?? 0, [activeTowVehicleSpecs]); 

  const isOverMaxTowCapacity = useMemo(() => vehicleMaxTowCapacity > 0 && currentCaravanMass > vehicleMaxTowCapacity, [currentCaravanMass, vehicleMaxTowCapacity]);
  const isOverVehicleMaxTowball = useMemo(() => vehicleMaxTowballMass > 0 && estimatedTowballDownload > vehicleMaxTowballMass, [estimatedTowballDownload, vehicleMaxTowballMass]);
  
  const potentialGCM = useMemo(() => currentCaravanMass + vehicleGVM, [currentCaravanMass, vehicleGVM]);
  const isPotentialGCMOverLimit = useMemo(() => vehicleGCM > 0 && vehicleGVM > 0 && potentialGCM > vehicleGCM, [potentialGCM, vehicleGCM, vehicleGVM]);


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
    if (currentValue > limit * 0.9) return "default"; 
    return "default"; 
  };
  
  const isFormDisabled = !activeCaravanId;

  const prepareChartData = (currentVal: number, limitVal: number) => {
    const safeLimitVal = typeof limitVal === 'number' && !isNaN(limitVal) ? limitVal : 0;
    const isLimitNotSet = safeLimitVal <= 0;
    const safeCurrentVal = typeof currentVal === 'number' && !isNaN(currentVal) ? currentVal : 0;
    const isOver = !isLimitNotSet && safeCurrentVal > safeLimitVal;
    
    if (isLimitNotSet) {
      return {
        data: [{ name: 'N/A', value: 100 }],
        colors: ['hsl(var(--muted))'],
      };
    }
    
    return {
      data: [
        { name: 'Used', value: safeCurrentVal },
        { name: 'Remaining', value: Math.max(0, safeLimitVal - safeCurrentVal) },
      ],
      colors: [
        isOver ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
        'hsl(var(--muted))',
      ],
    };
  };
  
  const atmChart = prepareChartData(currentCaravanMass, atmLimit);
  const gtmChart = prepareChartData(currentLoadOnAxles, gtmLimit);
  const towballChart = prepareChartData(estimatedTowballDownload, caravanMaxTowballDownloadLimit);

  const formatTooltipValue = (value: number) => {
    return typeof value === 'number' && !isNaN(value) ? value.toFixed(1) : '--';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Inventory Weight Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isFormDisabled && (
            <Alert variant="default" className="bg-muted border-border">
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
            <Input id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g., Camping Chair" className="font-body bg-white dark:bg-neutral-800" disabled={isFormDisabled}/>
          </div>
          <div>
            <Label htmlFor="itemWeight" className="font-body">Weight per Item (kg)</Label>
            <Input id="itemWeight" type="number" value={itemWeight} onChange={(e) => setItemWeight(e.target.value)} placeholder="e.g., 2.5" className="font-body bg-white dark:bg-neutral-800" disabled={isFormDisabled}/>
          </div>
          <div>
            <Label htmlFor="itemQuantity" className="font-body">Quantity</Label>
            <Input id="itemQuantity" type="number" min="1" value={itemQuantity} onChange={(e) => setItemQuantity(e.target.value)} placeholder="e.g., 2" className="font-body bg-white dark:bg-neutral-800" disabled={isFormDisabled}/>
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
          <h3 className="text-xl font-headline text-foreground">Weight Summary &amp; Compliance</h3>
          
          <Alert variant="default" className="mb-4 bg-yellow-50 border-yellow-300 text-yellow-700">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="font-headline text-yellow-700">Important Weighbridge Notice</AlertTitle>
            <AlertDescription className="font-body">
              Always verify weights at a certified weighbridge. This application provides estimates only and should not be relied upon for legal compliance or absolute safety. Towball mass is estimated at 10% of payload.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-headline text-lg flex items-center"><HomeIcon className="mr-2 h-5 w-5 text-primary"/>Caravan Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Alert variant={getAlertStylingVariant(currentCaravanMass, atmLimit)} className={currentCaravanMass > atmLimit ? '' : 'bg-background'}>
                  <AlertTitle className="font-headline">ATM Status: {currentCaravanMass.toFixed(1)}kg / {atmLimit > 0 ? atmLimit.toFixed(0) : 'N/A'}kg</AlertTitle>
                  <AlertDescription className="font-body">
                    {atmLimit > 0 ? ( <> Remaining Payload (ATM): {remainingPayloadATM.toFixed(1)} kg.
                      {currentCaravanMass > atmLimit ? <span className="font-semibold text-destructive"> OVER LIMIT!</span> : currentCaravanMass > atmLimit * 0.9 ? " Nearing limit." : ""} </>
                    ) : "ATM not specified."}
                  </AlertDescription>
                </Alert>

                {gtmLimit > 0 && (
                  <Alert variant={getAlertStylingVariant(currentLoadOnAxles, gtmLimit)} className={currentLoadOnAxles > gtmLimit ? '' : 'bg-background'}>
                      <AlertTitle className="font-headline">GTM Status: {currentLoadOnAxles.toFixed(1)}kg / {gtmLimit.toFixed(0)}kg</AlertTitle>
                      <AlertDescription className="font-body">
                      Remaining Payload (GTM): {remainingPayloadGTM.toFixed(1)} kg.
                      {currentLoadOnAxles > gtmLimit ? <span className="font-semibold text-destructive"> OVER LIMIT!</span> : currentLoadOnAxles > gtmLimit * 0.9 ? " Nearing limit." : ""}
                      </AlertDescription>
                  </Alert>
                )}
                
                {caravanMaxTowballDownloadLimit > 0 && (
                  <Alert variant={getAlertStylingVariant(estimatedTowballDownload, caravanMaxTowballDownloadLimit)} className={estimatedTowballDownload > caravanMaxTowballDownloadLimit ? '' : 'bg-background'}>
                      <AlertTitle className="font-headline">Est. Towball (Caravan Limit): {estimatedTowballDownload.toFixed(1)}kg / {caravanMaxTowballDownloadLimit.toFixed(0)}kg</AlertTitle>
                      <AlertDescription className="font-body">
                        Remaining Capacity: {(caravanMaxTowballDownloadLimit - estimatedTowballDownload).toFixed(1)} kg.
                        {estimatedTowballDownload > caravanMaxTowballDownloadLimit ? <span className="font-semibold text-destructive"> OVER CARAVAN LIMIT!</span> : ""}
                      </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {activeTowVehicleSpecs && activeTowVehicleSpecs.make && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="font-headline text-lg flex items-center"><Car className="mr-2 h-5 w-5 text-primary"/>Tow Vehicle Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {vehicleMaxTowCapacity > 0 && (
                    <Alert variant={isOverMaxTowCapacity ? "destructive" : "default"}  className={isOverMaxTowCapacity ? '' : 'bg-background'}>
                      <AlertTitle className="font-headline">Max Tow Capacity: {currentCaravanMass.toFixed(1)}kg / {vehicleMaxTowCapacity.toFixed(0)}kg</AlertTitle>
                      <AlertDescription className="font-body">
                        {isOverMaxTowCapacity ? <span className="font-semibold text-destructive">Caravan OVER vehicle's tow capacity! DANGEROUS!</span> : `Caravan weight is within vehicle's tow capacity.`}
                      </AlertDescription>
                    </Alert>
                  )}
                  {vehicleMaxTowballMass > 0 && (
                    <Alert variant={isOverVehicleMaxTowball ? "destructive" : "default"} className={isOverVehicleMaxTowball ? '' : 'bg-background'}>
                      <AlertTitle className="font-headline">Est. Towball (Vehicle Limit): {estimatedTowballDownload.toFixed(1)}kg / {vehicleMaxTowballMass.toFixed(0)}kg</AlertTitle>
                      <AlertDescription className="font-body">
                        {isOverVehicleMaxTowball ? <span className="font-semibold text-destructive">Towball OVER vehicle's limit!</span> : `Towball weight within vehicle's limit.`}
                      </AlertDescription>
                    </Alert>
                  )}
                  {vehicleGCM > 0 && vehicleGVM > 0 && (
                     <Alert variant={isPotentialGCMOverLimit ? "destructive" : "default"} className={isPotentialGCMOverLimit ? '' : 'bg-background'}>
                        <AlertTitle className="font-headline">GCM Advisory</AlertTitle>
                        <AlertDescription className="font-body">
                            Potential GCM: {potentialGCM.toFixed(1)}kg (Caravan Mass + Vehicle GVM Limit) vs GCM Limit: {vehicleGCM.toFixed(0)}kg.
                            {isPotentialGCMOverLimit ? <span className="font-semibold text-destructive"> POTENTIAL GCM OVERLOAD! Verify actual vehicle weight.</span> : " GCM likely okay if vehicle not overloaded."}
                            <br/><small className="italic">Note: This GCM check is an advisory. It assumes your tow vehicle is loaded to its GVM limit. Always confirm total combined mass at a weighbridge.</small>
                        </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-6">
            <div className="flex flex-col items-center p-3 border rounded-lg shadow-sm bg-card">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={atmChart.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={60}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="hsl(var(--background))" 
                    strokeWidth={2}
                  >
                    {atmChart.data.map((entry, index) => (
                      <Cell key={`cell-atm-${index}`} fill={atmChart.colors[index % atmChart.colors.length]} />
                    ))}
                     <RechartsLabel 
                        content={<DonutChartCustomLabel name="Caravan ATM" value={currentCaravanMass} limit={atmLimit} unit="kg" />} 
                        position="center" 
                    />
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${formatTooltipValue(value)} kg`, name.startsWith("N/A") ? "Limit N/A" : name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col items-center p-3 border rounded-lg shadow-sm bg-card">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={gtmChart.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={60}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {gtmChart.data.map((entry, index) => (
                      <Cell key={`cell-gtm-${index}`} fill={gtmChart.colors[index % gtmChart.colors.length]} />
                    ))}
                    <RechartsLabel 
                        content={<DonutChartCustomLabel name="Caravan GTM" value={currentLoadOnAxles} limit={gtmLimit} unit="kg" />} 
                        position="center" 
                    />
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${formatTooltipValue(value)} kg`, name.startsWith("N/A") ? "Limit N/A" : name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col items-center p-3 border rounded-lg shadow-sm bg-card">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={towballChart.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={60}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {towballChart.data.map((entry, index) => (
                      <Cell key={`cell-towball-${index}`} fill={towballChart.colors[index % towballChart.colors.length]} />
                    ))}
                     <RechartsLabel 
                        content={<DonutChartCustomLabel name="Est. Towball" value={estimatedTowballDownload} limit={caravanMaxTowballDownloadLimit} unit="kg" />} 
                        position="center" 
                    />
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${formatTooltipValue(value)} kg`, name.startsWith("N/A") ? "Limit N/A" : name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </CardContent>
      <CardFooter className="flex flex-col items-start text-sm pt-4">
        <div className="text-muted-foreground font-body space-y-2 w-full">
           <div className="pb-2 mb-2 border-b">
            <h4 className="font-semibold text-foreground">Active Caravan ({caravanSpecs.make || 'N/A'} {caravanSpecs.model || ''}):</h4>
            <p><strong>Tare Mass:</strong> { (tareMass > 0) ? `${tareMass.toFixed(0)}kg` : 'N/A'} <span className="text-xs italic">(Base empty weight)</span></p>
            <p><strong>ATM (Aggregate Trailer Mass):</strong> { (atmLimit > 0) ? `${atmLimit.toFixed(0)}kg` : 'N/A'} <span className="text-xs italic">(Max loaded, uncoupled)</span></p>
            <p><strong>GTM (Gross Trailer Mass):</strong> { (gtmLimit > 0) ? `${gtmLimit.toFixed(0)}kg` : 'N/A'} <span className="text-xs italic">(Max on axles, coupled)</span></p>
            <p><strong>Caravan Max Towball:</strong> { (caravanMaxTowballDownloadLimit > 0) ? `${caravanMaxTowballDownloadLimit.toFixed(0)}kg` : 'N/A'} <span className="text-xs italic">(Max downward force on towbar by caravan)</span></p>
           </div>
           {activeTowVehicleSpecs && activeTowVehicleSpecs.make && (
            <div>
                <h4 className="font-semibold text-foreground">Active Tow Vehicle ({activeTowVehicleSpecs.make} {activeTowVehicleSpecs.model}):</h4>
                {activeTowVehicleSpecs.kerbWeight > 0 && <p><strong>Kerb Weight:</strong> {activeTowVehicleSpecs.kerbWeight.toFixed(0)}kg <span className="text-xs italic">(Empty vehicle weight)</span></p>}
                <p><strong>GVM (Gross Vehicle Mass Limit):</strong> {vehicleGVM > 0 ? `${vehicleGVM.toFixed(0)}kg` : 'N/A'} <span className="text-xs italic">(Max loaded weight of vehicle itself)</span></p>
                {activeTowVehicleSpecs.frontAxleLimit > 0 && <p><strong>Front Axle Limit:</strong> {activeTowVehicleSpecs.frontAxleLimit.toFixed(0)}kg</p>}
                {activeTowVehicleSpecs.rearAxleLimit > 0 && <p><strong>Rear Axle Limit:</strong> {activeTowVehicleSpecs.rearAxleLimit.toFixed(0)}kg</p>}
                <p><strong>Max Towing Capacity:</strong> {vehicleMaxTowCapacity > 0 ? `${vehicleMaxTowCapacity.toFixed(0)}kg` : 'N/A'} <span className="text-xs italic">(Max caravan ATM vehicle can tow)</span></p>
                <p><strong>Max Towball Mass (Vehicle):</strong> {vehicleMaxTowballMass > 0 ? `${vehicleMaxTowballMass.toFixed(0)}kg` : 'N/A'} <span className="text-xs italic">(Max towball weight vehicle can handle)</span></p>
                <p><strong>GCM (Gross Combined Mass Limit):</strong> {vehicleGCM > 0 ? `${vehicleGCM.toFixed(0)}kg` : 'N/A'} <span className="text-xs italic">(Max combined weight of loaded vehicle and loaded caravan)</span></p>
            </div>
           )}
        </div>
      </CardFooter>
    </Card>
  );
}
