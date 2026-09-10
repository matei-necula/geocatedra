// Pure markdown-lite parser for "scris" lessons — `WrittenBlock` in
// MaterialRenderer.tsx renders whatever this module produces. Deliberately a
// tiny subset, chosen to match what teachers actually paste: "#".."####"
// headings, a "---" rule, "-"/"*"/"1." lists (one level of nesting via a
// >=2-space indent), GitHub-style "| a | b |" pipe tables, and inline
// "**bold**"/"*italic*". Nothing here touches raw HTML — the output is plain
// data (strings + nested objects), so the caller can only ever render text,
// <strong>/<em>, lists and tables. That is the safety property: never
// dangerouslySetInnerHTML, by construction.
//
// Root cause this module fixes: lesson bodies saved from Windows tools use
// CRLF ("\r\n") line endings. The old splitter cut blocks on /\n{2,}/, which
// never matches inside "\r\n\r\n" (the \r sits between every \n, so two \n's
// are never adjacent) — so a CRLF body collapsed into a single block, every
// nested "#" heading marker leaked out as literal text, and the browser's
// default whitespace handling collapsed it all onto one visual line. Blank
// lines are also not the only block boundary teachers rely on: a heading or
// "---" rule frequently sits right after a paragraph with no blank line
// before it (a single line break, "ca o carte"), so this parser forces a new
// block at those markers too, not only at blank lines.

export type InlineToken = { kind: "text"; text: string } | { kind: "bold"; text: string } | { kind: "em"; text: string };

export interface MdListItem {
	text: string;
	ordered: boolean;
	children: MdListItem[];
}

export type MdBlock =
	| { kind: "heading"; level: 2 | 3 | 4; text: string }
	| { kind: "hr" }
	| { kind: "table"; header: string[]; rows: string[][] }
	| { kind: "list"; ordered: boolean; items: MdListItem[] }
	| { kind: "paragraph"; text: string };

/** CRLF/CR → LF, so a body pasted from Windows still splits into blocks. */
export function normalizeNewlines(body: string): string {
	return body.replace(/\r\n?/g, "\n");
}

// A heading line: one or more "#" then text, space optional ("#Titlu" is
// tolerated). Level is capped later — this just has to consume ALL leading
// hashes so "##### Titlu" doesn't leave a literal "#" in the heading text.
const HEADING_RE = /^(#+)\s*(\S.*)$/;
// Hashes with nothing after them ("#", "##", "# ") aren't a heading — ignore
// rather than print the bare marks as text.
const HASH_ONLY_RE = /^#+\s*$/;
const HR_RE = /^-{3,}$/;
const LIST_ITEM_RE = /^(\s*)(?:[-*]|\d+[.)])\s+(.*)$/;

function isListLine(line: string): boolean {
	return LIST_ITEM_RE.test(line);
}
function isTableLine(line: string): boolean {
	return line.trim().startsWith("|");
}

/**
 * Splits a body into logical blocks. A blank line always breaks a block;
 * additionally a heading or "---" rule always starts (and ends) its own
 * block even with no blank line around it, and list/table lines are never
 * merged with plain paragraph text. This is what makes single-line-broken
 * lesson text ("ca o carte") lay out as headings/lists instead of one run of
 * prose with literal "#" marks in it.
 */
export function splitBlocks(body: string): string[] {
	const lines = normalizeNewlines(body).split("\n");
	const blocks: string[] = [];
	let cur: string[] = [];
	let curKind: "text" | "list" | "table" | null = null;

	function flush() {
		if (cur.length) blocks.push(cur.join("\n"));
		cur = [];
		curKind = null;
	}

	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed === "" || HASH_ONLY_RE.test(trimmed)) {
			// A blank line inside a list/table doesn't split it — teachers'
			// pasted lists often have a blank line between every item (the
			// real "tipuri-de-roci" body does), and that's still one list.
			if (curKind !== "list" && curKind !== "table") flush();
			continue;
		}
		if (HEADING_RE.test(trimmed) || HR_RE.test(trimmed)) {
			flush();
			blocks.push(trimmed);
			continue;
		}
		if (isTableLine(line)) {
			if (curKind !== "table") flush();
			curKind = "table";
			cur.push(line);
			continue;
		}
		if (isListLine(line)) {
			if (curKind !== "list") flush();
			curKind = "list";
			cur.push(line);
			continue;
		}
		// Plain text line. A wrapped continuation right after a list item stays
		// attached to the list; anything after a table row starts fresh.
		if (curKind === "table") flush();
		curKind = "text";
		cur.push(line);
	}
	flush();
	return blocks;
}

const rowCells = (line: string) =>
	line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

function isTableBlock(block: string): boolean {
	const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
	if (lines.length < 2) return false;
	if (!lines.every((l) => l.startsWith("|"))) return false;
	return /^\|?[\s:|-]+\|?$/.test(lines[1]) && lines[1].includes("-");
}

function tableFromBlock(block: string): MdBlock {
	const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
	const header = rowCells(lines[0]);
	const rows = lines.slice(2).map(rowCells);
	return { kind: "table", header, rows };
}

// Turn a block of list lines into (optionally one-level nested) items.
// Top-level items start at column 0; sub-items are indented by >=2 spaces.
export function parseList(block: string): { ordered: boolean; items: MdListItem[] } {
	const items: MdListItem[] = [];
	let ordered = false;
	for (const raw of block.split("\n")) {
		const m = LIST_ITEM_RE.exec(raw);
		if (!m) {
			// wrapped continuation line — append to the last (deepest) item
			const top = items[items.length - 1];
			const target = top && top.children.length ? top.children[top.children.length - 1] : top;
			if (target) target.text += " " + raw.trim();
			continue;
		}
		const isOrdered = /^\s*\d/.test(raw);
		const item: MdListItem = { text: m[2], ordered: isOrdered, children: [] };
		if (m[1].length >= 2 && items.length) {
			items[items.length - 1].children.push(item);
		} else {
			if (!items.length) ordered = isOrdered;
			items.push(item);
		}
	}
	return { ordered, items };
}

/** Classifies one already-split block into a renderable, data-only node. */
export function classifyBlock(block: string): MdBlock {
	const t = block.trim();
	if (HR_RE.test(t)) return { kind: "hr" };
	const heading = HEADING_RE.exec(t);
	if (heading) {
		// "#" → h2, "##" → h3, "###"/"####+" → h4 (the page's own <h1> lives
		// outside this component, and there's no h5 in the prose-ro styles).
		const level = (Math.min(heading[1].length, 3) + 1) as 2 | 3 | 4;
		return { kind: "heading", level, text: heading[2].trim() };
	}
	if (isTableBlock(block)) return tableFromBlock(block);
	if (/^\s*(?:[-*]|\d+[.)])\s/.test(block)) {
		const { ordered, items } = parseList(block);
		return { kind: "list", ordered, items };
	}
	return { kind: "paragraph", text: t.replace(/\n/g, " ") };
}

/** Parses a limited inline markdown subset: only "**bold**" and "*italic*". */
export function parseInline(text: string): InlineToken[] {
	return text
		.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g)
		.filter((part) => part !== "")
		.map((part): InlineToken => {
			const bold = /^\*\*([^*]+)\*\*$/.exec(part);
			if (bold) return { kind: "bold", text: bold[1] };
			const em = /^\*([^*\n]+)\*$/.exec(part);
			if (em) return { kind: "em", text: em[1] };
			return { kind: "text", text: part };
		});
}
