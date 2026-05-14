'use server';

import { createServerClient_ } from '@/lib/supabase/server';

type GradeOfferResult = {
  score: number;
  feedback: string;
  qualified: boolean;
  projectId?: string;
  error?: string;
};

interface LogOutreachInput {
  projectId: string;
  platform: 'email' | 'twitter' | 'linkedin' | 'other';
  contactInfo: string;
  notes?: string;
}

export async function logOutreachActivity(input: LogOutreachInput) {
  try {
    const supabase = await createServerClient_();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Call the log_outreach_activity RPC function
    const { data, error } = await supabase.rpc('log_outreach_activity', {
      user_id_param: user.id,
      project_id_param: input.projectId,
      platform_param: input.platform,
      contact_info_param: input.contactInfo,
      notes_param: input.notes || null,
    });

    if (error) {
      console.error('Error logging outreach:', error);
      return { error: 'Failed to log outreach activity' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'An error occurred' };
  }
}

export async function checkQuotaStatus() {
  try {
    const supabase = await createServerClient_();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Call the check_outreach_gate RPC function
    const { data, error } = await supabase.rpc('check_outreach_gate', {
      user_id_param: user.id,
    });

    if (error) {
      console.error('Error checking quota:', error);
      return { error: 'Failed to check quota' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'An error occurred' };
  }
}

export async function getProjects() {
  try {
    const supabase = await createServerClient_();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return { error: 'Failed to fetch projects' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'An error occurred' };
  }
}

export async function createProject(input: {
  name: string;
  description?: string;
  github_url?: string;
  offer_sentence?: string;
  offer_score?: number;
}) {
  try {
    const supabase = await createServerClient_();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: input.name,
        description: input.description,
        github_url: input.github_url,
        offer_sentence: input.offer_sentence,
        offer_score: input.offer_score ?? 0,
        status: 'in_gauntlet',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return { error: 'Failed to create project' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'An error occurred' };
  }
}

export async function updateProject(
  projectId: string,
  updates: {
    name?: string;
    description?: string;
    github_url?: string;
    status?: 'in_gauntlet' | 'validated' | 'dead';
  }
) {
  try {
    const supabase = await createServerClient_();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return { error: 'Failed to update project' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'An error occurred' };
  }
}

export async function deleteProject(projectId: string) {
  try {
    const supabase = await createServerClient_();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting project:', error);
      return { error: 'Failed to delete project' };
    }

    return { success: true };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'An error occurred' };
  }
}

function generateMockGrade(sentence: string): GradeOfferResult {
  const score = 70 + Math.floor(Math.random() * 26);
  const qualified = score >= 85;

  return {
    score,
    qualified,
    feedback: qualified
      ? 'Clear to proceed'
      : sentence.length < 40
        ? 'Vague buyer. Who exactly is this for?'
        : 'Too broad. Name a specific buyer, concrete product, and measurable outcome.',
  };
}

export async function gradeOffer(sentence: string): Promise<GradeOfferResult> {
  try {
    const supabase = await createServerClient_();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { score: 0, feedback: 'Unauthorized', qualified: false, error: 'Unauthorized' };
    }

    const trimmedSentence = sentence.trim();

    if (!trimmedSentence) {
      return { score: 0, feedback: 'Write one sentence before submitting.', qualified: false };
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0.2,
            messages: [
              {
                role: 'system',
                content:
                  'You are a ruthless, world-class startup advisor grading a user\'s core business proposition. The user must define their Buyer, Product, and Offer in ONE single sentence. Grading Rubric (0-100): Buyer (33 points): Must be hyper-specific (e.g., B2B SaaS founders, not businesses). Product (33 points): Must be a concrete mechanism (e.g., a Next.js boilerplate, not a software solution). Offer (34 points): Must be a clear, compelling outcome or guarantee (e.g., that saves 40 hours of setup time, not that helps them grow). If they use buzzwords, dock points. If they use multiple sentences, dock 50 points. Return ONLY a JSON object with two keys: score (integer) and feedback (a one-sentence harsh critique if below 85, or Clear to proceed if above 85).',
              },
              {
                role: 'user',
                content: trimmedSentence,
              },
            ],
            response_format: {
              type: 'json_object',
            },
          }),
        });

        if (response.ok) {
          const payload = await response.json();
          const content = payload?.choices?.[0]?.message?.content;

          if (content) {
            const parsed = JSON.parse(content) as { score?: number; feedback?: string };
            const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score ?? 0))));
            const feedback =
              parsed.feedback ||
              (score >= 85
                ? 'Clear to proceed'
                : 'Tighten the buyer, product, and offer into one sharp sentence.');

            if (score >= 85) {
              const { data, error } = await supabase
                .from('projects')
                .insert({
                  user_id: user.id,
                  name: trimmedSentence.slice(0, 80),
                  description: trimmedSentence,
                  offer_sentence: trimmedSentence,
                  offer_score: score,
                  status: 'in_gauntlet',
                })
                .select()
                .single();

              if (error) {
                return {
                  score,
                  feedback: 'Could not create project after approval.',
                  qualified: false,
                  error: error.message,
                };
              }

              return { score, feedback: 'Clear to proceed', qualified: true, projectId: data.id };
            }

            return { score, feedback, qualified: false };
          }
        }
      } catch (error) {
        console.error('OpenAI grading failed, using mock fallback:', error);
      }
    }

    const graded = generateMockGrade(trimmedSentence);

    if (graded.qualified) {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: trimmedSentence.slice(0, 80),
          description: trimmedSentence,
          offer_sentence: trimmedSentence,
          offer_score: graded.score,
          status: 'in_gauntlet',
        })
        .select()
        .single();

      if (error) {
        return {
          score: graded.score,
          feedback: 'Could not create project after approval.',
          qualified: false,
          error: error.message,
        };
      }

      return { ...graded, projectId: data.id };
    }

    return graded;
  } catch (error) {
    console.error('Offer grading error:', error);
    return { score: 0, feedback: 'Unable to grade offer right now.', qualified: false, error: 'An error occurred' };
  }
}
