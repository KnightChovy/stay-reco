import { Fragment, type ReactNode } from "react";

/**
 * The little Markdown the assistant writes (docs/api/assistant.md: bold, lists), turned into React elements. No HTML
 * is ever injected: text stays text, so a reply cannot smuggle markup into the page.
 *
 * Supported: paragraphs, line breaks, bullet lines ("-", "*", "•"), numbered lines ("1."), **bold**, *italic*.
 */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-b${index}`} className="font-semibold">
          {match[1]}
        </strong>,
      );
    } else {
      nodes.push(<em key={`${keyPrefix}-i${index}`}>{match[2]}</em>);
    }
    last = pattern.lastIndex;
    index += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Block = { kind: "p"; lines: string[] } | { kind: "ul" | "ol"; items: string[] };

const BULLET = /^\s*(?:[-*•])\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

function blocks(source: string): Block[] {
  const result: Block[] = [];
  for (const raw of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const bullet = line.match(BULLET);
    const numbered = !bullet ? line.match(NUMBERED) : null;
    const last = result[result.length - 1];
    if (bullet || numbered) {
      const kind = bullet ? "ul" : "ol";
      const item = (bullet ?? numbered)![1];
      if (last && last.kind === kind) last.items.push(item);
      else result.push({ kind, items: [item] });
    } else if (line.trim() === "") {
      result.push({ kind: "p", lines: [] });
    } else if (last && last.kind === "p" && last.lines.length > 0) {
      last.lines.push(line);
    } else {
      result.push({ kind: "p", lines: [line] });
    }
  }
  return result.filter((block) => (block.kind === "p" ? block.lines.length > 0 : block.items.length > 0));
}

export function ChatMarkdown({ content }: { content: string }) {
  return (
    <div className="space-y-2 break-words">
      {blocks(content).map((block, blockIndex) => {
        if (block.kind === "p") {
          return (
            <p key={blockIndex}>
              {block.lines.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                  {lineIndex > 0 && <br />}
                  {inline(line, `${blockIndex}-${lineIndex}`)}
                </Fragment>
              ))}
            </p>
          );
        }
        const List = block.kind === "ul" ? "ul" : "ol";
        return (
          <List key={blockIndex} className={block.kind === "ul" ? "list-disc space-y-1 pl-5" : "list-decimal space-y-1 pl-5"}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{inline(item, `${blockIndex}-${itemIndex}`)}</li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
