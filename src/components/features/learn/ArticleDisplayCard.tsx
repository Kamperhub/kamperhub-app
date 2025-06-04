
import type { AiGeneratedArticle } from '@/types/learn';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ArticleDisplayCardProps {
  article: AiGeneratedArticle;
}

export function ArticleDisplayCard({ article }: ArticleDisplayCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">{article.title}</CardTitle>
        <CardDescription className="font-body text-sm text-muted-foreground">
          Generated article on: {article.topic}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-headline text-lg text-accent mb-2">Introduction</h3>
          <p className="font-body text-base whitespace-pre-line">{article.introduction}</p>
        </div>
        <Separator />
        {article.sections.map((section, index) => (
          <div key={index}>
            <h4 className="font-headline text-md text-secondary-foreground font-semibold mb-1">{section.heading}</h4>
            <p className="font-body text-base whitespace-pre-line">{section.content}</p>
            {index < article.sections.length -1 && <Separator className="my-3"/>}
          </div>
        ))}
        <Separator />
        <div>
          <h3 className="font-headline text-lg text-accent mb-2">Conclusion</h3>
          <p className="font-body text-base whitespace-pre-line">{article.conclusion}</p>
        </div>
      </CardContent>
    </Card>
  );
}
