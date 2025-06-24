
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { BudgetCategory } from '@/types/expense';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const budgetCategoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  budgetedAmount: z.coerce.number().min(0, "Budget must be a non-negative number"),
});

type BudgetCategoryFormData = z.infer<typeof budgetCategoryFormSchema>;

interface BudgetTabProps {
  budget: BudgetCategory[];
  onBudgetUpdate: (newBudget: BudgetCategory[]) => void;
  isTripLoaded: boolean;
  isLoading: boolean;
}

export function BudgetTab({ budget, onBudgetUpdate, isTripLoaded, isLoading }: BudgetTabProps) {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<BudgetCategoryFormData>({
    resolver: zodResolver(budgetCategoryFormSchema),
  });

  useEffect(() => {
    if (editingCategory) {
      setValue('name', editingCategory.name);
      setValue('budgetedAmount', editingCategory.budgetedAmount);
    } else {
      reset({ name: '', budgetedAmount: 0 });
    }
  }, [editingCategory, setValue, reset]);

  const handleOpenForm = (category: BudgetCategory | null = null) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const onSubmit: SubmitHandler<BudgetCategoryFormData> = (data) => {
    let updatedBudget;
    if (editingCategory) {
      updatedBudget = budget.map(cat => cat.id === editingCategory.id ? { ...cat, ...data } : cat);
      toast({ title: "Category Updated", description: `"${data.name}" has been updated.` });
    } else {
      const newCategory: BudgetCategory = { ...data, id: Date.now().toString() };
      updatedBudget = [...budget, newCategory];
      toast({ title: "Category Added", description: `"${data.name}" has been added to your budget.` });
    }
    onBudgetUpdate(updatedBudget);
    setIsFormOpen(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      const updatedBudget = budget.filter(cat => cat.id !== categoryId);
      onBudgetUpdate(updatedBudget);
      toast({ title: "Category Deleted" });
    }
  };

  const totalBudgetedAmount = useMemo(() => {
    return budget.reduce((total, cat) => total + cat.budgetedAmount, 0);
  }, [budget]);

  if (!isTripLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Setup</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center h-48">
          <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground font-body">Please plan an itinerary or recall a saved trip first.</p>
          <p className="text-xs text-muted-foreground font-body">The budget is linked to a specific trip.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Budget Setup</CardTitle>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenForm()} className="font-body bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit' : 'Add'} Budget Category</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div>
                  <Label htmlFor="categoryName" className="font-body">Category Name</Label>
                  <Input id="categoryName" {...register('name')} placeholder="e.g., Fuel, Groceries" className="font-body" />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="budgetedAmount" className="font-body">Budgeted Amount ($)</Label>
                  <Input id="budgetedAmount" type="number" step="0.01" {...register('budgetedAmount')} placeholder="e.g., 500" className="font-body" />
                  {errors.budgetedAmount && <p className="text-sm text-destructive mt-1">{errors.budgetedAmount.message}</p>}
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" className="font-body" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingCategory ? 'Update' : 'Add'} Category
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>Define categories and allocate funds for your trip.</CardDescription>
      </CardHeader>
      <CardContent>
        {budget.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Budgeted Amount</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budget.map(cat => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-right">${cat.budgetedAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenForm(cat)} disabled={isLoading}>
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)} disabled={isLoading}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>Total Budgeted: ${totalBudgetedAmount.toFixed(2)}</TableCaption>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground font-body py-6">No budget categories added yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

