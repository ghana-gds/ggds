/**
 * Stacked table. On a narrow screen `.ggds-table--stack` shows each row as a card (table.css); this names each cell
 * after its column (data-label, shown above the cell's words) and gives every part its table role explicitly, so
 * screen readers still announce a table, rows and column names when the CSS changes how it is drawn. A cell that
 * already has a data-label keeps it, so a server can write its own words.
 *
 * Markup: `<table class="ggds-table ggds-table--stack">` with `<th scope="col">` column titles in `<thead>`.
 */
export function initStackedTable(table: HTMLTableElement): void {
  if (table.dataset['ggdsStacked'] !== undefined) return;
  const titles = [...(table.tHead?.rows[0]?.cells ?? [])].flatMap((th) => Array<string>(th.colSpan).fill(th.textContent?.trim() ?? ''));
  if (!titles.length) return;

  table.setAttribute('role', 'table');
  for (const group of [table.tHead, ...table.tBodies]) group?.setAttribute('role', 'rowgroup');
  for (const row of table.rows) {
    row.setAttribute('role', 'row');
    let col = 0;
    for (const cell of row.cells) {
      const header = cell.tagName === 'TH';
      const scope = cell.getAttribute('scope');
      cell.setAttribute('role', header ? (scope === 'row' ? 'rowheader' : 'columnheader') : 'cell');
      if (!header && !cell.hasAttribute('data-label') && titles[col]) cell.dataset['label'] = titles[col];
      col += cell.colSpan;
    }
  }
  table.dataset['ggdsStacked'] = '';
}
