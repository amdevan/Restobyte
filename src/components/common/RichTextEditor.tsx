import React, { useRef, useEffect } from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

const ToolbarButton: React.FC<{ label: string; onClick: () => void; disabled?: boolean }>
  = ({ label, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="px-2 py-1 text-sm rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
  >
    {label}
  </button>
);

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className }) => {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const handleInput = () => {
    const html = editorRef.current?.innerHTML || '';
    onChange(html);
  };

  const promptLink = () => {
    const url = window.prompt('Enter URL');
    if (url) exec('createLink', url);
  };

  const clearFormatting = () => {
    exec('removeFormat');
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 mb-2">
        <ToolbarButton label="B" onClick={() => exec('bold')} />
        <ToolbarButton label="I" onClick={() => exec('italic')} />
        <ToolbarButton label="U" onClick={() => exec('underline')} />
        <ToolbarButton label="H1" onClick={() => exec('formatBlock', 'H1')} />
        <ToolbarButton label="H2" onClick={() => exec('formatBlock', 'H2')} />
        <ToolbarButton label="Quote" onClick={() => exec('formatBlock', 'BLOCKQUOTE')} />
        <ToolbarButton label="• List" onClick={() => exec('insertUnorderedList')} />
        <ToolbarButton label="1. List" onClick={() => exec('insertOrderedList')} />
        <ToolbarButton label="Link" onClick={promptLink} />
        <ToolbarButton label="Clear" onClick={clearFormatting} />
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[160px] p-2 border rounded-md bg-white prose prose-sm max-w-none"
        data-placeholder={placeholder || ''}
        style={{ outline: 'none' }}
      />
      <style>{`
        [data-placeholder]:empty:before { 
          content: attr(data-placeholder); 
          color: #9CA3AF; 
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;