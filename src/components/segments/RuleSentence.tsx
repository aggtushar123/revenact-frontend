import type { SentencePart } from '../../features/segments/ruleSentence';
import { MONO } from '../organizations/portfolio/styles';

/** The rules as one line: fields and values in ink, figures in DM Mono
 *  (decided when the parts were built, Ruling G16/G17 — never guessed here
 *  from the text), a record the reader can't open in italics, the joining
 *  words muted. */
export function RuleSentence({ parts, className = '' }: { parts: SentencePart[]; className?: string }) {
  return (
    <p className={`text-[13px] text-ink-muted ${className}`}>
      {parts.map((part, index) => {
        if (part.role === 'kind' || part.role === 'field') {
          return (
            <span key={index} className="font-semibold text-ink">
              {part.text}
            </span>
          );
        }
        if (part.role === 'value') {
          return (
            <span key={index} className={`text-ink ${part.numeric ? MONO : ''}`}>
              {part.text}
            </span>
          );
        }
        if (part.role === 'hidden') return <em key={index}>{part.text}</em>;
        return <span key={index}>{part.text}</span>;
      })}
    </p>
  );
}
