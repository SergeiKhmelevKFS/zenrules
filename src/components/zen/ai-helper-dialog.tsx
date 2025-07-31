
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getZenSuggestion } from '@/app/actions';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, PlusCircle, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { RuleClause, RuleAction, RuleCondition } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const formSchema = z.object({
  description: z.string().min(10, {
    message: 'Please describe the rule in at least 10 characters.',
  }),
});

type AiHelperDialogProps = {
  onUseSuggestion: (suggestion: string) => void;
};

const ACTION_CONFIG: { [key: string]: string } = {
    primaryCardAction: 'Primary Card',
    secondaryCardAction: 'Secondary Card',
    expiresIn: 'Expires In',
};

const getActionLabel = (action: RuleAction): string => {
    const label = ACTION_CONFIG[action.output] || action.output;
    return `${label}: ${action.value}`;
}

function RulePreview({ suggestion }: { suggestion: string }) {
    try {
        const cleanedSuggestion = suggestion
            .replace(/^```json\s*/, '')
            .replace(/```$/, '')
            .trim();
        
        const parsedClause = JSON.parse(cleanedSuggestion) as Partial<RuleClause>;

        if (!parsedClause.when || !parsedClause.then) {
            throw new Error("Invalid rule structure. Missing 'when' or 'then'.");
        }

        const whenConditions: RuleCondition[] = Array.isArray(parsedClause.when) ? parsedClause.when : [parsedClause.when];
        const thenActions: RuleAction[] = Array.isArray(parsedClause.then) ? parsedClause.then : [parsedClause.then];

        const fromStatus = whenConditions.find(c => c.input === 'previousEmployeeStatus')?.value ?? '-';
        const toStatus = whenConditions.find(c => c.input === 'newEmployeeStatus')?.value ?? '-';
        
        return (
            <div className="rounded-md border bg-muted/50">
                 {parsedClause.description && <div className="p-3 text-sm text-muted-foreground italic">"{parsedClause.description}"</div>}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>From Status</TableHead>
                            <TableHead>To Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>{String(fromStatus)}</TableCell>
                            <TableCell>{String(toStatus)}</TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {thenActions.length > 0 ? (
                                        thenActions.map((action, index) => (
                                            <Badge key={`${action.output}-${index}`} variant="secondary">{getActionLabel(action)}</Badge>
                                        ))
                                    ) : (
                                        <span className="text-xs text-muted-foreground">No actions</span>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        )
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error.';
        return (
            <div className="space-y-2">
                <Alert variant="destructive">
                    <AlertTitle>Preview Error</AlertTitle>
                    <AlertDescription>
                        The AI's suggestion could not be displayed as a preview.
                        <p className="font-mono text-xs mt-2">{errorMessage}</p>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }
}


export default function AiHelperDialog({ onUseSuggestion }: AiHelperDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSuggestion('');
    const result = await getZenSuggestion({ description: values.description });
    setIsLoading(false);

    if (result.success && result.data) {
      setSuggestion(result.data.ruleClause);
    } else {
      toast({
        variant: 'destructive',
        title: 'AI Helper Error',
        description: result.error || 'An unknown error occurred.',
      });
    }
  }
  
  const handleUseSuggestion = () => {
    onUseSuggestion(suggestion);
    setIsOpen(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
      setSuggestion('');
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Wand2 className="mr-2 h-4 w-4" />
          AI Helper
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>AI-Powered Rule Generator</DialogTitle>
          <DialogDescription>
            Describe the business rule you want to create in plain English. The AI
            will generate the Zen rule syntax for you.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'If an employee becomes a leaver, deactivate their primary card.'"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Rule'
              )}
            </Button>
          </form>
        </Form>
        {suggestion && (
          <div className="mt-4 space-y-4">
            <div>
                <h3 className="font-semibold mb-2">Suggested Rule:</h3>
                <RulePreview suggestion={suggestion} />
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <div className="flex items-center text-sm">
                    <Terminal className="mr-2 h-4 w-4" />
                    Raw AI Response
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <pre className="p-4 bg-muted rounded-md overflow-x-auto text-xs font-code whitespace-pre-wrap break-all">
                    <code>{suggestion}</code>
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Button onClick={handleUseSuggestion} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Rule to Table
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
