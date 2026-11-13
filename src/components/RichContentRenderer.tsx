import React from 'react';

interface RichContentRendererProps {
  content: string;
  textColor?: string;
}

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({
  content,
  textColor,
}) => {
  const blocks = (content || '')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4 leading-relaxed" style={textColor ? { color: textColor } : undefined}>
      {blocks.map((block, idx) => {
        if (block.startsWith('### ')) {
          return (
            <h3 key={idx} className="font-serif text-xl sm:text-2xl font-semibold pt-2">
              {block.slice(4)}
            </h3>
          );
        }
        if (block.startsWith('## ')) {
          return (
            <h2 key={idx} className="font-serif text-2xl sm:text-3xl font-semibold pt-3">
              {block.slice(3)}
            </h2>
          );
        }
        if (block.startsWith('# ')) {
          return (
            <h2 key={idx} className="font-serif text-3xl font-semibold pt-3">
              {block.slice(2)}
            </h2>
          );
        }

        const lines = block.split('\n').map((l) => l.trim());
        const isList = lines.every((l) => l.startsWith('- ') || l.startsWith('* '));
        if (isList) {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1.5 text-sm sm:text-base opacity-90">
              {lines.map((line, li) => (
                <li key={li}>{line.slice(2)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={idx} className="text-sm sm:text-base opacity-90 whitespace-pre-line">
            {block}
          </p>
        );
      })}
    </div>
  );
};
