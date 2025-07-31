
'use server';

/**
 * @fileOverview A flow for suggesting a single Zen rule clause based on natural language descriptions.
 *
 * - suggestZenRuleClause - A function that suggests a Zen rule clause.
 * - SuggestZenRuleClauseInput - The input type for the suggestZenRuleClause function.
 * - SuggestZenRuleClauseOutput - The return type for the suggestZenRuleClause function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestZenRuleClauseInputSchema = z.object({
  description: z
    .string()
    .describe(
      'A natural language description of the desired behavior of a single business rule.'
    ),
});
export type SuggestZenRuleClauseInput = z.infer<typeof SuggestZenRuleClauseInputSchema>;

const SuggestZenRuleClauseOutputSchema = z.object({
  ruleClause: z
    .string()
    .describe('The suggested Zen rule clause syntax (a single JSON object with "description", "when", and "then" properties, where "when" and "then" are arrays) based on the description.'),
});
export type SuggestZenRuleClauseOutput = z.infer<typeof SuggestZenRuleClauseOutputSchema>;

export async function suggestZenRuleClause(
  input: SuggestZenRuleClauseInput
): Promise<SuggestZenRuleClauseOutput> {
  return suggestZenRuleClauseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestZenRuleClausePrompt',
  input: {schema: SuggestZenRuleClauseInputSchema},
  output: {schema: SuggestZenRuleClauseOutputSchema},
  prompt: `You are an AI expert in Zen rule syntax. Based on the provided natural language description, suggest a single JSON object representing a rule clause.

The object must have "description", "when", and "then" properties. The value for "description" must be a string. The value for both "when" and "then" must be an array of objects.

Each object in the "when" array must have the following structure: {"input": "...", "operator": "...", "value": "..."}.
Each object in the "then" array must have the following structure: {"output": "...", "value": "..."}.
For equality comparisons in the "when" clause, you must use the "==" operator.

Here are the available inputs and their possible values:
- Input "previousEmployeeStatus" can be one of: 'any', 'active', 'leaver', 'new_joiner', 'third_party', 'FSP'.
- Input "newEmployeeStatus" can be one of: 'any', 'active', 'leaver', 'new_joiner', 'third_party', 'FSP'.

Here are the available outputs and their possible values:
- Output "primaryCardAction" can be one of: 'new', 'activate', 'deactivate'.
- Output "secondaryCardAction" can be one of: 'new', 'activate', 'deactivate'.
- Output "expiresIn" can be one of: '1 month', '3 months', '1 year', '5 years'.

Do not use any other values for inputs or outputs.

Description: {{{description}}}

Suggested Zen Rule Clause (JSON):`,
});

const suggestZenRuleClauseFlow = ai.defineFlow(
  {
    name: 'suggestZenRuleClauseFlow',
    inputSchema: SuggestZenRuleClauseInputSchema,
    outputSchema: SuggestZenRuleClauseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
