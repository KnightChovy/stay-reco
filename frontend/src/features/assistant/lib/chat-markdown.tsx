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

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[]; start: number };

const BULLET = /^\s*(?:[-*•])\s+(.*)$/;
const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/;

/**
 * Where a numbered list that the parser had to split resumes. The assistant often writes "1. Phòng A", a few bullet
 * details, then "2. Phòng B": that is two `<ol>`s here, and the second must show 2, not 1. When it numbers every item
 * "1." (lazy Markdown), the count carries on from the previous list as long as only bullet lists stand between them.
 */
function startOf(result: Block[], written: number): number {
  for (let index = result.length - 1; index >= 0; index -= 1) {
    const block = result[index];
    if (block.kind === "ul") continue;
    if (block.kind === "ol") {
      const next = block.start + block.items.length;
      return written < next ? next : written;
    }
    break;
  }
  return written;
}

function blocks(source: string): Block[] {
  const result: Block[] = [];
  for (const raw of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const bullet = line.match(BULLET);
    const numbered = !bullet ? line.match(NUMBERED) : null;
    const last = result[result.length - 1];
    if (bullet) {
      if (last && last.kind === "ul") last.items.push(bullet[1]);
      else result.push({ kind: "ul", items: [bullet[1]] });
    } else if (numbered) {
      if (last && last.kind === "ol") last.items.push(numbered[2]);
      else result.push({ kind: "ol", items: [numbered[2]], start: startOf(result, Number(numbered[1])) });
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
        const items = block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{inline(item, `${blockIndex}-${itemIndex}`)}</li>
        ));
        return block.kind === "ul" ? (
          <ul key={blockIndex} className="list-disc space-y-1 pl-5">
            {items}
          </ul>
        ) : (
          <ol key={blockIndex} start={block.start} className="list-decimal space-y-1 pl-5">
            {items}
          </ol>
        );
      })}
    </div>
  );
}
