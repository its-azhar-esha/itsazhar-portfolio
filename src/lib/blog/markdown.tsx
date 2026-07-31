import React from "react";

/**
 * Tiny dependency-free Markdown renderer used for blog post content.
 * Supports: headings (##/###), paragraphs, bold, italic, inline code,
 * code blocks, links, blockquotes, unordered/ordered lists, hr and
 * image syntax. Renders React elements (no dangerouslySetInnerHTML),
 * so user content can never inject HTML.
 */

const INLINE_PATTERN =
  /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|!\[[^\]]*\]\([^)]*\)|\[[^\]]+\]\([^)]*\))/g;

const SAFE_URL = /^(https?:\/\/|mailto:|#|\/)/i;

function safeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!SAFE_URL.test(trimmed)) return null;
  return trimmed;
}

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const parts = text.split(INLINE_PATTERN);
  let key = 0;
  for (const part of parts) {
    if (!part) continue;
    const k = `${keyBase}-${key++}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      nodes.push(<strong key={k}>{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("__") && part.endsWith("__") && part.length > 4) {
      nodes.push(<strong key={k}>{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      nodes.push(<em key={k}>{part.slice(1, -1)}</em>);
    } else if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
      nodes.push(<em key={k}>{part.slice(1, -1)}</em>);
    } else if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      nodes.push(
        <code
          key={k}
          className="bg-muted text-foreground border-border/50 rounded border px-1 py-0.5 font-mono text-[0.85em]"
        >
          {part.slice(1, -1)}
        </code>,
      );
    } else if (part.startsWith("![") && part.includes("](")) {
      const match = /^!\[([^\]]*)\]\(([^)]*)\)$/.exec(part);
      if (match) {
        const url = safeUrl(match[2]);
        if (url) {
          nodes.push(
            <img
              key={k}
              src={url}
              alt={match[1] || ""}
              className="my-2 max-w-full rounded-lg"
              loading="lazy"
            />,
          );
        }
      }
    } else if (part.startsWith("[") && part.includes("](")) {
      const match = /^\[([^\]]+)\]\(([^)]*)\)$/.exec(part);
      if (match) {
        const url = safeUrl(match[2]);
        if (url) {
          nodes.push(
            <a
              key={k}
              href={url}
              target={url.startsWith("/") || url.startsWith("#") ? undefined : "_blank"}
              rel={url.startsWith("/") || url.startsWith("#") ? undefined : "noopener noreferrer"}
              className="text-primary decoration-primary/40 hover:decoration-primary underline underline-offset-2 transition-colors"
            >
              {match[1]}
            </a>,
          );
        } else {
          nodes.push(part);
        }
      }
    } else {
      nodes.push(part);
    }
  }
  return nodes;
}

export function renderMarkdown(markdown: string): React.ReactNode {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push(
        <pre
          key={`pre-${key++}`}
          className="bg-muted/60 border-border/50 my-4 overflow-x-auto rounded-lg border p-4 font-mono text-sm"
        >
          <code className={lang ? `language-${lang}` : undefined}>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      blocks.push(<hr key={`hr-${key++}`} className="border-border/60 my-6" />);
      i++;
      continue;
    }

    // Heading
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      const className =
        level === 2
          ? "mt-8 mb-3 scroll-mt-24 text-2xl font-bold tracking-tight"
          : "mt-6 mb-2 scroll-mt-24 text-xl font-semibold tracking-tight";
      blocks.push(
        <h2 key={`h-${key++}`} className={className}>
          {renderInline(text, `h-${key}`)}
        </h2>,
      );
      i++;
      continue;
    }

    // Blockquote (may span multiple lines)
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote
          key={`q-${key++}`}
          className="border-primary/40 bg-primary/5 text-muted-foreground my-4 rounded-r-lg border-l-4 px-4 py-3 italic"
        >
          {quoteLines.map((ql, qi) => (
            <p key={qi}>{renderInline(ql, `q-${key}-${qi}`)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    // Unordered list
    if (/^(\s*[-*•]\s+)/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^(\s*[-*•]\s+)/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*•]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={`ul-${key++}`} className="marker:text-primary/70 my-3 list-disc space-y-1.5 pl-6">
          {items.map((item, li) => (
            <li key={li}>{renderInline(item, `li-${key}-${li}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      blocks.push(
        <ol
          key={`ol-${key++}`}
          className="marker:text-primary/70 my-3 list-decimal space-y-1.5 pl-6"
        >
          {items.map((item, li) => (
            <li key={li}>{renderInline(item, `oli-${key}-${li}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph (consume until blank line or block start)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^```/.test(lines[i]) &&
      !/^#{2,3}\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^(\s*[-*•]\s+)/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^(\s*[-*_]\s*){3,}$/.test(lines[i])
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    blocks.push(
      <p key={`p-${key++}`} className="text-muted-foreground my-3 leading-relaxed">
        {paraLines.map((pl, pi) => (
          <React.Fragment key={pi}>
            {renderInline(pl, `p-${key}-${pi}`)}
            {pi < paraLines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>,
    );
  }

  return <div>{blocks}</div>;
}

/** Strips markdown to plain text (used for excerpts/descriptions). */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
