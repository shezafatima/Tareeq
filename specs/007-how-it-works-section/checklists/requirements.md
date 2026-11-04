# Specification Quality Checklist: "How it works" Section With Card Hand-off and Carousel

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-11-04
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Owner-named items kept as constraints, not choices of mine: the image path `/how-it-works.png`, the content file `src/content/how-it-works.ts`, "no new colours / no new dependencies / no other animation library", and "server-rendered with client behaviour only where needed". The brief also names Framer Motion; the spec says "the animation library already in the project".
- Confirmed by the owner (clarify, question 1): this feature **replaces** feature 005's robot travel, pinned robot and coverflow, and their code is deleted.
- Confirmed by the owner (clarify, question 2): with reduced motion the carousel and flip keep their normal animation; only travel, auto-advance and breathing turn off. Without scripts all three cards show together.
- Confirmed by the owner (clarify, question 3): the carousel front shows step number, step name and a one-line explanation; the hero's sample line gives way to it as the card settles; the back shows the example.
- Confirmed by the owner (clarify, question 4): auto-advance pauses only while the pointer is over the card in focus (not the whole section) and while focus is inside the carousel; a touch swipe or tap stops it for the rest of the visit.
- One informed default still needs the owner's confirmation: between 768px and 1023px the cards do travel (the brief's "no travel" is below 768px).
- Placeholder wording (Build and Learn examples, intro line, image description) is marked DRAFT for owner review.
- To raise at /sp.plan: the hero impact statement (constitution Principle VIII) for the hand-off, the Lighthouse baseline to compare against (feature 005's), and whether the existing step content is reused or retired.
