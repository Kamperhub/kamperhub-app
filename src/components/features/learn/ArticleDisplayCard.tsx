
import type { AiGeneratedArticle } from '@/types/learn';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Eye } from 'lucide-react';

interface ArticleDisplayCardProps {
  article: AiGeneratedArticle;
}

export function ArticleDisplayCard({ article }: ArticleDisplayCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="font-headline text-xl text-primary">{article.title}</CardTitle>
        <CardDescription className="font-body text-sm text-muted-foreground pt-1">
          Topic: {article.topic}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 flex-grow">
        <p className="font-body text-sm text-muted-foreground line-clamp-3">
          {article.introduction}
        </p>
      </CardContent>
      <CardFooter className="pt-2 pb-4 px-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="font-body w-full sm:w-auto ml-auto bg-accent text-accent-foreground hover:bg-accent/90">
              <Eye className="mr-2 h-4 w-4" /> Read Full Article
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl text-primary">{article.title}</DialogTitle>
              <DialogDescription className="font-body text-muted-foreground">
                Topic: {article.topic}
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-3" />
            <ScrollArea className="flex-1 min-h-0"> 
              <div className="space-y-4 font-body text-foreground pr-4">
                <p className="text-base leading-relaxed whitespace-pre-line">{article.introduction}</p>
                {article.sections.map((section, index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="font-headline text-lg font-semibold text-primary">{section.heading}</h3>
                    <p className="text-base leading-relaxed whitespace-pre-line">{section.content}</p>
                  </div>
                ))}
                <Separator className="my-4" />
                <div>
                  <h3 className="font-headline text-lg font-semibold text-primary">Conclusion</h3>
                  <p className="text-base leading-relaxed whitespace-pre-line">{article.conclusion}</p>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4 pt-4 border-t">
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="font-body">
                        Close
                    </Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
