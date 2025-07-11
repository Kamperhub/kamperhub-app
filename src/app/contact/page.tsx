
"use client";

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail as MailIcon, Send, User, Type, MailOpen, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters long"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit: SubmitHandler<ContactFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }

      toast({
        title: "Message Sent!",
        description: "We've received your message and will get back to you soon.",
      });
      reset();
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
            Have questions, feedback, or need support? Fill out the form below to send us a message directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  disabled={isSubmitting}
                />
              </div>
              {errors.name && <p className="text-sm text-destructive font-body mt-1">{errors.name.message}</p>}
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
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive font-body mt-1">{errors.email.message}</p>}
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
                  disabled={isSubmitting}
                />
              </div>
              {errors.subject && <p className="text-sm text-destructive font-body mt-1">{errors.subject.message}</p>}
            </div>

            <div>
              <Label htmlFor="message" className="font-body">Message</Label>
              <Textarea
                id="message"
                {...register("message")}
                placeholder="Please type your message here..."
                className="font-body min-h-[120px]"
                rows={5}
                disabled={isSubmitting}
              />
              {errors.message && <p className="text-sm text-destructive font-body mt-1">{errors.message.message}</p>}
            </div>
            
            <Button type="submit" className="w-full font-body bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
