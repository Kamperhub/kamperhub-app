
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Expense, BudgetCategory } from '@/types/expense';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, AlertCircle, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const expenseFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  date: z.date({ required_error: "Please select a date." }),
  categoryId: z.string({ required_error: "Please select a category." }),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

interface ExpenseTabProps {
  expenses: Expense[];
  budget: BudgetCategory[];
  onExpensesUpdate: (newExpenses: Expense[]) => void;
  isTripLoaded: boolean;
  isLoading: boolean;
}

export function ExpenseTab({ expenses, budget, onExpensesUpdate, isTripLoaded, isLoading }: ExpenseTabProps) {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue, control } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
  });
  
  const categoryMap = useMemo(() => {
    return new Map(budget.map(cat => [cat.id, cat.name]));
  }, [budget]);

  useEffect(() => {
    if (isFormOpen) {
      if (editingExpense) {
        setValue('description', editingExpense.description);
        setValue('amount', editingExpense.amount);
        setValue('date', parseISO(editingExpense.date));
        setValue('categoryId', editingExpense.categoryId);
      } else {
        reset({ description: '', amount: 0, date: new Date(), categoryId: undefined });
      }
    }
  }, [editingExpense, isFormOpen, setValue, reset]);

  const handleOpenForm = (expense: Expense | null = null) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const onSubmit: SubmitHandler<ExpenseFormData> = (data) => {
    let updatedExpenses;
    const newExpenseData = {
        ...data,
        date: data.date.toISOString(),
    };

    if (editingExpense) {
      updatedExpenses = expenses.map(exp => exp.id === editingExpense.id ? { ...editingExpense, ...newExpenseData } : exp);
      toast({ title: "Expense Updated" });
    } else {
      const newExpense: Expense = {
        ...newExpenseData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      updatedExpenses = [...expenses, newExpense];
      toast({ title: "Expense Added" });
    }
    onExpensesUpdate(updatedExpenses);
    setIsFormOpen(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
      onExpensesUpdate(updatedExpenses);
      toast({ title: "Expense Deleted" });
    }
  };

  const totalSpent = useMemo(() => {
    return expenses.reduce((total, exp) => total + exp.amount, 0);
  }, [expenses]);
  
  const totalBudgeted = useMemo(() => {
    return budget.reduce((total, cat) => total + cat.budgetedAmount, 0);
  }, [budget]);

  if (!isTripLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Tracking</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center h-48">
          <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground font-body">Plan an itinerary or recall a saved trip to track expenses.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Expense Ledger</CardTitle>
            <CardDescription>Log your spending against your budget categories.</CardDescription>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenForm()} className="font-body bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading || budget.length === 0}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingExpense ? 'Edit' : 'Add'} Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div>
                  <Label htmlFor="description" className="font-body">Description</Label>
                  <Input id="description" {...register('description')} placeholder="e.g., Diesel fill-up" className="font-body" />
                  {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="amount" className="font-body">Amount ($)</Label>
                        <Input id="amount" type="number" step="0.01" {...register('amount')} placeholder="e.g., 85.50" className="font-body" />
                        {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="date" className="font-body">Date</Label>
                        <Controller name="date" control={control} render={({ field }) => (
                            <Popover><PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal font-body", !field.value && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4"/>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover>
                        )} />
                        {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}
                    </div>
                </div>
                <div>
                  <Label htmlFor="categoryId" className="font-body">Category</Label>
                  <Controller name="categoryId" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="font-body"><SelectValue placeholder="Select a budget category"/></SelectTrigger>
                          <SelectContent>
                              {budget.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  )} />
                  {errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>}
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" className="font-body" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingExpense ? 'Update' : 'Add'} Expense
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {budget.length === 0 && <p className="text-xs text-muted-foreground mt-1">Add budget categories in the 'Budget' tab before logging expenses.</p>}
      </CardHeader>
      <CardContent>
        {expenses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map(exp => (
                <TableRow key={exp.id}>
                  <TableCell>{format(parseISO(exp.date), 'PP')}</TableCell>
                  <TableCell className="font-medium">{exp.description}</TableCell>
                  <TableCell>{categoryMap.get(exp.categoryId) || 'Uncategorized'}</TableCell>
                  <TableCell className="text-right">${exp.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenForm(exp)} disabled={isLoading}>
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(exp.id)} disabled={isLoading}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>Total Spent: ${totalSpent.toFixed(2)} / Total Budgeted: ${totalBudgeted.toFixed(2)}</TableCaption>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground font-body py-6">No expenses logged for this trip yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
