'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firebase-utils';
import { collection, query, orderBy, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { RefreshCw, Plus, Trash2, Rss } from 'lucide-react';
import { toast } from 'sonner';

export function FeedManager() {
  const [feeds, setFeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingIdx, setSyncingIdx] = useState<string | null>(null);

  // New Feed Form
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'feeds'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFeeds(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'feeds');
    });

    return unsubscribe;
  }, []);

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const feedId = crypto.randomUUID();
      await setDoc(doc(db, 'feeds', feedId), {
        name: newTitle,
        url: newUrl,
        topic: newTopic || 'General',
        autoPublish: false,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      toast.success('Feed added successfully');
      setNewTitle('');
      setNewUrl('');
      setNewTopic('');
      setIsDialogOpen(false);
    } catch (err) {
      toast.error('Failed to add feed');
      handleFirestoreError(err, OperationType.CREATE, 'feeds');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'feeds', id));
      toast.success('Feed deleted');
    } catch (err) {
      toast.error('Failed to delete feed');
      handleFirestoreError(err, OperationType.DELETE, `feeds/${id}`);
    }
  };

  const handleSync = async (feed: any) => {
    setSyncingIdx(feed.id);
    try {
      const res = await fetch('/api/rss/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedUrl: feed.url })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch RSS');
      if (!data.items?.length) {
        toast.info('No new items found.');
        setSyncingIdx(null);
        return;
      }

      let added = 0;
      for (const item of data.items) {
        // check if already exists
        const q = query(collection(db, 'articles'), where('url', '==', item.url));
        const existing = await getDocs(q);
        
        if (existing.empty) {
          const articleId = crypto.randomUUID();
          await setDoc(doc(db, 'articles', articleId), {
            ...item,
            sourceId: feed.id,
            sourceName: feed.name,
            status: feed.autoPublish ? 'published' : 'draft',
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          added++;
        }
      }
      
      toast.success(`Synched ${feed.name}: Added ${added} new articles.`);
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
      console.error(err);
    } finally {
      setSyncingIdx(null);
    }
  };

  if (loading) return <div className="text-muted-foreground animate-pulse">Loading feeds...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border">
        <div>
          <h2 className="text-lg font-semibold">Configured Sources</h2>
          <p className="text-sm text-muted-foreground">Manage your RSS targets.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2"/> Add Feed</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddFeed}>
              <DialogHeader>
                <DialogTitle>Add New RSS Feed</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input required placeholder="Feed Name (e.g. XDA Developers)" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                <Input required type="url" placeholder="RSS URL (e.g. https://www.xda-developers.com/feed)" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                <Input placeholder="Default Topic (optional)" value={newTopic} onChange={e => setNewTopic(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="submit">Save Feed</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {feeds.map(feed => (
          <Card key={feed.id} className="relative overflow-hidden flex flex-col">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Rss className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-medium">{feed.name}</CardTitle>
                    <CardDescription className="text-xs truncate max-w-[200px]">{feed.url}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-4 flex-1">
              <div className="flex gap-2">
                <Badge variant="outline">{feed.topic || 'General'}</Badge>
                <Badge variant={feed.autoPublish ? "default" : "secondary"}>
                  {feed.autoPublish ? "Auto Publish" : "Requires Review"}
                </Badge>
              </div>
            </CardContent>
            <div className="flex border-t border-border/40 bg-muted/10">
              <Button 
                variant="ghost" 
                className="flex-1 rounded-none h-12 text-muted-foreground hover:text-foreground" 
                onClick={() => handleSync(feed)}
                disabled={syncingIdx === feed.id}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncingIdx === feed.id ? 'animate-spin' : ''}`} />
                {syncingIdx === feed.id ? 'Syncing...' : 'Sync Feed'}
              </Button>
              <div className="w-px bg-border/40" />
              <Button 
                variant="ghost" 
                className="w-16 rounded-none h-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(feed.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
