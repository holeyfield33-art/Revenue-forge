'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { checkQuotaStatus, logOutreachActivity, getProjects } from '@/app/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface QuotaStatus {
  quota_met: boolean;
  daily_quota: number;
  today_count: number;
  remaining: number;
}

export default function GauntletPage() {
  const router = useRouter();
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectGithub, setNewProjectGithub] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [contactPlatform, setContactPlatform] = useState<'email' | 'twitter' | 'linkedin' | 'other'>('email');
  const [contactInfo, setContactInfo] = useState('');
  const [contactNotes, setContactNotes] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load quota status
        const quotaResult = await checkQuotaStatus();
        if (quotaResult.error) {
          setError(quotaResult.error);
          return;
        }
        setQuotaStatus(quotaResult.data);

        // Redirect if quota is already met
        if (quotaResult.data.quota_met) {
          router.push('/dashboard');
          return;
        }

        // Load projects
        const projectsResult = await getProjects();
        if (projectsResult.error) {
          console.error('Failed to load projects');
        } else {
          setProjects(projectsResult.data || []);
          if (projectsResult.data && projectsResult.data.length > 0) {
            setSelectedProject(projectsResult.data[0].id);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleLogOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!selectedProject || !contactInfo) {
        setError('Please select a project and enter contact information');
        return;
      }

      const result = await logOutreachActivity({
        projectId: selectedProject,
        platform: contactPlatform,
        contactInfo,
        notes: contactNotes || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      // Update quota status
      if (result.data) {
        setQuotaStatus({
          quota_met: result.data.quota_met,
          daily_quota: quotaStatus?.daily_quota || 5,
          today_count: result.data.today_count,
          remaining: result.data.remaining,
        });

        // Reset form
        setContactInfo('');
        setContactNotes('');

        // If quota is met, redirect to dashboard
        if (result.data.quota_met) {
          setTimeout(() => {
            router.push('/dashboard');
          }, 500);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
          <p className="text-zinc-400">Loading your gauntlet...</p>
        </div>
      </div>
    );
  }

  const progressPercent = quotaStatus
    ? Math.min(100, (quotaStatus.today_count / quotaStatus.daily_quota) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Lock className="w-8 h-8 text-red-500" />
            <h1 className="text-4xl font-bold text-white">THE GAUNTLET</h1>
          </div>
          <p className="text-zinc-400">
            Complete your daily outreach quota to unlock your dashboard
          </p>
        </div>

        {/* Quota Status */}
        {quotaStatus && (
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardHeader>
              <CardTitle>Daily Quota Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">
                  {quotaStatus.today_count} / {quotaStatus.daily_quota} contacts
                </span>
                <span className="text-sm font-semibold text-green-400">
                  {quotaStatus.remaining} remaining
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-500 to-green-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {quotaStatus.quota_met ? (
                <div className="flex items-center gap-2 p-3 bg-green-950 border border-green-800 rounded text-green-200">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Quota complete! Unlocking dashboard...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-red-950 border border-red-800 rounded text-red-200">
                  <AlertCircle className="w-5 h-5" />
                  <span>Log {quotaStatus.remaining} more contacts to proceed</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Form */}
        {!quotaStatus?.quota_met && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Log Outreach Contact</CardTitle>
              <CardDescription>
                Record each contact you reach out to. Be authentic.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogOutreach} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-950 border border-red-800 rounded text-red-200 text-sm">
                    {error}
                  </div>
                )}

                {/* Project Selection */}
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  {projects.length === 0 ? (
                    <div className="p-3 bg-zinc-800 rounded border border-zinc-700 text-zinc-400 text-sm">
                      <p className="mb-2">No projects yet. Create one to get started.</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDialog(true)}
                      >
                        Create First Project
                      </Button>
                    </div>
                  ) : (
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select a project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDialog(true)}
                  >
                    + New Project
                  </Button>
                </div>

                {/* Platform Selection */}
                <div className="space-y-2">
                  <Label htmlFor="platform">Contact Platform</Label>
                  <select
                    value={contactPlatform}
                    onChange={(e) =>
                      setContactPlatform(e.target.value as typeof contactPlatform)
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="email">Email</option>
                    <option value="twitter">Twitter/X</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Info</Label>
                  <Input
                    id="contact"
                    placeholder={
                      contactPlatform === 'email'
                        ? 'name@example.com'
                        : contactPlatform === 'twitter'
                        ? '@username'
                        : 'LinkedIn profile URL'
                    }
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    required
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <textarea
                    id="notes"
                    placeholder="What was discussed? Why are they interested?"
                    value={contactNotes}
                    onChange={(e) => setContactNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-20 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || !selectedProject || !contactInfo}
                >
                  {submitting ? 'Logging...' : 'Log Contact'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Footer Message */}
        <div className="mt-8 text-center text-zinc-500 text-sm">
          <p>
            The Gauntlet is your daily ritual. No dashboard. No metrics. Only results.
          </p>
          <p className="mt-2">
            Each contact brings you closer to unlocking the command center.
          </p>
        </div>
      </div>

      {/* New Project Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Start tracking a new idea or business
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                placeholder="My awesome SaaS"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectGithub">GitHub URL (optional)</Label>
              <Input
                id="projectGithub"
                placeholder="https://github.com/..."
                value={newProjectGithub}
                onChange={(e) => setNewProjectGithub(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setNewProjectName('');
                setNewProjectGithub('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (newProjectName.trim()) {
                  // This would need a createProject action
                  setShowDialog(false);
                  setNewProjectName('');
                  setNewProjectGithub('');
                }
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
