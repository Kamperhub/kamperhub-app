// src/app/(public)/contact/page.tsx
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit: SubmitHandler<ContactFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message.');
      }

      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We'll get back to you soon.",
      });
      reset();
    } catch (error: any) {
      toast({
        title: "Error Sending Message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <Mail className="mr-3 h-6 w-6" />
            Contact Us
          </CardTitle>
          <CardDescription className="font-body">
            Have a question, feedback, or need support? Fill out the form below and we'll get back to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="font-body">Your Name</Label>
                <Input id="name" {...register("name")} placeholder="Jane Doe" disabled={isSubmitting} className="font-body" />
                {errors.name && <p className="text-sm text-destructive font-body mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="email" className="font-body">Your Email</Label>
                <Input id="email" type="email" {...register("email")} placeholder="jane.doe@example.com" disabled={isSubmitting} className="font-body" />
                {errors.email && <p className="text-sm text-destructive font-body mt-1">{errors.email.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="subject" className="font-body">Subject</Label>
              <Input id="subject" {...register("subject")} placeholder="e.g., Feedback on Trip Planner" disabled={isSubmitting} className="font-body" />
              {errors.subject && <p className="text-sm text-destructive font-body mt-1">{errors.subject.message}</p>}
            </div>
            <div>
              <Label htmlFor="message" className="font-body">Message</Label>
              <Textarea id="message" {...register("message")} placeholder="Tell us what's on your mind..." rows={6} disabled={isSubmitting} className="font-body" />
              {errors.message && <p className="text-sm text-destructive font-body mt-1">{errors.message.message}</p>}
            </div>
            <div className="text-right">
              <Button type="submit" className="w-full sm:w-auto font-body bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
