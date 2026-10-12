# AI Usage Log

This document records how AI assistance was used during the Flowboard take-home implementation, what was changed after review, and which suggestions were intentionally rejected or deferred.

## How AI was used

AI assistance was used as an implementation and review partner for:

- Initial React/TypeScript project scaffolding and feature decomposition.
- Translating the assignment into a product plan and identifying core requirements, stretch goals, and test cases.
- Drafting typed models, fixture data, access rules, Zustand actions, and React feature components.
- Drafting Vitest tests for permissions, denied mutations, hierarchy CRUD, ordering, status integrity, and user switching.
- Reviewing UI screenshots for spacing, hierarchy, control placement, modal/drawer behavior, and responsive layout issues.
- Identifying non-functional controls and proposing removal or implementation.
- Drafting the README, architecture explanation, trade-offs, and deployment notes.
- Diagnosing and fixing the Tailwind/PostCSS circular `@apply` error introduced during the dark-mode experiment.

## Representative prompts and outcomes

### Architecture and implementation

Prompts included:

- “Let's build.”
- “You dumped so many components in App.tsx… create a components folder.”
- “What was the architecture decision you took?”
- “Can we add bulk update (multi-select → change status/assignee)?”
- “Let’s add Cmd-K keyboard shortcut for search.”

Outcome: the initial large page was split into layout, task feature, shared component, model, service, store, and test modules. The final `App.tsx` is a composition layer; domain actions and permission checks live in the store/service boundary.

### Interaction quality and UI review

Prompts included requests to address:

- Loading, empty, error, feedback, and drag-and-drop states.
- Standard icons, consistent spacing/padding, neat design, and better UX.
- A proper task drawer and confirmation modal behavior.
- Removing controls that did nothing, including unused help, filters, and overflow menus.
- Fixing chevron placement, description height, and responsive behavior.

Outcome: the UI gained loading and empty states, success/error toasts, modal/drawer Escape and overlay close behavior, focus states, insertion drop targets, bounded descriptions, responsive mobile navigation, stacked board columns, and horizontally scrollable dense tables. Placeholder controls were removed rather than left visible.

### Assignment scope and documentation

Prompts included questions about:

- Whether archive, failure simulation, sorting, virtualization, and other nice-to-have items were actually required.
- Whether seeded hierarchy data should match the breadcrumb hierarchy.
- Whether deployment to Vercel should be documented.
- Adding a favicon and using supplied Flowboard branding.

Outcome: the README explicitly maps implemented behavior to assignment areas and stretch goals, documents the Vercel static deployment, and identifies virtualization as a measured future optimization for large datasets.

## Corrections made after AI output or visual review

The following changes were made after reviewing the generated implementation against the assignment and screenshots:

1. **Component boundaries:** the first implementation placed too much UI in `App.tsx`; it was refactored into focused feature components.
2. **Control integrity:** visible controls that had no behavior were removed instead of being presented as unfinished functionality.
3. **Archive messaging:** archive confirmation was kept as a real modal and copy was clarified around soft-archive behavior.
4. **Workspace hierarchy:** the sidebar was corrected to reflect the actual seeded hierarchy and selected list path.
5. **Task creation:** priority, status, assignee, due date, and description were added to creation instead of forcing a second edit step.
6. **Filters/sorting:** the non-functional filter affordance was removed; list sorting by due date and priority was implemented.
7. **Drag and drop:** ambiguous column-level drops were replaced with visible insertion slots and persisted positions.
8. **Responsive layout:** the desktop-only shell was adapted with a mobile sidebar drawer, stacked board columns, responsive forms, and dense-table scrolling.
9. **Theme direction:** a dark mode experiment was removed after visual review showed poor mixed-surface contrast. The product now uses one consistent light-orange theme.
10. **Build correction:** a circular Tailwind `@apply` rule in the dark-mode experiment was replaced during diagnosis, then the entire unused dark-mode code was removed per product direction.

## Suggestions rejected or intentionally deferred

- **Virtualization by default:** deferred because the assignment fixture is small. It is documented as a next step after measuring real list sizes and preserving DnD/keyboard behavior.
- **A user-facing “simulate failures” toggle:** rejected as product UI because it is a demo/testing concern. Deterministic failure behavior remains in the store and tests.
- **A reset-demo-data control:** removed from the visible product surface to avoid exposing test tooling as normal workflow.
- **Placeholder filters and overflow menus:** removed until each action has a meaningful, reviewable behavior.
- **Dark mode:** removed after evaluating the visual result against the intended light-orange productivity theme.
- **Backend/authentication/deployment automation:** intentionally out of scope for this frontend-only assignment; the README documents the production follow-up path and Vercel deployment.

## Human review and final verification

AI suggestions were not accepted blindly. Product direction, visual feedback, architecture choices, scope decisions, and final wording were reviewed iteratively. The final implementation was checked with:

```bash
npm run test
npm run build
```

The current suite contains 13 passing tests, and the production TypeScript/Vite build passes.

