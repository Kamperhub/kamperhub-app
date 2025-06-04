
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { EmergencyContact, TravelDocument } from '@/types/importantInfo';
import { EMERGENCY_CONTACTS_STORAGE_KEY, TRAVEL_DOCUMENTS_STORAGE_KEY } from '@/types/importantInfo';
import { EmergencyContactForm } from '@/components/features/important-info/EmergencyContactForm';
import { TravelDocumentForm } from '@/components/features/important-info/TravelDocumentForm';
import { ImportantInfoList } from '@/components/features/important-info/ImportantInfoList';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ShieldAlert, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ImportantInfoPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [isLocalStorageReady, setIsLocalStorageReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLocalStorageReady(true);
      try {
        const storedContacts = localStorage.getItem(EMERGENCY_CONTACTS_STORAGE_KEY);
        if (storedContacts) setContacts(JSON.parse(storedContacts));
        
        const storedDocuments = localStorage.getItem(TRAVEL_DOCUMENTS_STORAGE_KEY);
        if (storedDocuments) setDocuments(JSON.parse(storedDocuments));
      } catch (error) {
        console.error("Error loading important info from localStorage:", error);
        toast({
          title: "Error Loading Data",
          description: "Could not load saved information from your browser.",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const saveToLocalStorage = useCallback((key: string, data: any[]) => {
    if (!isLocalStorageReady) return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      toast({
        title: "Error Saving Data",
        description: "Could not save information. Your browser storage might be full.",
        variant: "destructive",
      });
    }
  }, [isLocalStorageReady, toast]);

  // Emergency Contact Handlers
  const handleAddContact = (contact: Omit<EmergencyContact, 'id'>) => {
    const newContact = { ...contact, id: Date.now().toString() };
    const updatedContacts = [...contacts, newContact];
    setContacts(updatedContacts);
    saveToLocalStorage(EMERGENCY_CONTACTS_STORAGE_KEY, updatedContacts);
    toast({ title: "Emergency Contact Added", description: `${newContact.name} has been added.` });
  };

  const handleDeleteContact = (id: string) => {
    const updatedContacts = contacts.filter(c => c.id !== id);
    setContacts(updatedContacts);
    saveToLocalStorage(EMERGENCY_CONTACTS_STORAGE_KEY, updatedContacts);
    toast({ title: "Emergency Contact Removed" });
  };

  // Travel Document Handlers
  const handleAddDocument = (doc: Omit<TravelDocument, 'id'>) => {
    const newDocument = { ...doc, id: Date.now().toString() };
    const updatedDocuments = [...documents, newDocument];
    setDocuments(updatedDocuments);
    saveToLocalStorage(TRAVEL_DOCUMENTS_STORAGE_KEY, updatedDocuments);
    toast({ title: "Travel Document Added", description: `${newDocument.type} - ${newDocument.policyNumber} has been added.` });
  };

  const handleDeleteDocument = (id: string) => {
    const updatedDocuments = documents.filter(d => d.id !== id);
    setDocuments(updatedDocuments);
    saveToLocalStorage(TRAVEL_DOCUMENTS_STORAGE_KEY, updatedDocuments);
    toast({ title: "Travel Document Removed" });
  };
  
  if (!isLocalStorageReady) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-headline mb-6 text-primary flex items-center">
          <ShieldAlert className="mr-3 h-8 w-8" /> Important Info
        </h1>
        <p className="font-body">Loading your saved information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-2 text-primary flex items-center">
          <ShieldAlert className="mr-3 h-8 w-8" /> Important Info
        </h1>
        <p className="text-muted-foreground font-body mb-6">
          Manage your emergency contacts and important travel documents.
        </p>
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-headline">Security Warning & Demo Purpose Only</AlertTitle>
          <AlertDescription className="font-body">
            This information is stored in your browser's LocalStorage and is **NOT SECURE** for real sensitive data. 
            Do not enter actual personal or financial details. In a production application, this data would be encrypted and stored securely on a server with user authentication.
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="contacts" className="font-body">Emergency Contacts</TabsTrigger>
          <TabsTrigger value="documents" className="font-body">Travel Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-primary" />Add Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <EmergencyContactForm onSubmit={handleAddContact} />
            </CardContent>
          </Card>
          <ImportantInfoList
            items={contacts}
            onDelete={handleDeleteContact}
            title="Saved Emergency Contacts"
            itemType="contact"
            className="mt-6"
          />
        </TabsContent>
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" />Add Travel Document</CardTitle>
            </CardHeader>
            <CardContent>
              <TravelDocumentForm onSubmit={handleAddDocument} />
            </CardContent>
          </Card>
          <ImportantInfoList
            items={documents}
            onDelete={handleDeleteDocument}
            title="Saved Travel Documents"
            itemType="document"
            className="mt-6"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
