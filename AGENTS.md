# BancyCraft development

- This is a standalone desktop project, separate from the Bancy.gg website repository.
- Match the approved screen concept in `docs/approved-concept.png`: near-black teal, cyan accents, restrained fantasy artwork and a practical desktop layout.
- Core local features must work without login, Internet or Blackbox.
- Optional Bancy.gg features require a real browser-based authorization flow and backend permission checks. Opening the website is not successful app authentication. Never fake a connected state.
- Keep new paid services out of the architecture unless the user explicitly changes the no-paid-services requirement.
- Save parser work is a separate milestone: use copies, never modify game saves, and prove chest identity across snapshots before displaying live claims.
- Preserve `gg.bancy.bancycraft` and `%APPDATA%/BancyCraft` across releases. Keep data outside the install directory. Back up and test migrations.
- Show unimplemented features as upcoming. Never populate realistic-looking recipe data or server totals without verification.
- Test meaningful persistence, IPC and update behavior. Perform a visual check after interface changes.
- Bump the version and changelog for subsequent user-delivered releases. Build `npm.cmd run dist` and provide the installer, not just source files.
- Do not publish releases, modify Bancy.gg, add cloud services or change Blackbox just to complete local shell work.
