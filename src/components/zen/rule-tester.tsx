
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Play, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type RuleTesterProps = {
  ruleJson: string;
};

// A simple mock of the Zen rule engine evaluation
function evaluateRule(rule: any, input: any): any {
  // Hit Policy: 'first'
  for (const clause of rule.rules) {
    let conditionsMet = true;
    for (const condition of clause.when) {
      if (condition.value === 'any') {
        continue; // Wildcard match
      }
      
      const inputValue = input[condition.input];
      let conditionResult = false;
      switch (condition.operator) {
        case '==':
          conditionResult = inputValue == condition.value;
          break;
        case '!=':
          conditionResult = inputValue != condition.value;
          break;
        case '>':
          conditionResult = inputValue > condition.value;
          break;
        case '<':
          conditionResult = inputValue < condition.value;
          break;
        default:
          conditionsMet = false;
          break;
      }
      if (!conditionResult) {
        conditionsMet = false;
        break;
      }
    }

    if (conditionsMet) {
      const result: { [key: string]: any } = {};
      for (const action of clause.then) {
        result[action.output] = action.value;
      }
      // Ensure all outputs have a value
      for (const outputDef of rule.outputs) {
        if (!(outputDef.name in result)) {
          result[outputDef.name] = null; // or a default value based on type
        }
      }
      return result;
    }
  }

  // No rule matched
  return rule.outputs.reduce((acc: any, output: any) => {
    acc[output.name] = null; // Default to null if no rule matches
    return acc;
  }, {});
}


export default function RuleTester({ ruleJson }: RuleTesterProps) {
  const [testInput, setTestInput] = useState('{\n  "previousEmployeeStatus": "active",\n  "newEmployeeStatus": "leaver"\n}');
  const [output, setOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = () => {
    setIsLoading(true);
    setError(null);
    setOutput(null);

    setTimeout(() => {
      try {
        const rule = JSON.parse(ruleJson);
        const input = JSON.parse(testInput);

        const result = evaluateRule(rule, input);
        setOutput(JSON.stringify(result, null, 2));

      } catch (err) {
        if (err instanceof Error) {
          setError(`Evaluation Error: ${err.message}`);
        } else {
          setError('An unknown error occurred during evaluation.');
        }
      } finally {
        setIsLoading(false);
      }
    }, 500); // Simulate network delay/processing time
  };

  return (
    <Card className="flex-shrink-0">
      <CardHeader>
        <CardTitle>Rule Tester</CardTitle>
        <CardDescription>
          Provide input data to test your business rules and see the output.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-input">Test Input (JSON)</Label>
          <Textarea
            id="test-input"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className="font-code h-32"
            placeholder='{ "property": "value" }'
          />
        </div>
        <Button onClick={handleTest} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Run Test
        </Button>
        {error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {output && (
          <div className="space-y-2">
            <Label htmlFor="test-output">Output</Label>
            <Textarea
              id="test-output"
              readOnly
              value={output}
              className="font-code h-32 bg-muted/50"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
