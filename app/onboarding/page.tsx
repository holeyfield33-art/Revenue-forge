'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { gradeOffer } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default function OnboardingPage() {
  const router = useRouter();
  const [sentence, setSentence] = useState('');
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [flash, setFlash] = useState<'idle' | 'red' | 'green'>('idle');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setFeedback('');
    setScore(null);

    try {
      const result = await gradeOffer(sentence);
      setScore(result.score);
      setFeedback(result.feedback);

      if (result.error) {
        setFlash('red');
        return;
      }

      if (result.qualified) {
        setFlash('green');
        setTimeout(() => {
          router.push('/gauntlet');
        }, 700);
        return;
      }

      setFlash('red');
    } finally {
      setLoading(false);
    }
  };

  const flashClasses =
    flash === 'red'
      ? 'border-red-500/60 bg-red-950/60 shadow-[0_0_0_1px_rgba(239,68,68,0.3),0_0_40px_rgba(239,68,68,0.15)]'
      : flash === 'green'
        ? 'border-green-500/60 bg-green-950/60 shadow-[0_0_0_1px_rgba(34,197,94,0.3),0_0_40px_rgba(34,197,94,0.15)]'
        : 'border-zinc-800 bg-zinc-950';

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black p-4 flex items-center justify-center">
      <Card className={`w-full max-w-2xl border transition-all duration-300 ${flashClasses}`}>
        <CardHeader>
          <CardTitle className="text-3xl text-white">Offer Gate</CardTitle>
          <CardDescription className="text-zinc-400">
            Define your Buyer, your Product, and your Offer in one sentence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="offerSentence" className="text-sm font-medium text-zinc-200">
                One-sentence offer
              </label>
              <textarea
                id="offerSentence"
                value={sentence}
                onChange={(event) => setSentence(event.target.value)}
                placeholder="I help B2B SaaS founders launch faster with a Next.js boilerplate that saves 40 hours of setup time."
                className="min-h-32 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {score !== null && (
              <div className="rounded border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200">
                <p className="font-semibold text-white">Score: {score}/100</p>
                <p className="mt-1 text-zinc-300">{feedback}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Grading...' : 'Submit Offer'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}