'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firebase-utils';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function DraftManager() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'articles'),
      where('status', '==', 'draft'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDrafts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'articles');
    });

    return unsubscribe;
  }, []);

  const handlePublish = async (id: string) => {
    try {
      await updateDoc(doc(db, 'articles', id), {
        status: 'published',
        updatedAt: Date.now(),
        publishedAt: Date.now()
      });
      toast.success('Article published.');
    } catch (err) {
      toast.error('Failed to publish article.');
      handleFirestoreError(err, OperationType.UPDATE, `articles/${id}`);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'articles', id));
      toast.success('Draft rejected and deleted.');
    } catch (err) {
      toast.error('Failed to reject draft.');
      handleFirestoreError(err, OperationType.DELETE, `articles/${id}`);
    }
  };

  if (loading) return <div className="text-muted-foreground animate-pulse">Loading drafts...</div>;

  if (drafts.length === 0) {
    return (
      <Card className="border-dashed bg-transparent shadow-none h-48 flex items-center justify-center">
        <p className="text-muted-foreground">No pending drafts to review.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {drafts.map((article) => (
        <Card key={article.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-4">
              <div>
                <CardTitle className="text-xl/tight font-medium mb-1">{article.title}</CardTitle>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>From: {article.sourceName || 'Unknown Source'}</span>
                  <span>&bull;</span>
                  <span>{new Date(article.publishedAt || article.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <a href={article.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-sm text-foreground/80 leading-relaxed max-w-4xl">{article.summary}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {article.topics?.map((topic: string) => (
                <Badge key={topic} variant="secondary" className="font-normal font-mono text-[10px] uppercase">{topic}</Badge>
              ))}
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t flex justify-end gap-3 pt-4">
            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleReject(article.id)}>
              <Trash2 className="h-4 w-4 mr-2" /> Reject
            </Button>
            <Button size="sm" onClick={() => handlePublish(article.id)}>
              <CheckCircle className="h-4 w-4 mr-2" /> Publish Live
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
