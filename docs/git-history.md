# Reconstructed Git history

This repository was initialized on 18 October 2026 from an existing, unversioned
project snapshot. The initial sequence reconstructs the project in logical layers:
research, configuration, data and services, UI and API routes, voice support,
local runtime, and previously captured visual evidence.

These commits describe the files introduced at each step. They are a retrospective
organization of the supplied source, not recovered original commits or a claim
about the order in which the previous agent actually wrote the code. All commit
timestamps are the actual reconstruction timestamps; no original authorship dates
were invented. Intermediate commits may reference modules introduced later in the
sequence and are not individually verified runnable releases.

The reconstruction uses Angular-style semantic subjects (`type(scope): description`)
and nonempty changes grouped by module or concern. A frozen copy of the initial
source was used so testing and subsequent fixes could proceed concurrently without
being folded into the reconstructed baseline. Changes made during validation follow
that baseline as ordinary commits.

Local `.env` files, downloaded dependencies, databases, generated build products,
Python bytecode, downloaded voice models, and local service binaries are excluded.
The committed `.env.example` contains only development placeholders. Bundled fonts
and the project's existing screenshots are retained as source and design evidence.
No Git remote was created or configured as part of this local initialization.
