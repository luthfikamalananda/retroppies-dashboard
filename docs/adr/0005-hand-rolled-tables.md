# Hand-rolled tables instead of MUI X DataGrid

List pages render tables with plain MUI `<Table>/<TableRow>/<TableCell>` — pagination,
loading skeletons, and the brand-styled header (`brand[100]` cells) are all built by hand —
rather than `@mui/x-data-grid`, even though that package is installed.

We chose this deliberately: the tables are simple server-paginated read views, and the design
calls for tight control over cell rendering (chips, currency formatting, per-row permission-
gated action buttons) and heavy brand styling. Reproducing that inside DataGrid's column/slot
API costs more than it saves, and DataGrid's headline features (client sorting, virtualization,
column resize) aren't needed for these page sizes.

**Consequence:** `@mui/x-data-grid` (and the likewise-unused `@mui/x-date-pickers`) are slated
for removal. Do not reach for DataGrid when adding a list page — follow the hand-rolled table
pattern in [CONTEXT.md](../../CONTEXT.md) (§ UI & Layout Conventions). If a future page genuinely
needs sorting/virtualization at scale, revisit this decision rather than mixing both patterns.
