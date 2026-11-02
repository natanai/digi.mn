# digi.mn agent instructions

## Engine ancestry and ownership

**pre-programmed is the upstream engine; digi.mn is its game-specific extension.**
Do not treat the first copied snapshot as a permanent fork that can freely diverge.

- Shared narrative, Author UX, state, media, input, persistence, and general-purpose engine systems originate in [natanai/pre-programmed](https://github.com/natanai/pre-programmed).
- Game-specific spatial renderer, district mapping, story/bounty composition, Sapotama reveal, Digimon artwork and game presentation belong in digi.mn.
- Use [docs/game-design.md](docs/game-design.md) as the one canonical game design brief. The pre-programmed Author UX task lookup remains canonical in the **upstream** repository; do not make a parallel audit under digi.mn.
- Read [docs/source-snapshot.txt](docs/source-snapshot.txt) for the original import commit and last **integrated** upstream commit. A higher available upstream SHA does not imply it has been integrated here.
- Before touching core/shared engine behavior, inspect upstream changes and consider whether the general improvement belongs in pre-programmed first.
- Prefer adding feature-owned modules and narrow composition hooks over modifying large upstream-owned files. If an upstream core file needs a digi.mn hook, keep it small, localized, and demonstrably necessary.
- Never re-run a broad rsync/copy of pre-programmed over this repository, never discard digi.mn changes on conflict, and never claim upstream parity while integration is pending.

## Updating shared engine code

The GitHub Action [Review pre-programmed upstream](.github/workflows/upstream-engine.yml) checks weekly and on request. It runs [scripts/upstream/sync-pre-programmed.sh](scripts/upstream/sync-pre-programmed.sh), which applies changes since the last integrated upstream commit with a **three-way patch**, excluding upstream-only audits/docs/README/workflows.

1. Review the upstream diff from the pinned SHA to upstream `main`.
2. Propose sync changes in a distinct branch/PR; do not push automatic upstream merges directly to `main`.
3. If a conflict occurs, stop and resolve it deliberately: preserve digi.mn behavior while incorporating the upstream engine change.
4. Run `npm run verify` and `npm run verify:local`; the latter verifies actual Worker/SQLite persistence. Run relevant feature-specific tests.
5. Only advance `last_integrated_commit` *with* the reconciled, tested changes, and only treat the update as integrated after its PR is merged.
6. If GitHub Actions cannot create a PR due to repository permissions, its verified sync branch and fallback tracking issue still require review.

## Gameplay contracts

- Spatial interactions must invoke existing Narrative interactions/conditions/outcomes/AFTER transitions. No duplicate dialogue or navigation engine.
- Every generated bounty must have a reachable nonviolent resolution. A case can resolve without a payout. Do not relabel such endings failures.
- Generated geography and story beats must be deterministic and separately testable.
- Preserve authored Digimon designs; do not procedurally synthesize replacement character artwork.
- Avoid expanding companion autonomy or combat complexity ahead of the first end-to-end bounty slice.

When updating tests or source, state explicitly what is implemented versus still planned. Builds passing do not by themselves establish a playable complete Cleaner mission.
