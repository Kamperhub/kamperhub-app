
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Sparkles } from 'lucide-react';

export default function RewardsPage() {
  return (
    <div className="space-y-8 flex flex-col items-center text-center">
      <div className="flex items-center text-primary">
        <Award className="mr-3 h-10 w-10" />
        <h1 className="text-4xl font-headline">KamperHub Rewards</h1>
      </div>
      <p className="text-xl font-body text-muted-foreground max-w-2xl">
        Get ready for an exciting new way to enhance your caravanning journey!
      </p>
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-accent flex items-center justify-center">
            <Sparkles className="mr-2 h-6 w-6" /> Rewards Program Coming Soon!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-body text-lg text-foreground mb-4">
            We're busy developing a fantastic rewards program to thank you for being a part of the KamperHub community.
          </p>
          <p className="font-body text-muted-foreground">
            Soon, you'll be able to earn points, unlock badges for your achievements (like distance traveled or trips completed), and access exclusive benefits.
          </p>
          <div className="mt-6 p-4 bg-muted/50 rounded-md flex items-center justify-center">
            <Award className="w-16 h-16 text-primary opacity-30" />
          </div>
          <p className="font-body text-sm text-muted-foreground mt-4">
            Stay tuned for more updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
