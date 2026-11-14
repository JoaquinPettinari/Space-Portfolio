# Blender antenna-script crash

## Follow-up after authorization to resume

The corrected script was successfully executed on `bridge-antennas-validated.blend`
only. It now requires that isolated path and checks face indices before calling
Blender mesh creation. 44 objects / 5,058 triangles were added. The candidate was
saved and reopened successfully, then source validation passed (36 screen rays,
498 route samples, no duplicates). Six service window views passed during script
execution. The original bridge and its backup were not overwritten. This resolves
the runtime verification pending in the historical investigation below; no app
export or rendered visual review was performed.

No Blender/MCP execution was performed during this investigation.

The saved crash log records EXCEPTION_ACCESS_VIOLATION while building vertex-to-face
indices in `bmesh.from_mesh`, reached through `mesh`, `box`, and line 53 of the
antenna script (radome plinth). The injected box helper reads global `faces`.
The antenna script overwrote that global with the dome topology: indices up to
96 were then supplied for a box with only 8 vertices. This is a concrete script
defect consistent with the recorded native crash, not evidence of GPU exhaustion.

Correction: dome topology now uses `dome_faces`, preserving the box helper's
topology. Offline Node assertions reproduced the invalid index range and checked
the renamed variable and valid dome range. Python static checking was unavailable
because the Windows Store python.exe alias could not run. Blender validation is
deliberately pending. Do not automatically retry the live script.

Principal and existing backup both have SHA256
`61C01F550CF77E11418AC6726700DED46DE3BCD22101F6D467B6E8D8D6CE3695`,
5,990,919 bytes, timestamp 2026-11-14 09:24:47 as reported by the filesystem.
A separate `bridge-preserved.blend` copy and the crash log are preserved here.
Identical hashes do not establish full Blender file integrity; no file was opened
or rewritten. The existing backup was overwritten by the failed script's copy
step, so it is identical to the principal, not a separate earlier revision.

Windows Application event log access was denied; the Blender crash log provided
the actionable evidence. Next runtime verification should use a disposable copy
and avoid overwriting the principal or backup. It has not been performed.
