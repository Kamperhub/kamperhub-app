
"use client";

import React, { useState, useMemo } from 'react';
import type { Occupant } from '@/types/tripplanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit3, Trash2 } from 'lucide-react';

interface OccupantManagerProps {
    occupants: Occupant[];
    onUpdate: (newOccupants: Occupant[]) => void;
    disabled?: boolean;
}

export function OccupantManager({ occupants, onUpdate, disabled }: OccupantManagerProps) {
    const [editingOccupant, setEditingOccupant] = useState<Partial<Occupant> & { id?: string }>({});
    const [isEditing, setIsEditing] = useState(false);
    const { toast } = useToast();

    const handleEditClick = (occupant: Occupant) => {
        setEditingOccupant(occupant);
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingOccupant({});
    };

    const handleInputChange = (field: keyof Occupant, value: any) => {
        setEditingOccupant(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveOccupant = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, type, weight } = editingOccupant;

        if (!name || !type || !weight || isNaN(Number(weight)) || Number(weight) < 0) {
            toast({ title: "Invalid Input", description: "Please provide a valid name, type, and non-negative weight.", variant: "destructive" });
            return;
        }

        const occupantData: Omit<Occupant, 'id'> = {
            name: name,
            type: type,
            weight: Number(weight),
            age: editingOccupant.age ? Number(editingOccupant.age) : null,
            notes: editingOccupant.notes || null,
        };

        if (editingOccupant.id) {
            const updatedOccupants = occupants.map(occ =>
                occ.id === editingOccupant.id ? { ...occ, ...occupantData } : occ
            );
            onUpdate(updatedOccupants);
            toast({ title: "Occupant Updated" });
        } else {
            const newOccupant: Occupant = { ...occupantData, id: Date.now().toString() };
            onUpdate([...occupants, newOccupant]);
            toast({ title: "Occupant Added" });
        }
        handleCancelEdit();
    };

    const handleDeleteOccupant = (id: string) => {
        if (occupants.length === 1) {
            toast({
                title: "Cannot Remove Last Occupant",
                description: "A trip must have at least one occupant (e.g., the driver).",
                variant: "destructive"
            });
            return;
        }
        onUpdate(occupants.filter(occ => occ.id !== id));
        toast({ title: "Occupant Removed" });
    };

    const totalWeight = useMemo(() => occupants.reduce((sum, occ) => sum + occ.weight, 0), [occupants]);

    return (
        <div className="space-y-4">
            <form onSubmit={handleSaveOccupant} className="space-y-3 p-3 border rounded-md bg-muted/20">
                <h4 className="font-semibold text-sm">{isEditing ? 'Edit Occupant' : 'Add New Occupant'}</h4>
                <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2"><Label htmlFor="occ-name" className="text-xs">Name*</Label><Input id="occ-name" value={editingOccupant.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="e.g., Alex, Buddy" disabled={disabled} /></div>
                    <div><Label htmlFor="occ-type" className="text-xs">Type*</Label><Select value={editingOccupant.type} onValueChange={(v) => handleInputChange('type', v as Occupant['type'])} disabled={disabled}><SelectTrigger><SelectValue placeholder="Select type..."/></SelectTrigger><SelectContent><SelectItem value="Adult">Adult</SelectItem><SelectItem value="Child">Child</SelectItem><SelectItem value="Infant">Infant</SelectItem><SelectItem value="Pet">Pet</SelectItem></SelectContent></Select></div>
                    <div><Label htmlFor="occ-weight" className="text-xs">Weight (kg)*</Label><Input id="occ-weight" type="number" value={editingOccupant.weight || ''} onChange={(e) => handleInputChange('weight', e.target.value)} placeholder="e.g., 75" disabled={disabled} /></div>
                    <div className="col-span-2"><Label htmlFor="occ-age" className="text-xs">Age (for children, optional)</Label><Input id="occ-age" type="number" value={editingOccupant.age || ''} onChange={(e) => handleInputChange('age', e.target.value)} placeholder="e.g., 7" disabled={disabled} /></div>
                    <div className="col-span-2"><Label htmlFor="occ-notes" className="text-xs">Packing Notes (Optional)</Label><Textarea id="occ-notes" value={editingOccupant.notes || ''} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder="e.g., Needs specific medication, loves hiking" disabled={disabled} /></div>
                </div>
                <div className="flex gap-2">
                    {isEditing && (<Button type="button" size="sm" variant="outline" className="w-full" onClick={handleCancelEdit} disabled={disabled}>Cancel</Button>)}
                    <Button type="submit" size="sm" className="w-full" disabled={disabled}><PlusCircle className="mr-2 h-4 w-4" /> {isEditing ? 'Update' : 'Add'}</Button>
                </div>
            </form>
            <div className="space-y-2">
                {occupants.map(occ => (
                    <div key={occ.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                        <div className="text-sm">
                            <span className="font-semibold">{occ.name}</span> <span className="text-xs">({occ.type})</span> - {occ.weight}kg
                            {occ.notes && <p className="text-xs text-muted-foreground">{occ.notes}</p>}
                        </div>
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditClick(occ)} disabled={disabled}><Edit3 className="h-4 w-4 text-blue-600" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteOccupant(occ.id)} disabled={disabled}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    </div>
                ))}
            </div>
            {totalWeight > 0 && <p className="text-sm font-semibold text-right">Total Occupant Weight: {totalWeight.toFixed(1)} kg</p>}
        </div>
    );
}
