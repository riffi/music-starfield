---
name: speccanvas
description: Work with Spec Canvas specifications from docs.speccanvas.dev and app.speccanvas.dev. Use when Codex needs to create, revise, audit, explain, or hand off a Spec Canvas UI Spec or Data Spec; turn a rough product idea into YAML; reconstruct a spec from code, screenshots, or notes; validate block, screen, entity, and relation consistency; or prepare reusable AI-ready specification files for repositories and implementation workflows.
---

# Speccanvas

Use this skill to produce and maintain Spec Canvas artifacts as portable YAML specs.

Treat the spec as the source of truth for structure and intent. Favor compact, reusable specs that can be pasted into Spec Canvas, an IDE, a terminal agent, or a repository without extra explanation.

## Default File Placement

Unless the user explicitly asks for a different location, create and update Spec Canvas files in the project root under `spec/`.

- UI Spec path: `spec/ui-spec.yaml`
- Data Spec path: `spec/data-spec.yaml`

If the `spec/` directory does not exist, create it. When only one artifact is requested, create only the relevant file.

## Workflow

1. Identify the artifact boundary.
Determine whether the task needs:
- UI Spec only
- Data Spec only
- both specs kept aligned
- explanation, review, or cleanup of an existing spec

2. Gather source material.
Use only the inputs that help define structure:
- product idea or feature request
- existing screenshots or UI descriptions
- codebase structure
- current YAML spec
- entity lists, API notes, or domain rules

3. Pick the right format reference.
- For screens, blocks, templates, navigation, responsive layout, and implementation handoff, read [references/ui-spec-format-0.0.3.yaml](./references/ui-spec-format-0.0.3.yaml).
- For entities, fields, enums, and relations, read [references/data-spec-format-0.0.1.yaml](./references/data-spec-format-0.0.1.yaml).
- For working rules and review heuristics, read [references/workflow.md](./references/workflow.md).

4. Draft or revise the spec.
Keep the document valid YAML and stay inside the documented fields. Do not invent custom top-level sections unless the format explicitly allows them.

When writing files into a repository, default to:
- `spec/ui-spec.yaml` for UI Spec
- `spec/data-spec.yaml` for Data Spec

5. Audit consistency before returning the result.
Check naming, references, scope, and whether the spec is useful for another agent without chat history.

## Core Rules

### Preserve intent over implementation

In UI Specs, `purpose` is the core field. Describe what a block shows, contains, and enables. Do not default to low-level implementation details unless the user explicitly wants implementation-ready precision.

Prefer:

```yaml
purpose: "Four metric cards showing total, completed, in progress, and overdue tasks."
```

Avoid defaulting to:

```yaml
type: grid
columns: 4
gap: 16px
```

Implementation detail is acceptable only when the user asks for tighter control or the spec is already at that precision level.

### Use progressive precision

Start with the minimum detail that makes the app structure clear, then deepen only the sections that need it.

- Use light detail for exploration.
- Add blocks, columns, templates, and navigation when structure becomes stable.
- Add exact visual or behavioral constraints only for implementation-ready handoff.

Do not over-specify every block if the user is still exploring.

### Keep UI and data aligned

When both specs exist:
- match naming between screens, entities, and actions
- ensure UI actions imply real entities or workflows
- ensure Data Spec relations support the UI structure
- flag gaps instead of silently inventing backend concepts

### Keep the format portable

Produce plain YAML files that can live in a repo and be reused by any agent. Do not make the spec depend on Spec Canvas UI state, hidden metadata, or chat-only assumptions.

## Task Patterns

### Create a new UI Spec

- Start with `docType`, `format_version`, and `metadata`.
- Add `screens` as soon as the main app shape is known.
- Add `blocks` when the user wants visible structure.
- Add `templates`, `navigation`, or responsive fields only when they materially help.
- Quote long or punctuation-heavy strings, especially `purpose`.

### Create a new Data Spec

- Describe the logical domain model, not the physical database.
- Add `enums` only when shared controlled vocabularies matter.
- Define `entities` with business-meaningful `fields`.
- Use `relations` for logical cross-entity structure.
- Avoid leaking implementation-only concerns like indexes, migrations, or ORM-specific syntax unless the user explicitly asks for them outside the spec.

### Review or repair an existing spec

Check for:
- invalid or unsupported fields
- missing required sections
- broken screen, template, or navigation references
- entity fields that imply relations not described globally
- vague `purpose` text that is too weak for AI handoff
- over-implementation where higher-level intent would be clearer

When repairing, preserve the original product intent and make the smallest correction that restores clarity.

### Reconstruct a spec from an existing app

- infer screens from visible workflows
- infer blocks from repeated regions and user tasks
- infer entities from domain nouns and state changes
- separate what is observed from what is guessed
- call out uncertainty explicitly when the source material is incomplete

## Output Expectations

When returning specs:
- provide valid YAML
- keep IDs in snake_case where the format expects them
- keep field names exactly as defined by the format
- keep text concise but descriptive
- mention assumptions when they materially affect structure

When returning a review instead of a rewritten file:
- list structural issues first
- then give concrete fixes
- then provide a corrected snippet or full spec if useful
