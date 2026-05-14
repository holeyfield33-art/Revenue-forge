'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getProjects,
  createProject,
  deleteProject,
  checkQuotaStatus,
} from '@/app/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  CheckCircle2,
  Trash2,
  LogOut,
  Plus,
  Zap,
} from 'lucide-react';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const dynamic = 'force-dynamic';

interface Project {
  id: string;
  name: string;
  description?: string;
  github_url?: string;
  status: 'in_gauntlet' | 'validated' | 'dead';
  gauntlet_start_date: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectGithub, setNewProjectGithub] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [quotaStatus, setQuotaStatus] = useState<any>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Check quota
        const quotaResult = await checkQuotaStatus();
        if (quotaResult.data) {
          setQuotaStatus(quotaResult.data);

          // If quota not met, redirect to gauntlet
          if (!quotaResult.data.quota_met) {
            router.push('/gauntlet');
            return;
          }
        }

        // Load projects
        const projectsResult = await getProjects();
        if (!projectsResult.error) {
          setProjects(projectsResult.data || []);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setError('Project name is required');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const result = await createProject({
        name: newProjectName,
        description: newProjectDescription || undefined,
        github_url: newProjectGithub || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setProjects([result.data, ...projects]);
      setShowNewProject(false);
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectGithub('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const result = await deleteProject(projectId);
      if (result.error) {
        setError(result.error);
        return;
      }

      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated':
        return 'bg-green-950 border-green-800 text-green-200';
      case 'dead':
        return 'bg-red-950 border-red-800 text-red-200';
      case 'in_gauntlet':
      default:
        return 'bg-yellow-950 border-yellow-800 text-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'dead':
        return <AlertCircle className="w-4 h-4" />;
      case 'in_gauntlet':
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-12 h-12 text-green-500 mx-auto mb-4 animate-pulse" />
          <p className="text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black p-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white">Command Center</h1>
            <p className="text-zinc-400 mt-1">Your validation dashboard</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Quota Status */}
      {quotaStatus && (
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Today's Outreach</p>
                <p className="text-2xl font-bold text-white">
                  {quotaStatus.today_count} / {quotaStatus.daily_quota}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400">Quota Status</p>
                <div className="flex items-center gap-2 justify-end mt-1">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <p className="font-semibold text-green-400">Complete</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Projects</h2>
          <Button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-950 border border-red-800 rounded text-red-200 text-sm mb-4">
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-12 pb-12 text-center">
              <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 mb-4">No projects yet</p>
              <Button
                onClick={() => setShowNewProject(true)}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{project.name}</CardTitle>
                      {project.description && (
                        <CardDescription className="mt-1">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {getStatusIcon(project.status)}
                      {project.status.replace('_', ' ')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      View on GitHub →
                    </a>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // Edit functionality
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new idea or business to track
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950 border border-red-800 rounded text-red-200 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="My awesome SaaS"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                placeholder="What does this project do?"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-20 resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub URL (optional)</Label>
              <Input
                id="github"
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
                setShowNewProject(false);
                setNewProjectName('');
                setNewProjectDescription('');
                setNewProjectGithub('');
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={submitting || !newProjectName.trim()}
            >
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
