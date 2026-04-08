// Imports all .wraf files from examples/ as plain text (Vite build-time).
const rawFiles = import.meta.glob<string>("../examples/**/*.wraf", {
  query: "?raw",
  import: "default",
  eager: true,
});

export interface Example {
  id:      string;
  label:   string;
  source:  string;
}

export const examples = new Map<string, Example>();

for (const [filePath, content] of Object.entries(rawFiles)) {
  // filePath: ../examples/<id>.wraf  OR  ../examples/<id>/screen.wraf
  const m = filePath.match(/\.\.\/examples\/([^/]+?)(?:\/screen)?\.wraf$/);
  if (!m) continue;
  const id = m[1];
  examples.set(id, { id, label: toLabel(id), source: content });
}

function toLabel(id: string): string {
  return id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
