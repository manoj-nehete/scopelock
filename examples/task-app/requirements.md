# Task app example
- Constraint: Keep project data local.
# Phase P01: Task operations
## REQ-001: Add a task
- Acceptance: A non-empty task is added with its title.
## REQ-002: Reject empty tasks
- Acceptance: Empty task titles are rejected.
## REQ-003: Complete a task
- Depends: REQ-001
- Acceptance: Completing a task changes its completed flag.
# Phase P02: Persistence and usability
- Phase depends: P01
## REQ-004: Preserve tasks
- Depends: REQ-001
- Acceptance: Tasks survive a new application instance.
## REQ-005: Keyboard access
- Acceptance (manual): A human can create a task with keyboard-only controls.
