
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { navItems } from '@/lib/navigation';
import { MountainSnow } from 'lucide-react';

export default function DashboardPage() {
  const features = navItems.filter(item => item.href !== '/'); // Exclude Dashboard itself

  return (
    <div className="space-y-8">
      <header className="text-center py-8">
        <MountainSnow className="h-16 w-16 mx-auto text-primary mb-4" />
        <h1 className="text-4xl md:text-5xl font-headline text-primary mb-2">Welcome to KamperHub</h1>
        <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
          Your all-in-one companion for safer and more enjoyable caravanning adventures. Manage your vehicle weights, checklists, routes, and more!
        </p>
      </header>

      <section>
        <h2 className="text-3xl font-headline text-center mb-8 text-primary">Explore Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link href={feature.href} key={feature.label} passHref>
              <Card className="hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col">
                <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                  <feature.icon className="w-10 h-10 text-accent" />
                  <CardTitle className="text-2xl font-headline">{feature.label}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground font-body">
                    Access tools and information for {feature.label.toLowerCase()} to enhance your caravanning experience.
                  </p>
                  <div className="mt-4">
                    <Image 
                      src="https://placehold.co/600x400.png"
                      alt={`${feature.label} placeholder image`}
                      width={600}
                      height={400}
                      className="rounded-md object-cover aspect-video"
                      data-ai-hint={feature.keywords || 'travel adventure'}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
