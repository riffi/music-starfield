# Music Galaxy

`Music Galaxy` is a curated atlas of music styles and internet radio stations. The app is not a generic streaming directory. It has two connected layers:

1. Canonical taxonomy of music genres, styles, descriptors, forms, instruments, and periods.
2. Curated atlas subset that is rendered in the UI and linked to radio stations.

This document is the working contract for future agents and maintainers.

## Repo Areas

- [`app/src/data/taxonomy.ts`](/c:/work/my/music-galaxy/app/src/data/taxonomy.ts): canonical taxonomy and station bindings.
- [`app/src/data/atlas.ts`](/c:/work/my/music-galaxy/app/src/data/atlas.ts): derived atlas-ready nodes, links, and stations.
- [`app/src/data/selectors.ts`](/c:/work/my/music-galaxy/app/src/data/selectors.ts): selector/helpers for matching nodes and presenting station style metadata.
- [`app/src/App.tsx`](/c:/work/my/music-galaxy/app/src/App.tsx): UI and graph rendering.

## Core Model

### Taxonomy roots

`TaxonomyRoot` is the high-level family. Roots are broader than what is currently shown in the UI. Not every root must be visible in the atlas.

Current roots:

- `ambient_newage`
- `electronic`
- `rock`
- `pop`
- `hiphop`
- `rnb_soul_funk`
- `jazz`
- `classical`
- `metal`
- `punk_hardcore`
- `folk_country_world`
- `latin`
- `reggae_ska_dub`
- `blues`
- `soundtrack_stage`
- `experimental_noise`

### Taxon kinds

Every entry in `styleTaxonomy` has a `kind`:

- `genre`: canonical genre bucket or subgenre.
- `style`: stylistic subset that still behaves like a style node.
- `descriptor`: mood/use-case/editorial descriptor. Examples: `chillout`, `cafejazz`, `vocalchillout`.
- `form`: musical form. Example: `opera`.
- `instrument`: instrument-centric classification. Example: `piano`.
- `period`: era or historical period. Example: `baroque`.

Do not model all of these as interchangeable genres.

### Levels

The graph is a strict 3-level tree:

- `level: 1`: top-level atlas constellation.
- `level: 2`: child of a root.
- `level: 3`: child of a level-2 node.

If a concept does not fit cleanly into this tree, prefer using `styleRelations` or keeping it non-visible in atlas rather than forcing a bad parent.

### Atlas visibility

`isAtlasVisible` controls whether a taxon is intentionally shown in the graph.

Rules:

- Canonical taxonomy can be broader than the rendered atlas.
- If a node is visible, its ancestors are included automatically by [`atlas.ts`](/c:/work/my/music-galaxy/app/src/data/atlas.ts).
- Do not mark every taxonomy node visible by default.
- New roots should stay non-visible unless there is actual editorial/UI intent to expose them.

## Station Model

Stations are defined in `stationBindings` in [`taxonomy.ts`](/c:/work/my/music-galaxy/app/src/data/taxonomy.ts).

Each station has:

- `primaryStyleId`: the main style or genre used to classify the station.
- `secondaryStyleIds`: additional genre/style tags.
- `descriptorIds`: non-genre descriptors such as mood or presentation.

This split is intentional. Do not reintroduce a single `styleIds` field.

### Classification rules

Use this order when tagging a station:

1. Pick one `primaryStyleId` that best answers "what is this station mainly?"
2. Add `secondaryStyleIds` for adjacent genres/styles only.
3. Add `descriptorIds` for editorial descriptors only.

Examples:

- A station that is mostly downtempo with chill presentation:
  - `primaryStyleId: 'downtempo'`
  - `descriptorIds: ['chillout']`
- A station that is mainly progressive house:
  - `primaryStyleId: 'proghouse'`
  - `secondaryStyleIds: ['house', 'electronic']`
- A station that is smooth jazz in a cafe mood:
  - `primaryStyleId: 'smoothjazz'`
  - `descriptorIds: ['cafejazz']`

### What not to do

- Do not tag a station with both a generic root and an unrelated descriptor unless the genre mapping really needs it.
- Do not use `descriptorIds` for real genres.
- Do not use `secondaryStyleIds` for forms, instruments, or periods unless there is a clear product reason.
- Do not add duplicate semantic tags at multiple levels unless the UI/search behavior needs them.

## How To Add A New Style

1. Open [`taxonomy.ts`](/c:/work/my/music-galaxy/app/src/data/taxonomy.ts).
2. Decide whether the concept is a `genre`, `style`, `descriptor`, `form`, `instrument`, or `period`.
3. Pick the correct `root`.
4. Pick the correct `level` and `parentId`.
5. Add `isAtlasVisible: true` only if the node should be shown in the graph.
6. Add `styleRelations` if the node needs explicit `parent_of`, `related_to`, `influenced_by`, or `fusion_of` links.
7. If the style will be used by stations in the current UI, verify that it is atlas-visible or that at least its path to a visible ancestor is intentional.

Checklist for new styles:

- Parent is semantically correct.
- Kind is semantically correct.
- Root is semantically correct.
- Name is human-readable.
- ID is stable, lowercase, and ASCII.
- Visibility is intentional, not accidental.

## How To Add A New Station

1. Open [`taxonomy.ts`](/c:/work/my/music-galaxy/app/src/data/taxonomy.ts).
2. Add a new object to `stationBindings`.
3. Fill `id`, `name`, `streamUrl`, `countryLabel`, and `bitrateLabel`.
4. Pick `primaryStyleId`.
5. Add optional `secondaryStyleIds`.
6. Add optional `descriptorIds`.
7. Make sure every referenced id exists in `styleTaxonomy`.
8. Run a build.

Checklist for new stations:

- Stream URL is valid and expected to work in browser or through the proxy.
- Style ids exist.
- Primary style is specific enough.
- Descriptors are not used as primary genre unless product intent requires it.
- Country and bitrate labels are normalized.

## How Matching Works

Selectors live in [`selectors.ts`](/c:/work/my/music-galaxy/app/src/data/selectors.ts).

Current helpers:

- `stationMatchesNode(station, nodeId)`: returns `true` if the node matches station primary, secondary, or descriptor tags.
- `resolveStyleName(styleId)`: resolves a style id to the atlas-visible label when available.
- `getStationStyleLabels(station)`: returns user-facing labels for primary, related, and descriptor groups.

If matching logic changes, update selectors first and keep UI dumb.

## Derived Atlas Rules

[`atlas.ts`](/c:/work/my/music-galaxy/app/src/data/atlas.ts) is derived data. Treat it as a projection layer, not a source of truth.

Rules:

- Source of truth for taxonomy and stations is `taxonomy.ts`.
- Atlas includes only visible nodes plus their ancestors.
- UI should prefer selectors and atlas data, not hand-written taxonomy logic in `App.tsx`.

## Validation Workflow

After changing taxonomy or stations, run:

```powershell
cd app
npm run build
```

The build should pass. A Vite chunk-size warning currently exists and is not related to taxonomy changes.

## Editorial Guidance

The system is curated, not encyclopedic. That means:

- Coverage can be broader than the visible atlas.
- Visible nodes should have strong editorial value.
- Avoid adding weak, redundant, or novelty nodes just because a catalog elsewhere has them.
- Prefer semantic correctness over squeezing a concept into the existing tree.

## Common Mistakes

- Treating descriptors as genres.
- Putting a style under the wrong parent to satisfy the current graph shape.
- Marking new nodes visible without any content or editorial need.
- Adding stations with root-only tagging when a more specific style exists.
- Reintroducing a flat `styleIds` array in source data.

## If You Need To Expand The System

Preferred order:

1. Extend canonical taxonomy.
2. Add or fix relations.
3. Decide whether the new nodes belong in the visible atlas.
4. Attach stations.
5. Update selectors/UI only if behavior actually changes.
