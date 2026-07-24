"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  checkMilestoneStatus,
  logOutreachActivity,
  upgradeOutreachOutcome,
  getOutreachActivities,
  getProjects,
  createProject,
} from "@/app/actions";
import {
  canUpgradeOutcome,
  computeMilestones,
  MILESTONE_TARGETS,
  type OutreachOutcome,
} from "@/lib/milestones";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Circle, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

interface Project {
  id: string;
  name: string;
  status: string;
}

interface MilestoneStatus {
  m1: boolean;
  m2: boolean;
  m3: boolean;
  m4: boolean;
  sent: number;
  replies: number;
  commitments: number;
  dashboard_unlocked: boolean;
}

interface OutreachEntry {
  id: string;
  platform: string;
  contact_info: string;
  outcome: OutreachOutcome;
  created_at: string;
}

const OUTCOME_LABELS: Record<OutreachOutcome, string> = {
  sent: "Sent",
  reply: "Reply",
  commitment: "Commitment",
};

export default function GauntletPage() {
  const router = useRouter();
  const [status, setStatus] = useState<MilestoneStatus | null>(null);
  const [entries, setEntries] = useState<OutreachEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [upgradingId, setUpgradingId] = useState<string>("");
  const [error, setError] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectGithub, setNewProjectGithub] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [contactPlatform, setContactPlatform] = useState<
    "email" | "twitter" | "linkedin" | "other"
  >("email");
  const [contactInfo, setContactInfo] = useState("");
  const [contactOutcome, setContactOutcome] = useState<OutreachOutcome>("sent");
  const [contactNotes, setContactNotes] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load milestone status
        const statusResult = await checkMilestoneStatus();
        if (statusResult.error) {
          setError(statusResult.error);
          return;
        }
        setStatus(statusResult.data);

        // Redirect if the dashboard is already unlocked
        if (statusResult.data.dashboard_unlocked) {
          router.push("/dashboard");
          return;
        }

        // Load projects
        const projectsResult = await getProjects();
        if (projectsResult.error) {
          console.error("Failed to load projects");
        } else {
          setProjects(projectsResult.data || []);
          if (projectsResult.data && projectsResult.data.length > 0) {
            setSelectedProject(projectsResult.data[0].id);
          }
        }

        // Load logged outreach entries
        const entriesResult = await getOutreachActivities();
        if (entriesResult.error) {
          console.error("Failed to load outreach entries");
        } else {
          setEntries(entriesResult.data || []);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleLogOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (!selectedProject || !contactInfo) {
        setError("Please select a project and enter contact information");
        return;
      }

      const result = await logOutreachActivity({
        projectId: selectedProject,
        platform: contactPlatform,
        contactInfo,
        outcome: contactOutcome,
        notes: contactNotes || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      // The RPC returns the updated milestone state
      if (result.data) {
        setStatus({
          m1: result.data.m1,
          m2: result.data.m2,
          m3: result.data.m3,
          m4: result.data.m4,
          sent: result.data.sent,
          replies: result.data.replies,
          commitments: result.data.commitments,
          dashboard_unlocked: result.data.dashboard_unlocked,
        });

        setEntries([
          {
            id: result.data.activity_id,
            platform: contactPlatform,
            contact_info: contactInfo,
            outcome: contactOutcome,
            created_at: new Date().toISOString(),
          },
          ...entries,
        ]);

        // Reset form
        setContactInfo("");
        setContactNotes("");
        setContactOutcome("sent");

        // If the dashboard just unlocked, redirect
        if (result.data.dashboard_unlocked) {
          setTimeout(() => {
            router.push("/dashboard");
          }, 500);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpgrade = async (
    entry: OutreachEntry,
    outcome: "reply" | "commitment",
  ) => {
    setError("");
    setUpgradingId(entry.id);

    try {
      const result = await upgradeOutreachOutcome(entry.id, outcome);

      if (result.error) {
        setError(result.error);
        return;
      }

      setEntries(
        entries.map((e) => (e.id === entry.id ? { ...e, outcome } : e)),
      );

      const statusResult = await checkMilestoneStatus();
      if (statusResult.data) {
        setStatus(statusResult.data);
      }
    } finally {
      setUpgradingId("");
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setError("Project name is required");
      return;
    }

    setError("");
    setCreatingProject(true);

    try {
      const result = await createProject({
        name: newProjectName,
        github_url: newProjectGithub || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setProjects([result.data, ...projects]);
      setSelectedProject(result.data.id);
      setShowDialog(false);
      setNewProjectName("");
      setNewProjectGithub("");
    } finally {
      setCreatingProject(false);
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

  const ladder = status
    ? computeMilestones(status.m1, {
        sent: status.sent,
        replies: status.replies,
        commitments: status.commitments,
      })
    : null;

  const milestones = ladder
    ? [
        {
          key: "m1",
          name: "M1 · Forge the Offer",
          requirement: "Score an offer 85 or higher",
          progress: ladder.m1 ? "Done" : "Locked",
          achieved: ladder.m1,
        },
        {
          key: "m2",
          name: "M2 · First Sparks",
          requirement: `Log ${MILESTONE_TARGETS.sent} outreach contacts — unlocks the dashboard`,
          progress: `${ladder.sent} / ${MILESTONE_TARGETS.sent}`,
          achieved: ladder.m2,
        },
        {
          key: "m3",
          name: "M3 · Conversations",
          requirement: `Get ${MILESTONE_TARGETS.replies} replies (commitments count)`,
          progress: `${ladder.replies} / ${MILESTONE_TARGETS.replies}`,
          achieved: ladder.m3,
        },
        {
          key: "m4",
          name: "M4 · Proof of Demand",
          requirement: `Land ${MILESTONE_TARGETS.commitments} commitment`,
          progress: `${ladder.commitments} / ${MILESTONE_TARGETS.commitments}`,
          achieved: ladder.m4,
        },
      ]
    : [];

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
            Climb the milestone ladder to unlock your dashboard
          </p>
        </div>

        {/* Milestone Ladder */}
        {ladder && (
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardHeader>
              <CardTitle>Milestone Ladder</CardTitle>
              <CardDescription>
                Cumulative progress — nothing resets, records only harden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.key}
                  className={`flex items-center justify-between p-3 rounded border ${
                    milestone.achieved
                      ? "bg-green-950 border-green-800 text-green-200"
                      : "bg-zinc-800 border-zinc-700 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {milestone.achieved ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-500 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold">{milestone.name}</p>
                      <p className="text-xs text-zinc-400">
                        {milestone.requirement}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">
                    {milestone.progress}
                  </span>
                </div>
              ))}

              {ladder.dashboard_unlocked ? (
                <div className="flex items-center gap-2 p-3 bg-green-950 border border-green-800 rounded text-green-200">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Dashboard unlocked! Redirecting...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-red-950 border border-red-800 rounded text-red-200">
                  <AlertCircle className="w-5 h-5" />
                  <span>
                    Log {Math.max(0, MILESTONE_TARGETS.sent - ladder.sent)} more
                    contacts to unlock the dashboard
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Form */}
        {!ladder?.dashboard_unlocked && (
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
                      <p className="mb-2">
                        No projects yet. Create one to get started.
                      </p>
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
                      setContactPlatform(
                        e.target.value as typeof contactPlatform,
                      )
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
                      contactPlatform === "email"
                        ? "name@example.com"
                        : contactPlatform === "twitter"
                          ? "@username"
                          : "LinkedIn profile URL"
                    }
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    required
                  />
                </div>

                {/* Outcome */}
                <div className="space-y-2">
                  <Label htmlFor="outcome">Outcome</Label>
                  <select
                    id="outcome"
                    value={contactOutcome}
                    onChange={(e) =>
                      setContactOutcome(e.target.value as OutreachOutcome)
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="sent">Sent</option>
                    <option value="reply">Got a reply</option>
                    <option value="commitment">Got a commitment</option>
                  </select>
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
                  {submitting ? "Logging..." : "Log Contact"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Logged Entries */}
        {entries.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800 mt-6">
            <CardHeader>
              <CardTitle>Logged Contacts</CardTitle>
              <CardDescription>
                Upgrade an entry when a contact replies or commits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">
                      {entry.contact_info}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {entry.platform} · {OUTCOME_LABELS[entry.outcome]}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {canUpgradeOutcome(entry.outcome, "reply") && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={upgradingId === entry.id}
                        onClick={() => handleUpgrade(entry, "reply")}
                      >
                        Got reply
                      </Button>
                    )}
                    {canUpgradeOutcome(entry.outcome, "commitment") && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={upgradingId === entry.id}
                        onClick={() => handleUpgrade(entry, "commitment")}
                      >
                        Committed
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Footer Message */}
        <div className="mt-8 text-center text-zinc-500 text-sm">
          <p>
            The Gauntlet is proof of progress. No dashboard. No metrics. Only
            results.
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
            {error && (
              <div className="p-3 bg-red-950 border border-red-800 rounded text-red-200 text-sm">
                {error}
              </div>
            )}
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
                setNewProjectName("");
                setNewProjectGithub("");
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={creatingProject || !newProjectName.trim()}
            >
              {creatingProject ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
