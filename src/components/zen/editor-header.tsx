
'use client';

import { Button } from '@/components/ui/button';
import { Save, FileUp, CodeXml } from 'lucide-react';
import AiHelperDialog from './ai-helper-dialog';

type EditorHeaderProps = {
  onSave: () => void;
  onLoad: () => void;
  onUseSuggestion: (suggestion: string) => void;
};

export default function EditorHeader({ onSave, onLoad, onUseSuggestion }: EditorHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <CodeXml className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold">ZenRule Editor</h1>
      </div>
      <div className="flex items-center gap-2">
        <AiHelperDialog onUseSuggestion={onUseSuggestion} />
        <Button variant="outline" onClick={onLoad}>
          <FileUp className="mr-2 h-4 w-4" />
          Load
        </Button>
        <Button onClick={onSave}>
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </div>
    </header>
  );
}
