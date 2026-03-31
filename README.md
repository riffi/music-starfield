# Music Starfield

`Music Starfield` is a curated atlas of music styles and internet radio stations. It is not a generic streaming directory. The project has two connected layers:

1. Canonical taxonomy in `app/src/data/taxonomy.ts`
2. Derived atlas projection for the UI in `app/src/data/atlas.ts`

The taxonomy is broader than the visible graph. The UI shows only an editorially selected subset plus the ancestors required to keep visible paths intact.

## Project Layout

- `app/src/data/taxonomy.ts`: source of truth for styles, relations, and stations
- `app/src/data/atlas.ts`: derived visible atlas nodes, links, and station projection
- `app/src/data/selectors.ts`: matching helpers and user-facing style labels
- `app/src/hooks/useAtlasGraph.ts`: graph layout, expansion rules, and node rendering
- `app/src/hooks/useRadioPlayer.ts`: playback logic and station streaming
- `app/src/components/*`: UI panels, header, player, tooltip
- `spec/ui-spec.yaml`: UI specification
- `spec/data-spec.yaml`: logical data specification

## Data Model

### Taxonomy roots

`TaxonomyRoot` is the high-level family for a style. Current roots are defined in `styleTaxonomy` and include visible roots such as `electronic`, `rock`, `jazz`, `classical`, and `instrumental`, plus broader non-visible families.

### Taxon kinds

Each taxonomy entry has a `kind`:

- `genre`
- `style`
- `descriptor`
- `form`
- `instrument`
- `period`

Do not treat these as interchangeable. For example, `vocalchillout` is a descriptor, not a genre.

### Canonical taxonomy levels

Canonical taxonomy currently uses:

- `level: 1` for roots
- `level: 2` for direct children of roots
- `level: 3` for deeper taxonomy nodes

This is source data only. The rendered atlas is a projection and may remap visible depth.

## Atlas Projection

`app/src/data/atlas.ts` is derived data. Do not edit atlas structure directly unless you are changing projection logic.

Current atlas rules:

- Atlas includes only `isAtlasVisible` nodes plus their ancestors.
- Atlas nodes can render at `level: 1 | 2 | 3 | 4`.
- `club` is a synthetic `level 2` cluster under `electronic`.
- `breakbeat` is a synthetic `level 2` cluster under `electronic`.
- `house` and `techno` render as `level 3` under `club`.
- House and techno substyles render as `level 4` under those `level 3` nodes.
- `breaks` and `drumandbass` render as `level 3` under `breakbeat`.
- `atmosphericbreaks` and `liquidfunk` render as `level 4` under those `level 3` nodes.
- `trance` stays canonical, but the visible trance branch is split into `upliftingtrance`, `classictrance`, and `goatrance`.
- `vocalchillout` is projected as `level 4` under `chillout`.

Important consequence:

- Canonical parentage and atlas parentage are not always identical.
- If you change matching or ancestry behavior, check both `atlas.ts` and `selectors.ts`.

## Stations

Stations live in `stationBindings` in `app/src/data/taxonomy.ts`.

Each station has:

- `primaryStyleId`
- optional `secondaryStyleIds`
- optional `descriptorIds`

Use them as follows:

- `primaryStyleId`: what the station mainly is
- `secondaryStyleIds`: adjacent genres or styles
- `descriptorIds`: editorial descriptors or mood tags

Examples from the current model:

- progressive house station:
  - `primaryStyleId: 'proghouse'`
  - `secondaryStyleIds: ['house', 'electronic']`
- vocal chillout station:
  - `primaryStyleId: 'downtempo'`
  - `descriptorIds: ['vocalchillout']`
- melodic techno station:
  - `primaryStyleId: 'melodictechno'`
  - `secondaryStyleIds: ['techno']`

Do not reintroduce a flat `styleIds` array.

## Matching And Labels

Selector logic lives in `app/src/data/selectors.ts`.

Current responsibilities:

- `stationMatchesNode(station, nodeId)`: checks whether a station belongs to a node through primary, secondary, or descriptor ancestry
- `pulseNodeIdsForPlayingStation(...)`: computes branch pulse state for the playing station
- `computeRadioFlowEdgeKeys(...)`: computes animated flow path in the graph
- `resolveStyleName(styleId)`: returns display label for atlas and taxonomy ids
- `getStationStyleLabels(station)`: returns user-facing station metadata labels

If you change atlas parent overrides, update selectors in the same change.

## Expansion Behavior

Graph behavior is implemented in `app/src/hooks/useAtlasGraph.ts`.

Current interaction rules:

- Expanding a node collapses sibling branches under the same parent.
- Opening a different `level 2` branch collapses previously opened `level 3` and `level 4` descendants from the old branch.
- Opening a different `level 3` branch collapses the previously open `level 4` branch under the same parent.
- Nodes with children show a subtle outer orbit as the expandability hint.

## How To Add A New Style

1. Edit `app/src/data/taxonomy.ts`.
2. Choose a stable lowercase ASCII `id`.
3. Set correct `root`, `kind`, `level`, and `parentId`.
4. Add `isAtlasVisible: true` only if the style should appear in the graph.
5. Add `styleRelations` when canonical relations need to stay explicit.
6. If atlas projection should differ from canonical parentage, update `app/src/data/atlas.ts` and `app/src/data/selectors.ts`.
7. Run the build.

Checklist:

- parent is semantically correct
- kind is semantically correct
- root is semantically correct
- visibility is intentional
- selector ancestry still works
- atlas projection still makes visual sense

## How To Add A New Station

1. Edit `stationBindings` in `app/src/data/taxonomy.ts`.
2. Add `id`, `name`, `streamUrl`, `countryLabel`, and `bitrateLabel`.
3. Set `primaryStyleId`.
4. Add optional `secondaryStyleIds`.
5. Add optional `descriptorIds`.
6. Verify all referenced style ids exist.
7. Run the build.

Checklist:

- stream URL is valid
- style ids exist
- primary style is specific enough
- descriptors are not misused as genres
- country and bitrate labels are normalized

## Validation

Run from the app directory:

```powershell
npm run build
```

The build should pass. A Vite chunk-size warning may still appear and is currently expected.

## Editorial Guidance

The atlas is curated, not encyclopedic.

- Prefer strong editorial nodes over exhaustive catalog coverage.
- Do not expose every taxonomy node in the graph.
- Prefer semantic correctness over forcing a node into a convenient branch.
- Use projection overrides only when they improve atlas readability without corrupting source taxonomy.

## Common Mistakes

- Treating descriptors as genres
- Editing `atlas.ts` as if it were source data
- Forgetting to update `selectors.ts` after atlas parent overrides
- Marking nodes atlas-visible without checking visual impact
- Adding stations with root-only tagging when a specific style exists
