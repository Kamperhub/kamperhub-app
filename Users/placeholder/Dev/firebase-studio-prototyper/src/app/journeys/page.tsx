
"use client";

import { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { fetchJourneys, createJourney, deleteJourney } from '@/lib/api-client';
import type { Journey } from '@/types/journey';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Map, Loader2, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { NavigationContext } from '@/components/layout/AppShell';

export default function JourneysPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navContext = useContext(NavigationContext);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newJourneyName, setNewJourneyName] = useState('');
  const [newJourneyDescription, setNewJourneyDescription] = useState('');
  
  const { data: journeys = [], isLoading, error } = useQuery<Journey[]>({
    queryKey: ['journeys', user?.uid],
    queryFn: fetchJourneys,
    enabled: !!user,
  });

  const handleNavigation = () => {
    if (navContext) {
      navContext.setIsNavigating(true);
    }
  };

  const createMutation = useMutation({
    mutationFn: (newJourneyData: { name: string; description: string | null }) => createJourney(newJourneyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journeys', user?.uid] });
      toast({ title: "Journey Created!", description: `"${newJourneyName}" is ready for trips.` });
      setIsCreateDialogOpen(false);
      setNewJourneyName('');
      setNewJourneyDescription('');
    },
    onError: (err: Error) => {
      toast({ title: "Error Creating Journey", description: err.message, variant: "destructive" });
    }
  });
  
  const deleteMutation = useMutation({
      mutationFn: deleteJourney,
      onSuccess: () => {
          queryClient.invalidateQueries({queryKey: ['journeys', user?.uid]});
          toast({title: "Journey Deleted"});
      },
      onError: (err: Error) => {
          toast({title: "Delete Failed", description: err.message, variant: "destructive"});
      }
  });

  const handleCreateJourney = () => {
    if (!newJourneyName.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    createMutation.mutate({ name: newJourneyName, description: newJourneyDescription || null });
  };
  
  const handleDeleteJourney = (journey: Journey) => {
      if (window.confirm(`Are you sure you want to delete the journey "${journey.name}"? This cannot be undone.`)) {
          deleteMutation.mutate(journey.id);
      }
  }

  if (isLoading) {
    return <div className="space-y-4">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
    </div>;
  }

  if (error) {
    return <div className="text-destructive">Error loading journeys: {error.message}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline mb-2 text-primary flex items-center">
            <Map className="mr-3 h-8 w-8" /> Your Journeys
          </h1>
          <p className="text-muted-foreground font-body">
            Group individual trips into epic adventures.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-body">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Journey
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-headline">Create a New Journey</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="journeyName">Journey Name</Label>
                <Input id="journeyName" value={newJourneyName} onChange={(e) => setNewJourneyName(e.target.value)} placeholder="e.g., The Big Lap 2025" />
              </div>
              <div>
                <Label htmlFor="journeyDescription">Description (Optional)</Label>
                <Textarea id="journeyDescription" value={newJourneyDescription} onChange={(e) => setNewJourneyDescription(e.target.value)} placeholder="A short description of your adventure." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateJourney} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Journey
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {journeys.length === 0 ? (
          <p className="text-center text-muted-foreground font-body py-10">
            You haven't created any journeys yet.
          </p>
        ) : (
          journeys.map((journey) => (
            <Card key={journey.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <Link href={`/journeys/${journey.id}`} onClick={handleNavigation}>
                          <CardTitle className="font-headline text-xl text-primary hover:underline">{journey.name}</CardTitle>
                        </Link>
                        <CardDescription className="text-sm">
                            {journey.tripIds.length} {journey.tripIds.length === 1 ? 'trip' : 'trips'} | Created on {format(parseISO(journey.createdAt), 'PP')}
                        </CardDescription>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => handleDeleteJourney(journey)} disabled={deleteMutation.isPending && deleteMutation.variables === journey.id}>
                         <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{journey.description || 'No description provided.'}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
