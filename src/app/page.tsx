// app/page.tsx
import ChatInterface from '@/components/chat-interface';
import { Suspense } from 'react';

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <Suspense fallback={<div className="text-center">Loading weather assistant...</div>}>
        <ChatInterface />
      </Suspense>
    </main>
  );
}