'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedManager } from '@/components/admin/FeedManager';
import { DraftManager } from '@/components/admin/DraftManager';
import { Satellite } from 'lucide-react';

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return <div className="flex justify-center items-center h-[50vh]"><Satellite className="animate-pulse h-10 w-10 text-primary opacity-50" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage RSS feeds and review AI-curated drafts.</p>
      </div>

      <Tabs defaultValue="drafts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="drafts">Review Drafts</TabsTrigger>
          <TabsTrigger value="feeds">Manage Feeds</TabsTrigger>
        </TabsList>
        <TabsContent value="drafts" className="space-y-4">
          <DraftManager />
        </TabsContent>
        <TabsContent value="feeds" className="space-y-4">
          <FeedManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
