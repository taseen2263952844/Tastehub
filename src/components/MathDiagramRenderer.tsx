import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import katex from 'katex';
import DOMPurifyFallback from './mathHelper';

export interface MathDiagramRendererProps {
  text?: string;
  equationLatex?: string;
  diagramSvg?: string;
  imageUrl?: string;
  imageAlt?: string;
  className?: string;
}

function renderLatexInlineAndBlock(input: string): string {
  if (!input) return '';
  // Split out display math $$...$$ first, then inline $...$
  const escaped = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const withDisplay = escaped.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    try {
      return katex.renderToString(
        tex.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        { displayMode: true, throwOnError: false }
      );
    } catch {
      return tex;
    }
  });

  return withDisplay.replace(/\$([^$\n]+?)\$/g, (_, tex) => {
    try {
      return katex.renderToString(
        tex.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        { displayMode: false, throwOnError: false }
      );
    } catch {
      return tex;
    }
  });
}

export const MathDiagramRenderer: React.FC<MathDiagramRendererProps> = ({
  text,
  equationLatex,
  diagramSvg,
  imageUrl,
  imageAlt = 'Question diagram',
  className = '',
}) => {
  const renderedHtml = useMemo(() => (text ? renderLatexInlineAndBlock(text) : ''), [text]);

  const equationHtml = useMemo(() => {
    if (!equationLatex?.trim()) return '';
    try {
      return katex.renderToString(equationLatex.trim(), {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return equationLatex;
    }
  }, [equationLatex]);

  const sanitizedSvg = useMemo(() => {
    if (!diagramSvg?.trim()) return '';
    return DOMPurifyFallback.sanitizeSvg(diagramSvg);
  }, [diagramSvg]);

  return (
    <div className={`space-y-3 ${className}`}>
      {text && (
        <div
          className="leading-relaxed text-[#111915] whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      )}

      {equationHtml && (
        <div
          className="py-2.5 px-4 rounded-xl bg-[#EEF2EE]/70 border border-[#E2E7E2] overflow-x-auto text-center"
          dangerouslySetInnerHTML={{ __html: equationHtml }}
        />
      )}

      {sanitizedSvg && (
        <div
          className="p-3 rounded-xl bg-white border border-[#E2E7E2] inline-block max-w-full overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
        />
      )}

      {imageUrl && (
        <div className="rounded-xl overflow-hidden border border-[#E2E7E2] bg-white max-w-lg">
          <img src={imageUrl} alt={imageAlt} className="w-full h-auto max-h-80 object-contain" />
        </div>
      )}
    </div>
  );
};
