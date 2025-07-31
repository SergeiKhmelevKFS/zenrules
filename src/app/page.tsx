
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { Rule, RuleClause } from '@/lib/types';
import RuleTester from '@/components/zen/rule-tester';
import DecisionTableEditor from '@/components/zen/decision-table-editor';
import AiHelperDialog from '@/components/zen/ai-helper-dialog';
import { Button } from '@/components/ui/button';
import { Save, FileUp, CodeXml } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


const defaultRule: Rule = {
  name: "Employee Discount Card Management",
  description: "Handle primary and secondary discount cards based on employee status changes.",
  inputs: [
    { "name": "previousEmployeeStatus", "type": "string" },
    { "name": "newEmployeeStatus", "type": "string" }
  ],
  outputs: [
    { "name": "primaryCardAction", "type": "string" },
    { "name": "secondaryCardAction", "type": "string" },
    { "name": "expiresIn", "type": "string" }
  ],
  rules: [
    {
      "description": "New joiner becomes active, gets a new primary card.",
      "when": [
        { "input": "previousEmployeeStatus", "operator": "==", "value": "new_joiner" },
        { "input": "newEmployeeStatus", "operator": "==", "value": "active" }
      ],
      "then": [
        { "output": "primaryCardAction", "value": "new" },
        { "output": "expiresIn", "value": "5 years" }
      ]
    },
    {
      "description": "Active employee leaves, all cards are deactivated.",
      "when": [
        { "input": "previousEmployeeStatus", "operator": "==", "value": "active" },
        { "input": "newEmployeeStatus", "operator": "==", "value": "leaver" }
      ],
      "then": [
        { "output": "primaryCardAction", "value": "deactivate" },
        { "output": "secondaryCardAction", "value": "deactivate" }
      ]
    }
  ],
  hitPolicy: "first"
};

export default function ZenRuleEditorPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [rule, setRule] = useState<Rule>(defaultRule);
  const { toast } = useToast();
  const [activeView, setActiveView] = useState('editor');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRuleChange = useCallback((newRule: Rule) => {
    setRule(newRule);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    // You could still load from localStorage on initial load if desired
    // For now, we just start with the default.
  }, []);
  
  const handleUseSuggestion = (suggestion: string) => {
    try {
      const cleanedSuggestion = suggestion
            .replace(/^```json\s*/, '')
            .replace(/```$/, '')
            .trim();
      const suggestedClause: RuleClause = JSON.parse(cleanedSuggestion);
      
      // Basic validation to check if it has some expected properties
      if (suggestedClause.when && suggestedClause.then) {
        setRule(prevRule => ({
          ...prevRule,
          rules: [...prevRule.rules, suggestedClause]
        }));
        toast({
          title: "Suggestion Added",
          description: "The AI-generated rule has been added to the table.",
        });
      } else {
        throw new Error("Invalid rule clause structure.");
      }
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Invalid Suggestion",
        description: "The suggestion from the AI was not a valid rule clause.",
      });
    }
  };

  const handleSave = () => {
    try {
      const ruleJson = JSON.stringify(rule, null, 2);
      const blob = new Blob([ruleJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rules.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Rules Downloaded",
        description: "Your business rules have been downloaded as rules.json.",
      });
    } catch {
       toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not prepare the rules for download.",
      });
    }
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File content is not readable text.");
        }
        const parsedRule = JSON.parse(text);
        // Add more validation here if needed to ensure it's a valid Rule object
        setRule(parsedRule);
        toast({
          title: "Rules Imported",
          description: `Successfully imported rules from ${file.name}.`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: "Could not parse the selected file. Please ensure it's a valid JSON rule file.",
        });
      }
    };
    reader.readAsText(file);
    // Reset file input to allow re-uploading the same file
    event.target.value = '';
  };


  if (!isMounted) {
    return null; // Or a loading spinner
  }
  
  const ruleJsonForTester = JSON.stringify(rule, null, 2);

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept="application/json"
        className="hidden"
      />
      <Tabs value={activeView} onValueChange={setActiveView} className="flex flex-col h-screen bg-background text-foreground">
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CodeXml className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Employee Discount Card Management</h1>
            </div>
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="tester">Tester</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex items-center gap-2">
            <AiHelperDialog onUseSuggestion={handleUseSuggestion} />
            <Button variant="outline" onClick={handleImportClick}>
              <FileUp className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </header>
        <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
          <TabsContent value="editor" className="flex-grow mt-0">
            <DecisionTableEditor rule={rule} onRuleChange={handleRuleChange} />
          </TabsContent>
          <TabsContent value="tester" className="mt-0">
            <div className="max-w-3xl mx-auto w-full">
              <RuleTester ruleJson={ruleJsonForTester} />
            </div>
          </TabsContent>
        </main>
      </Tabs>
    </>
  );
}
