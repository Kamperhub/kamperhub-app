
// src/components/features/learn/TermsOfServiceContent.tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from 'lucide-react';

export function TermsOfServiceContent() {
  return (
    <div className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl 2xl:prose-2xl mx-auto p-1 space-y-4 font-body text-foreground">
      <h2 className="font-headline text-2xl text-primary border-b pb-2 mb-4">KamperHub Terms of Service</h2>

      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle className="font-headline">Placeholder Content</AlertTitle>
        <AlertDescription className="font-body">
          This is a placeholder for the KamperHub Terms of Service. In a real application, this section would contain detailed legal terms and conditions governing the use of the application, user responsibilities, data privacy (linking to a Privacy Policy), limitations of liability, intellectual property rights, and procedures for amendments or termination of service.
        </AlertDescription>
      </Alert>

      <section>
        <h3 className="font-headline text-xl text-primary">1. Introduction</h3>
        <p>Welcome to KamperHub! These terms and conditions outline the rules and regulations for the use of KamperHub's Application, located at [Your App URL Here].</p>
        <p>By accessing this application we assume you accept these terms and conditions. Do not continue to use KamperHub if you do not agree to take all of the terms and conditions stated on this page.</p>
      </section>

      <section>
        <h3 className="font-headline text-xl text-primary">2. Intellectual Property Rights</h3>
        <p>Other than the content you own, under these Terms, KamperHub and/or its licensors own all the intellectual property rights and materials contained in this Application. You are granted limited license only for purposes of viewing the material contained on this Application.</p>
      </section>

      <section>
        <h3 className="font-headline text-xl text-primary">3. Restrictions</h3>
        <p>You are specifically restricted from all of the following:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Publishing any Application material in any other media.</li>
          <li>Selling, sublicensing and/or otherwise commercializing any Application material.</li>
          <li>Publicly performing and/or showing any Application material.</li>
          <li>Using this Application in any way that is or may be damaging to this Application.</li>
          <li>Using this Application in any way that impacts user access to this Application.</li>
          <li>Using this Application contrary to applicable laws and regulations, or in any way may cause harm to the Application, or to any person or business entity.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-headline text-xl text-primary">4. Your Content</h3>
        <p>In these Application Standard Terms and Conditions, “Your Content” shall mean any audio, video text, images or other material you choose to display on this Application. By displaying Your Content, you grant KamperHub a non-exclusive, worldwide irrevocable, sub licensable license to use, reproduce, adapt, publish, translate and distribute it in any and all media.</p>
        <p>Your Content must be your own and must not be invading any third-party’s rights. KamperHub reserves the right to remove any of Your Content from this Application at any time without notice.</p>
      </section>

       <section>
        <h3 className="font-headline text-xl text-primary">5. No warranties</h3>
        <p>This Application is provided “as is,” with all faults, and KamperHub express no representations or warranties, of any kind related to this Application or the materials contained on this Application. Also, nothing contained on this Application shall be interpreted as advising you.</p>
      </section>

      <section>
        <h3 className="font-headline text-xl text-primary">6. Limitation of liability</h3>
        <p>In no event shall KamperHub, nor any of its officers, directors and employees, shall be held liable for anything arising out of or in any way connected with your use of this Application whether such liability is under contract. KamperHub, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Application.</p>
        <p className="font-body text-sm text-muted-foreground mt-2">Specifically, any calculations or information provided by KamperHub, such as weight estimations, fuel calculations, or route suggestions, are for informational purposes only and should be verified independently. Always consult official sources and use certified weighbridges for legal compliance.</p>
      </section>

      <section>
        <h3 className="font-headline text-xl text-primary">7. Indemnification</h3>
        <p>You hereby indemnify to the fullest extent KamperHub from and against any and/or all liabilities, costs, demands, causes of action, damages and expenses arising in any way related to your breach of any of the provisions of these Terms.</p>
      </section>
      
      <section>
        <h3 className="font-headline text-xl text-primary">8. Severability</h3>
        <p>If any provision of these Terms is found to be invalid under any applicable law, such provisions shall be deleted without affecting the remaining provisions herein.</p>
      </section>

      <section>
        <h3 className="font-headline text-xl text-primary">9. Variation of Terms</h3>
        <p>KamperHub is permitted to revise these Terms at any time as it sees fit, and by using this Application you are expected to review these Terms on a regular basis.</p>
      </section>

      <section>
        <h3 className="font-headline text-xl text-primary">10. Governing Law & Jurisdiction</h3>
        <p>These Terms will be governed by and interpreted in accordance with the laws of [Your State/Country], and you submit to the non-exclusive jurisdiction of the state and federal courts located in [Your State/Country] for the resolution of any disputes.</p>
      </section>

      <hr className="my-6"/>
      <p className="text-center text-muted-foreground text-sm">Last updated: [Date of Last Update]</p>
    </div>
  );
}
