
'use server';

/**
 * @fileOverview A flow for correcting malformed Zen rule JSON.
 *
 * - correctZenRuleClause - A function that attempts to fix an invalid Zen rule clause.
 * - CorrectZenRuleClauseInput - The input type for the correctZenRuleClause function.
 * - CorrectZenRuleClauseOutput - The return type for the correctZenRuleClause function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectZenRuleClauseInputSchema = z.object({
  malformedJson: z
    .string()
    .describe(
      'A string containing a malformed or invalid JSON object that should represent a Zen rule clause.'
    ),
});
export type CorrectZenRuleClauseInput = z.infer<typeof CorrectZenRuleClauseInputSchema>;

const CorrectZenRuleClauseOutputSchema = z.object({
  ruleClause: z
    .string()
    .describe('The corrected Zen rule clause syntax (a single JSON object with "description", "when" and "then" properties).'),
});
export type CorrectZenRuleClauseOutput = z.infer<typeof CorrectZenRuleClauseOutputSchema>;

export async function correctZenRuleClause(
  input: CorrectZenRuleClauseInput
): Promise<CorrectZenRuleClauseOutput> {
  return correctZenRuleClauseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'correctZenRuleClausePrompt',
  input: {schema: CorrectZenRuleClauseInputSchema},
  output: {schema: CorrectZenRuleClauseOutputSchema},
  prompt: `You are an AI expert in Zen rule syntax. The following JSON is malformed or invalid. Please correct it so that it becomes a valid Zen rule clause.

The response must be a single JSON object.
The object must have "description", "when", and "then" properties. The value for "description" must be a string. The value for both "when" and "then" must be an array of objects.

Each object in the "when" array must have the following structure: {"input": "...", "operator": "...", "value": "..."}.
Each object in the "then" array must have the following structure: {"output": "...", "value": "..."}.
For equality comparisons in the "when" clause, you must use the "==" operator.

Here are the available inputs and their possible values:
- Input "previousEmployeeStatus" can be one of: 'any', 'active', 'leaver', 'new_joiner', 'third_party', 'FSP', 'secondary', 'deactivated', 'deceased'.
- Input "newEmployeeStatus" can be one of: 'any', 'active', 'leaver', 'new_joiner', 'third_party', 'FSP', 'secondary', 'deactivated', 'deceased'.

Here are the available outputs and their possible values:
- Output "primaryCardAction" can be one of: 'new', 'activate', 'deactivate'.
- Output "secondaryCardAction" can be one of: 'new', 'activate', 'deactivate'.
- Output "expiresIn" can be one of: '1 month', '3 months', '1 year', '5 years'.
- Output "afterServicePeriod" can be one of: '1 month', '3 months'.

Do not use any other values for inputs or outputs.

Malformed JSON:
\`\`\`json
{{{malformedJson}}}
\`\`\`

Corrected Zen Rule Clause (JSON):`,
});

const correctZenRuleClauseFlow = ai.defineFlow(
  {
    name: 'correctZenRuleClauseFlow',
    inputSchema: CorrectZenRuleClauseInputSchema,
    outputSchema: CorrectZenRuleClauseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
