# Spec Canvas Workflow Notes

Source of truth:
- `https://docs.speccanvas.dev/`
- `https://docs.speccanvas.dev/how-it-works`
- `https://docs.speccanvas.dev/faq`
- `https://app.speccanvas.dev/formats/ui-spec-format-0-0-3.yaml`
- `https://app.speccanvas.dev/formats/data-spec-format-0-0-1.yaml`

## Key ideas

- Spec Canvas is a methodology and tool for turning a rough idea, an interface direction, or an existing app into a compact reusable specification.
- The spec is meant to be AI-readable and portable across chat, IDE, terminal agents, and repositories.
- A spec is different from a prompt: the prompt asks for output, while the spec preserves structure for repeated use.
- `purpose` is the central field in the UI format. It describes intent and behavior, not just presentation mechanics.
- Progressive precision is expected: start simple, then add structure and detail where needed.

## Practical rules

- Use UI Spec for screens, blocks, templates, navigation, layout intent, and responsive structure.
- Use Data Spec for business entities, enums, fields, and relations.
- Keep naming aligned between UI and data artifacts.
- Prefer logical descriptions over framework-specific implementation details.
- Store specs as plain YAML that another agent can read without extra context.
- Default repository placement is `spec/ui-spec.yaml` and `spec/data-spec.yaml` in the project root unless the user specifies another path.

## Review checklist

- Is the chosen spec type correct for the task?
- Are required fields present?
- Are IDs and references internally consistent?
- Does each screen or entity have enough descriptive intent to be reusable?
- Is the detail level appropriate for exploration vs handoff?
- Are unsupported custom fields avoided?
- If UI and data specs coexist, do they describe the same application model?
