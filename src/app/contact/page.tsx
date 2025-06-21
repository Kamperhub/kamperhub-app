
"use client";

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail as MailIcon, Send, User, Type, MailOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CONTACT_EMAIL = 'info@kamperhub.com'; // Your GoDaddy/contact email

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters long"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit: SubmitHandler<ContactFormData> = (data) => {
    const mailtoLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(
      `Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`
    )}`;
    
    try {
      window.location.href = mailtoLink;
      toast({
        title: "Opening Email Client",
        description: "Your email client should open shortly. If not, please manually send an email.",
      });
      reset(); // Reset form after attempting to open mail client
    } catch (error) {
        console.error("Failed to open mailto link:", error);
        toast({
            title: "Could Not Open Email Client",
            description: `Please manually send an email to ${CONTACT_EMAIL}. You can copy the details from the form.`,
            variant: "destructive",
            duration: 7000,
        });
    }
  };

  return (
    <div className="space-y-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <MailIcon className="mr-3 h-7 w-7" /> Contact KamperHub
          </CardTitle>
          <CardDescription className="font-body">
            Have questions, feedback, or need support? Fill out the form below, and clicking "Send Email" will open your default email client with the details pre-filled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-body text-sm text-muted-foreground mb-4">
            Our direct contact email is: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline font-semibold">{CONTACT_EMAIL}</a>
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name" className="font-body">Your Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Jane Doe"
                  className="font-body pl-10"
                />
              </div>
              {errors.name && <p className="text-sm text-destructive mt-1 font-body">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="email" className="font-body">Your Email Address</Label>
              <div className="relative">
                <MailOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="e.g., your.email@example.com"
                  className="font-body pl-10"
                />
              </div>
              {errors.email && <p className="text-sm text-destructive mt-1 font-body">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="subject" className="font-body">Subject</Label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="subject"
                  {...register("subject")}
                  placeholder="e.g., Question about Trip Planner"
                  className="font-body pl-10"
                />
              </div>
              {errors.subject && <p className="text-sm text-destructive mt-1 font-body">{errors.subject.message}</p>}
            </div>

            <div>
              <Label htmlFor="message" className="font-body">Message</Label>
              <Textarea
                id="message"
                {...register("message")}
                placeholder="Please type your message here..."
                className="font-body min-h-[120px]"
                rows={5}
              />
              {errors.message && <p className="text-sm text-destructive mt-1 font-body">{errors.message.message}</p>}
            </div>
            
            <Button type="submit" className="w-full font-body bg-primary hover:bg-primary/90 text-primary-foreground">
              <Send className="mr-2 h-4 w-4" /> Send Email via Your Mail App
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
