import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChecklistTabContent } from '@/components/features/checklists/ChecklistTabContent';
import { initialChecklists } from '@/types/checklist';

export default function ChecklistsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary">Camping Checklists</h1>
        <p className="text-muted-foreground font-body mb-6">
          Stay organized with customizable checklists for every stage of your trip. Add, remove, or modify items to suit your needs.
        </p>
      </div>
      <Tabs defaultValue="preDeparture" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-4">
          <TabsTrigger value="preDeparture" className="font-body">Pre-Departure</TabsTrigger>
          <TabsTrigger value="campsiteSetup" className="font-body">Campsite Setup</TabsTrigger>
          <TabsTrigger value="packDown" className="font-body">Pack-Down</TabsTrigger>
        </TabsList>
        <TabsContent value="preDeparture">
          <ChecklistTabContent category="preDeparture" initialItems={initialChecklists.preDeparture} />
        </TabsContent>
        <TabsContent value="campsiteSetup">
          <ChecklistTabContent category="campsiteSetup" initialItems={initialChecklists.campsiteSetup} />
        </TabsContent>
        <TabsContent value="packDown">
          <ChecklistTabContent category="packDown" initialItems={initialChecklists.packDown} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
