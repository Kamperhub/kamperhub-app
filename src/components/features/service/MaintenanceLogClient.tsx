
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { MaintenanceTask } from '@/types/service';
import type { StoredVehicle } from '@/types/vehicle';
import type { StoredCaravan } from '@/types/caravan';
import { fetchMaintenanceTasks, createMaintenanceTask, updateMaintenanceTask, deleteMaintenanceTask, fetchVehicles, fetchCaravans } from '@/lib/api-client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Edit, Trash2, Car, Home, Info, Loader2, CalendarIcon, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const maintenanceTaskFormSchema = z.object({
  assetId: z.string().min(1, "Please select an asset."),
  taskName: z.string().min(1, "Task name is required."),
  category: z.enum(['Engine', 'Tyres', 'Brakes', 'Chassis', 'Electrical', 'Plumbing', 'Appliance', 'Registration', 'General']),
  dueDate: z.date().nullable().optional(),
  dueOdometer: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val), // If empty string or null, treat as undefined
    z.coerce.number({invalid_type_error: "Must be a number"}).positive("Odometer must be a positive number.").nullable().optional()
  ),
  notes: z.string().optional(),
  isCompleted: z.boolean().default(false),
});
type MaintenanceTaskFormData = z.infer<typeof maintenanceTaskFormSchema>;

export function MaintenanceLogClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);

  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery<StoredVehicle[]>({
    queryKey: ['vehicles', user?.uid],
    queryFn: fetchVehicles,
    enabled: !!user,
  });

  const { data: caravans = [], isLoading: isLoadingCaravans } = useQuery<StoredCaravan[]>({
    queryKey: ['caravans', user?.uid],
    queryFn: fetchCaravans,
    enabled: !!user,
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<MaintenanceTask[]>({
    queryKey: ['maintenanceTasks', user?.uid],
    queryFn: () => fetchMaintenanceTasks(),
    enabled: !!user,
  });
  
  const assets = useMemo(() => [
    ...vehicles.map(v => ({ id: v.id, name: `${v.year} ${v.make} ${v.model}` })),
    ...caravans.map(c => ({ id: c.id, name: `${c.year} ${c.make} ${c.model}` })),
  ], [vehicles, caravans]);

  const { control, register, handleSubmit, formState: { errors }, reset, setValue, watch, getValues } = useForm<MaintenanceTaskFormData>({
    resolver: zodResolver(maintenanceTaskFormSchema),
  });

  const isCompleted = watch("isCompleted");

  React.useEffect(() => {
    if (isFormOpen) {
      if (editingTask) {
        setValue('assetId', editingTask.assetId);
        setValue('taskName', editingTask.taskName);
        setValue('category', editingTask.category);
        setValue('dueDate', editingTask.dueDate ? parseISO(editingTask.dueDate) : null);
        setValue('dueOdometer', editingTask.dueOdometer);
        setValue('notes', editingTask.notes);
        setValue('isCompleted', editingTask.isCompleted);
      } else {
        reset({ assetId: undefined, taskName: '', category: 'General', dueDate: null, dueOdometer: undefined, notes: '', isCompleted: false });
      }
    }
  }, [editingTask, isFormOpen, setValue, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: MaintenanceTask | Omit<MaintenanceTask, 'id' | 'timestamp'>) => {
      if ('id' in data) {
        return updateMaintenanceTask(data as MaintenanceTask);
      }
      return createMaintenanceTask(data as Omit<MaintenanceTask, 'id' | 'timestamp'>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTasks', user?.uid] });
      toast({ title: editingTask ? "Task Updated" : "Task Added" });
      setIsFormOpen(false);
      setEditingTask(null);
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteMaintenanceTask(taskId),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['maintenanceTasks', user?.uid] });
        toast({ title: "Task Deleted" });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });
  
  const handleToggleComplete = (task: MaintenanceTask) => {
    saveMutation.mutate({ ...task, isCompleted: !task.isCompleted, completedDate: !task.isCompleted ? new Date().toISOString() : null });
  };

  const handleSaveTask: SubmitHandler<MaintenanceTaskFormData> = (data) => {
    const assetName = assets.find(a => a.id === data.assetId)?.name || 'Unknown Asset';
    const taskData = {
        ...data,
        assetName,
        dueDate: data.dueDate?.toISOString() ?? null,
        completedDate: data.isCompleted ? new Date().toISOString() : null,
    };

    if (editingTask) {
        saveMutation.mutate({ ...editingTask, ...taskData });
    } else {
        saveMutation.mutate(taskData);
    }
  };

  const handleEditTask = (task: MaintenanceTask) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };
  
  const handleAddToCalendarFromForm = useCallback(() => {
    const formData = getValues();
    const assetName = assets.find(a => a.id === formData.assetId)?.name;

    if (!formData.dueDate || !formData.taskName || !assetName) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a task name, asset, and due date before adding to calendar.',
        variant: 'destructive',
      });
      return;
    }

    const title = encodeURIComponent(`Maint: ${formData.taskName} for ${assetName}`);
    const details = encodeURIComponent(`Maintenance task for ${assetName}.\n\nTask: ${formData.taskName}\nCategory: ${formData.category}\nNotes: ${formData.notes || 'N/A'}`);
    
    const startDate = formData.dueDate;
    const startDateFormatted = format(startDate, 'yyyyMMdd');
    const endDateFormatted = format(addDays(startDate, 1), 'yyyyMMdd'); // All-day event for one day
    
    const dates = `${startDateFormatted}/${endDateFormatted}`;
    
    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
    window.open(calendarUrl, '_blank');
    toast({
      title: 'Opening Google Calendar',
      description: 'Remember to save the task in KamperHub as well!',
    });
  }, [getValues, assets, toast]);
  
  if (isLoadingVehicles || isLoadingCaravans || isLoadingTasks) {
    return <Skeleton className="h-64 w-full" />;
  }
  
  const sortedTasks = [...tasks].sort((a,b) => {
    if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
    }
    const dateA = a.dueDate ? parseISO(a.dueDate).getTime() : Infinity;
    const dateB = b.dueDate ? parseISO(b.dueDate).getTime() : Infinity;
    return dateA - dateB;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
              <CardTitle>Maintenance Log</CardTitle>
              <CardDescription>Track upcoming and completed service tasks for all your assets.</CardDescription>
            </div>
             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                  <Button onClick={() => setEditingTask(null)} disabled={assets.length === 0}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Maintenance Task
                  </Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>{editingTask ? "Edit" : "Add"} Maintenance Task</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(handleSaveTask)} className="space-y-4">
                      <Controller name="assetId" control={control} render={({ field }) => (
                           <div>
                              <Label>Asset</Label>
                              <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select an asset..." /></SelectTrigger><SelectContent>{assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select>
                              {errors.assetId && <p className="text-destructive text-sm mt-1">{errors.assetId.message}</p>}
                           </div>
                      )} />
                      <div>
                          <Label htmlFor="taskName">Task Name</Label>
                          <Input id="taskName" {...register('taskName')} />
                          {errors.taskName && <p className="text-destructive text-sm mt-1">{errors.taskName.message}</p>}
                      </div>
                      <div>
                          <Label>Category</Label>
                          <Controller name="category" control={control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['Engine', 'Tyres', 'Brakes', 'Chassis', 'Electrical', 'Plumbing', 'Appliance', 'Registration', 'General'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>)}/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 sm:col-span-1">
                            <Label>Due Date (Optional)</Label>
                            <Controller name="dueDate" control={control} render={({ field }) => (<Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{field.value ? format(field.value, "PP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} /></PopoverContent></Popover>)}/>
                             {watch('dueDate') && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 w-full"
                                    onClick={handleAddToCalendarFromForm}
                                >
                                    <CalendarPlus className="mr-2 h-4 w-4" />
                                    Add to Calendar
                                </Button>
                            )}
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <Label>Due Odometer (km) (Optional)</Label>
                            <Input type="number" {...register('dueOdometer')} />
                             {errors.dueOdometer && <p className="text-destructive text-sm mt-1">{errors.dueOdometer.message}</p>}
                          </div>
                      </div>
                      <div>
                          <Label>Notes</Label>
                          <Textarea {...register('notes')}/>
                      </div>
                       <div className="flex items-center space-x-2">
                           <Controller name="isCompleted" control={control} render={({ field }) => (<Checkbox id="isCompleted" checked={field.value} onCheckedChange={field.onChange} />)} />
                           <Label htmlFor="isCompleted">Mark as completed</Label>
                       </div>
                       <div className="flex justify-end"><Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save Task</Button></div>
                  </form>
              </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {assets.length === 0 && (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Assets Found</AlertTitle>
                <AlertDescription>Please add a vehicle or caravan in the 'Vehicle & Caravan Setup' section to start tracking maintenance.</AlertDescription>
            </Alert>
        )}
        {assets.length > 0 && tasks.length === 0 && <p className="text-center text-muted-foreground py-6">No maintenance tasks logged yet.</p>}
        {tasks.length > 0 && (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedTasks.map(task => (
                        <TableRow key={task.id} className={cn(task.isCompleted && 'text-muted-foreground')}>
                            <TableCell><Checkbox checked={task.isCompleted} onCheckedChange={() => handleToggleComplete(task)}/></TableCell>
                            <TableCell><p className={cn("font-medium", task.isCompleted && "line-through")}>{task.taskName}</p><p className="text-xs">{task.category}</p></TableCell>
                            <TableCell>{task.assetName}</TableCell>
                            <TableCell>{task.dueDate && format(parseISO(task.dueDate), "PP")}{task.dueDate && task.dueOdometer && " / "}{task.dueOdometer && `${task.dueOdometer} km`}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => handleEditTask(task)}><Edit className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(task.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
      </CardContent>
    </Card>
  );
}
