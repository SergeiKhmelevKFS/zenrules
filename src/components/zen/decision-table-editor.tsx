
'use client';

import { useState } from 'react';
import type { Rule, RuleClause, RuleAction } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, ArrowUp, ArrowDown, Expand } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';

type DecisionTableEditorProps = {
  rule: Rule;
  onRuleChange: (newRule: Rule) => void;
};

const OPERATORS = ['==', '!=', '>', '<', '>=', '<='];
const EMPLOYEE_STATUSES = ['any', 'active', 'leaver', 'new_joiner', 'third_party', 'FSP'];
const PRIMARY_CARD_ACTIONS = ['-', 'new', 'activate', 'deactivate'];
const SECONDARY_CARD_ACTIONS = ['-', 'new', 'activate', 'deactivate'];
const EXPIRES_IN_OPTIONS = ['-', '1 month', '3 months', '1 year', '5 years'];

const ACTION_CONFIG = [
    { key: 'primaryCardAction', label: 'Primary Card', options: PRIMARY_CARD_ACTIONS },
    { key: 'secondaryCardAction', label: 'Secondary Card', options: SECONDARY_CARD_ACTIONS },
    { key: 'expiresIn', label: 'Expires In', options: EXPIRES_IN_OPTIONS },
];

function EditDescriptionDialog({
  description,
  onSave,
  isOpen,
  onOpenChange
}: {
  description: string;
  onSave: (newDescription: string) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [localDescription, setLocalDescription] = useState(description);

  const handleSave = () => {
    onSave(localDescription);
    onOpenChange(false);
  };
  
  // Update local state if the external description changes while dialog is open
  useState(() => {
    setLocalDescription(description);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Description</DialogTitle>
        </DialogHeader>
        <Textarea
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          rows={5}
          className="my-4"
          placeholder="Optional rule description..."
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function DecisionTableEditor({ rule, onRuleChange }: DecisionTableEditorProps) {
  const [editingDescription, setEditingDescription] = useState<{ index: number; description: string; } | null>(null);

  const handleInputChange = (field: keyof Rule, value: string) => {
    onRuleChange({ ...rule, [field]: value });
  };

  const handleClauseChange = (rowIndex: number, field: keyof RuleClause, value: string) => {
    const newRules = [...rule.rules];
    (newRules[rowIndex] as any)[field] = value;
    onRuleChange({ ...rule, rules: newRules });
  };

  const handleConditionChange = (rowIndex: number, inputName: string, part: 'operator' | 'value', value: string) => {
    const newRules = [...rule.rules];
    const condition = newRules[rowIndex].when.find(c => c.input === inputName);
    if (condition) {
      (condition as any)[part] = value;
      if (part === 'value' && rule.inputs.find(i => i.name === inputName && i.type === 'string')) {
          condition.operator = '==';
      }
    } else {
      newRules[rowIndex].when.push({ input: inputName, operator: '==', value: '' });
      const newCondition = newRules[rowIndex].when.find(c => c.input === inputName);
      if (newCondition) (newCondition as any)[part] = value;
    }
    onRuleChange({ ...rule, rules: newRules });
  };
  
  const handleActionChange = (rowIndex: number, outputName: string, value: string) => {
    const newRules = [...rule.rules];
    const newActions = [...newRules[rowIndex].then];
    const actionIndex = newActions.findIndex(t => t.output === outputName);

    if (value === '-') {
        // Remove the action if it exists
        if (actionIndex > -1) {
            newActions.splice(actionIndex, 1);
        }
    } else {
        if (actionIndex > -1) {
            // Update existing action
            newActions[actionIndex] = { ...newActions[actionIndex], value };
        } else {
            // Add new action
            newActions.push({ output: outputName, value });
        }
    }
    newRules[rowIndex].then = newActions;
    onRuleChange({ ...rule, rules: newRules });
  };

  const addRuleRow = () => {
    const newRuleClause: RuleClause = {
      description: 'New rule',
      when: rule.inputs.map(input => ({ input: input.name, operator: '==', value: 'any' })),
      then: [],
    };
    const rules = [...rule.rules, newRuleClause];
    onRuleChange({ ...rule, rules });
  };

  const removeRuleRow = (rowIndex: number) => {
    const rules = rule.rules.filter((_, index) => index !== rowIndex);
    onRuleChange({ ...rule, rules });
  };

  const moveRuleRow = (index: number, direction: 'up' | 'down') => {
    const newRules = [...rule.rules];
    const ruleToMove = newRules[index];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (swapIndex < 0 || swapIndex >= newRules.length) {
      return;
    }

    newRules[index] = newRules[swapIndex];
    newRules[swapIndex] = ruleToMove;

    onRuleChange({ ...rule, rules: newRules });
  };
  
  const handleOpenDescriptionEditor = (index: number) => {
    setEditingDescription({ index, description: rule.rules[index].description || '' });
  };
  
  const handleSaveDescription = (newDescription: string) => {
    if (editingDescription !== null) {
      handleClauseChange(editingDescription.index, 'description', newDescription);
    }
    setEditingDescription(null);
  }


  const getActionLabel = (action: RuleAction) => {
    const config = ACTION_CONFIG.find(c => c.key === action.output);
    return config ? `${config.label}: ${action.value}` : `${action.output}: ${action.value}`;
  }

  return (
    <>
       {editingDescription !== null && (
          <EditDescriptionDialog 
            isOpen={editingDescription !== null} 
            onOpenChange={(isOpen) => !isOpen && setEditingDescription(null)}
            description={editingDescription.description}
            onSave={handleSaveDescription}
          />
       )}
        <Card className="flex-grow flex flex-col h-full">
        <CardContent className="flex-grow overflow-hidden p-0">
            <div className="overflow-auto h-full rounded-lg border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Order</TableHead>
                        <TableHead>Description</TableHead>
                        {rule.inputs.map(input => (
                            <TableHead key={input.name}>{input.name === 'previousEmployeeStatus' ? 'From Status' : input.name === 'newEmployeeStatus' ? 'To Status' : input.name}</TableHead>
                        ))}
                        <TableHead>Actions</TableHead>
                        <TableHead className="w-[50px]"> </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {rule.rules.map((clause, rowIndex) => (
                        <TableRow key={rowIndex}>
                        <TableCell className="p-1">
                        <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" disabled={rowIndex === 0} onClick={() => moveRuleRow(rowIndex, 'up')}>
                            <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" disabled={rowIndex === rule.rules.length - 1} onClick={() => moveRuleRow(rowIndex, 'down')}>
                            <ArrowDown className="h-4 w-4" />
                            </Button>
                        </div>
                        </TableCell>
                        <TableCell className="p-1">
                          <div className="flex items-center justify-between gap-2">
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate text-sm text-muted-foreground max-w-[200px]">
                                            {clause.description || <span className="italic text-gray-500">No description</span>}
                                        </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">{clause.description || "No description"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => handleOpenDescriptionEditor(rowIndex)}>
                              <Expand className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        {rule.inputs.map(input => {
                            const condition = clause.when.find(c => c.input === input.name) || { operator: '==', value: '' };
                            
                            if (input.type === 'string') {
                                return (
                                    <TableCell key={input.name} className="p-1">
                                        <Select
                                            value={condition.value as string}
                                            onValueChange={(value) => handleConditionChange(rowIndex, input.name, 'value', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {EMPLOYEE_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                )
                            }

                            return (
                                <TableCell key={input.name} className="p-1">
                                    <div className="flex items-center gap-1">
                                        <Select
                                            value={condition.operator}
                                            onValueChange={(value) => handleConditionChange(rowIndex, input.name, 'operator', value)}
                                        >
                                            <SelectTrigger className="w-[80px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {OPERATORS.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            value={condition.value as string}
                                            onChange={(e) => handleConditionChange(rowIndex, input.name, 'value', e.target.value)}
                                        />
                                    </div>
                                </TableCell>
                            );
                        })}
                        <TableCell className="p-1 align-top">
                            <div className="flex flex-wrap items-center gap-1">
                                {clause.then.length > 0 ? (
                                    clause.then.map(action => (
                                        <Badge key={action.output} variant="secondary">{getActionLabel(action)}</Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-muted-foreground">No actions</span>
                                )}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                        <div className="grid gap-4">
                                            <h4 className="font-medium leading-none">Configure Actions</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Set the outcomes for this rule.
                                            </p>
                                            <Separator />
                                            <div className="grid gap-2">
                                                {ACTION_CONFIG.map(config => {
                                                    const action = clause.then.find(t => t.output === config.key);
                                                    return (
                                                        <div key={config.key} className="grid grid-cols-3 items-center gap-4">
                                                            <Label>{config.label}</Label>
                                                            <Select
                                                                value={action?.value || '-'}
                                                                onValueChange={(value) => handleActionChange(rowIndex, config.key, value)}
                                                            >
                                                                <SelectTrigger className="col-span-2 h-8">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {config.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </TableCell>
                        <TableCell className="p-1 text-center align-top">
                            <Button variant="ghost" size="icon" onClick={() => removeRuleRow(rowIndex)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={2} className="p-1">
                                <Button onClick={addRuleRow} variant="ghost" size="sm" className="w-full justify-start">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Rule
                                </Button>
                            </TableCell>
                            <TableCell colSpan={rule.inputs.length + 2}></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </CardContent>
        <CardFooter>
            <Badge variant="secondary">Hit Policy: {rule.hitPolicy || 'first'}</Badge>
        </CardFooter>
        </Card>
    </>
  );
}
