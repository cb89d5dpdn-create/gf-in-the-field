const Anthropic = require('@anthropic-ai/sdk');
const { supabaseAdmin } = require('../lib/supabase');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MIN_OBSERVATIONS_REQUIRED = 3;

/**
 * Generate or refresh voice profile for an FSM
 * @param {string} fsmId - UUID of the FSM
 * @returns {Promise<string|null>} Generated profile text or null if insufficient data
 */
async function generateVoiceProfile(fsmId) {
  try {
    // 1. Fetch qualifying observations for this FSM
    const { data: observations, error } = await supabaseAdmin
      .from('observations')
      .select(`
        id,
        visit_date,
        overall_comments,
        org_id,
        rsms!inner(name),
        observation_scores!inner(
          comments,
          observation_areas!inner(label)
        )
      `)
      .eq('fsm_id', fsmId)
      .eq('status', 'sent')
      .eq('exclude_from_voice_profile', false)
      .order('created_at', { ascending: false })
      .limit(20); // Use up to last 20 observations

    if (error) {
      console.error('Voice profile fetch error:', error);
      return null;
    }

    if (!observations || observations.length < MIN_OBSERVATIONS_REQUIRED) {
      console.log(`Voice profile skipped for FSM ${fsmId}: insufficient observations (${observations?.length || 0}/${MIN_OBSERVATIONS_REQUIRED})`);
      return null;
    }

    // 2. Build the text corpus from observation comments
    const corpus = observations.map(obs => {
      const areaComments = obs.observation_scores
        ?.filter(s => s.comments?.trim())
        .map(s => `  [${s.observation_areas?.label}]: ${s.comments}`)
        .join('\n') || '';

      return `
Visit: ${new Date(obs.visit_date).toLocaleDateString('en-AU')} | RSM: ${obs.rsms?.name}
Overall comments: ${obs.overall_comments || '(none)'}
Area observations:
${areaComments || '  (no area comments)'}
      `.trim();
    }).join('\n\n---\n\n');

    console.log(`Generating voice profile for FSM ${fsmId} using ${observations.length} observations...`);

    // 3. Call Claude to generate the voice profile
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 800,
      system: `You are analysing a field sales manager's coaching notes to extract their personal writing style, vocabulary, and company-specific terminology.
Your output will be used to make future AI-generated coaching summaries sound like this specific person wrote them.
Be precise and analytical. Output only the voice profile — no preamble, no explanation.`,
      messages: [{
        role: 'user',
        content: `Below are coaching observation comments written by a Field Sales Manager at Goodman Fielder (FMCG company) across ${observations.length} field visits.

Analyse this writing and produce a Voice Profile covering:

1. VOCABULARY & PHRASES — List 8-12 specific words, phrases, or expressions this person uses repeatedly. Include exact phrases where possible.

2. GOODMAN FIELDER / INDUSTRY TERMS — List any company-specific or FMCG-specific terminology that appears (e.g. "Perfect Store", "ranging", "sell-in", "mission", "Tableau", "activation", "ranging opportunity").

3. WRITING STYLE — 2-3 sentences describing how this person writes.

4. TONE — 1-2 sentences on their emotional register.

5. SUMMARY INSTRUCTION — One paragraph (max 100 words) starting with "When writing summaries for this FSM:". Tell the AI exactly how to mirror this person's voice and which phrases to incorporate.

---
OBSERVATION COMMENTS TO ANALYSE:

${corpus}

---
Output the Voice Profile in the exact structure above. Nothing else.`
      }]
    });

    const profileText = response.content[0]?.text;
    if (!profileText) {
      console.error('Voice profile generation returned no text');
      return null;
    }

    // 4. Extract GF terms detected (simple parse from section 2)
    const gfTermsMatch = profileText.match(/2\.\s*GOODMAN FIELDER[^:]*:([\s\S]*?)(?=3\.)/i);
    const gfTerms = gfTermsMatch
      ? gfTermsMatch[1]
          .split('\n')
          .map(t => t.replace(/^[-•*]\s*/, '').trim())
          .filter(t => t.length > 0 && t.length < 50)
          .slice(0, 20) // Max 20 terms
      : [];

    // 5. Upsert voice profile in DB
    const { error: upsertError } = await supabaseAdmin
      .from('fsm_voice_profiles')
      .upsert({
        fsm_id: fsmId,
        org_id: observations[0]?.org_id,
        profile_text: profileText,
        observations_analysed: observations.length,
        gf_terms_detected: gfTerms,
        last_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'fsm_id' });

    if (upsertError) {
      console.error('Voice profile upsert failed:', upsertError);
      return null;
    }

    console.log(`✅ Voice profile generated for FSM ${fsmId} using ${observations.length} observations`);
    return profileText;

  } catch (err) {
    console.error('Voice profile generation error:', err);
    return null;
  }
}

/**
 * Get existing voice profile for an FSM
 * @param {string} fsmId - UUID of the FSM
 * @returns {Promise<Object|null>} Voice profile data or null
 */
async function getVoiceProfile(fsmId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('fsm_voice_profiles')
      .select('profile_text, observations_analysed, last_generated_at, gf_terms_detected')
      .eq('fsm_id', fsmId)
      .single();

    if (error || !data) return null;
    return data;
  } catch (err) {
    console.error('Voice profile fetch error:', err);
    return null;
  }
}


module.exports = {
  generateVoiceProfile,
  getVoiceProfile
};
