const { supabaseAdmin } = require('./supabase')

// Claude Sonnet 4.5 pricing (USD per token)
const PRICING = {
  'claude-sonnet-4-5': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  'claude-sonnet-4-5-20250929': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
}

/**
 * Log a Claude API call to ai_usage_log.
 * Fire-and-forget — never throws.
 */
async function logUsage({ orgId, fsmId, type, model, usage }) {
  try {
    const pricing = PRICING[model] || PRICING['claude-sonnet-4-5']
    const inputTokens = usage?.input_tokens || 0
    const outputTokens = usage?.output_tokens || 0
    const estimatedCostUsd = inputTokens * pricing.input + outputTokens * pricing.output

    await supabaseAdmin.from('ai_usage_log').insert({
      org_id: orgId,
      fsm_id: fsmId,
      type,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd: estimatedCostUsd,
    })
  } catch (err) {
    console.error('logUsage failed (non-blocking):', err.message)
  }
}

module.exports = { logUsage }
