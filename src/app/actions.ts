
'use server';

import { suggestZenRuleClause, type SuggestZenRuleClauseInput } from '@/ai/flows/suggest-zen-syntax';
import { correctZenRuleClause } from '@/ai/flows/correct-zen-syntax';
import type { RuleClause } from '@/lib/types';


function isValidRuleClause(suggestion: string): boolean {
    if (!suggestion) return false;
    try {
        const parsed = JSON.parse(suggestion) as Partial<RuleClause>;
        if (!parsed || typeof parsed !== 'object') return false;

        const hasWhen = Array.isArray(parsed.when) && parsed.when.length > 0;
        const hasThen = Array.isArray(parsed.then); // 'then' can be empty

        if (!hasWhen || !hasThen) return false;

        // Check structure of first 'when' condition
        const firstCondition = parsed.when![0];
        const hasCorrectWhenStructure = 'input' in firstCondition && 'operator' in firstCondition && 'value' in firstCondition;

        return hasCorrectWhenStructure;
    } catch (e) {
        return false;
    }
}


export async function getZenSuggestion(input: SuggestZenRuleClauseInput): Promise<{ success: boolean; data?: { ruleClause: string; }; error?: string; }> {
    try {
        let result = await suggestZenRuleClause(input);
        let suggestion = result.ruleClause;

        // Clean the suggestion before validation
        const cleanedSuggestion = suggestion
            .replace(/^```json\s*/, '')
            .replace(/```$/, '')
            .trim();

        if (!isValidRuleClause(cleanedSuggestion)) {
            // If invalid, try to correct it
            const correctionResult = await correctZenRuleClause({ malformedJson: cleanedSuggestion });
            suggestion = correctionResult.ruleClause;
        }

        if (suggestion) {
          // Return the raw JSON string for the preview component
          return { success: true, data: { ruleClause: suggestion } };
        }
        return { success: false, error: 'AI returned an empty suggestion.' };
    } catch (error) {
        console.error('Error getting Zen suggestion:', error);
        return { success: false, error: 'Failed to get suggestion from AI. Please try again.' };
    }
}

