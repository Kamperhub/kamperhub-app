
import type { AiGeneratedArticle } from '@/types/learn';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// Separator is no longer needed

interface ArticleDisplayCardProps {
  article: AiGeneratedArticle;
}

export function ArticleDisplayCard({ article }: ArticleDisplayCardProps) {
  return (
    <Card className="shadow-lg"> {/* Removed flex flex-col h-full */}
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">{article.title}</CardTitle>
        <CardDescription className="font-body text-sm text-muted-foreground">
          Article on: {article.topic} {/* Updated text */}
        </CardDescription>
      </CardHeader>
      {/* CardContent and its children (introduction, sections, conclusion) are removed */}
    </Card>
  );
}
