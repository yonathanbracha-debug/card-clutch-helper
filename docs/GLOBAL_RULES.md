# GLOBAL RULES (MEMORY + NO-REGRESSION) — MUST FOLLOW

## 1) Treat the current app as a living product
You MUST preserve existing behavior and UI unless a change is explicitly requested in this prompt.

## 2) "No collateral edits" policy
- Do NOT refactor unrelated files.
- Do NOT rename components, routes, folders, or variables unless explicitly required.
- Do NOT change styling tokens, tailwind theme, or design system unless this prompt says so.
- Do NOT re-order navigation, remove sections, or rewrite copy unless requested.

## 3) Change scope discipline
- Every code change must be justified by a bullet in "Scope of this prompt".
- If a file is touched, it must be listed under "Files touched" with a one-line reason.
- If a file is not listed, it must NOT be modified.

## 4) Regression checklist (mandatory at end of work)
- Confirm: existing pages still render.
- Confirm: card vault selection still works.
- Confirm: recommendation flow still works.
- Confirm: admin pages still work (if present).
- Confirm: Amex annual fee bug fix remains fixed.
- Confirm: no card count changed unless explicitly requested.

## 5) Memory
- Assume all prior context remains true unless this prompt overrides it.
- Do NOT "start over" or rebuild the app.
- Do NOT replace the database schema with a new one; only additive migrations unless explicitly requested.

## 6) Implementation style
- Make the smallest possible diff to achieve the requested outcome.
- Prefer targeted edits over sweeping changes.
- Do not introduce new dependencies unless explicitly requested.

---

## Before editing:
A) Write "Scope of this prompt" (3–8 bullets).
B) Write "Files touched" list.
Then implement ONLY that scope.

## After editing:
C) Run the regression checklist above and report PASS/FAIL for each item.
