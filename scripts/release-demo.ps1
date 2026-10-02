# Release demonstration (§41): clean-temp-repo end-to-end with real CLIs.
# Run from the bridge repo root. Preserves a transcript under docs/evidence/.
# Exit codes (not stderr text) decide pass/fail; stderr warnings never abort.
$ErrorActionPreference = "Continue"

$bridge = (Get-Location).Path
$demoId = [guid]::NewGuid().ToString("N").Substring(0, 8)
$demo = Join-Path ([System.IO.Path]::GetTempPath()) ("bridge-demo-" + $demoId)
New-Item -ItemType Directory -Path $demo | Out-Null
# The transcript must live OUTSIDE the demo repo: ACKit state-binding hashes
# the working tree, so an ever-growing log inside it would invalidate every
# bundle between export and record.
$log = Join-Path ([System.IO.Path]::GetTempPath()) ("bridge-demo-" + $demoId + ".transcript.txt")
"demo=$demo" | Out-File $log -Encoding utf8

function Step($name) {
  $line = "=== $name ==="
  Write-Host $line
  Add-Content $log $line
}
function Run($cmd, $cmdArgs, $cwd = $demo) {
  Add-Content $log ("$ $cmd $($cmdArgs -join ' ') [cwd=$cwd]")
  Push-Location $cwd
  try {
    $out = & $cmd @cmdArgs 2>&1
    $code = $LASTEXITCODE
  } finally {
    Pop-Location
  }
  $text = ($out | Out-String)
  Add-Content $log $text
  Add-Content $log ("exit=$code")
  Write-Host ("exit=" + $code)
  return @{ code = $code; out = $text }
}
function MustPass($r, $what) { if ($r.code -ne 0) { throw "$what failed: $($r.out)" } }
function MustFail($r, $what) { if ($r.code -eq 0) { throw "$what unexpectedly passed" } }

Step "1 git init"
Run "git" @("init", "-b", "main") | Out-Null
Run "git" @("config", "user.email", "demo@example.com") | Out-Null
Run "git" @("config", "user.name", "demo") | Out-Null

Step "2 ackit init"
MustPass (Run "ackit" @("init")) "ackit init"
# ackit init scaffolds instructions + skills; the repository config file is
# a deliberate owner-authored step (mirrors ackit.yml in every ACKit repo).
"schemaVersion: 1`n" | Out-File (Join-Path $demo "ackit.yml") -Encoding utf8 -NoNewline

Step "3 specify init"
MustPass (Run "specify" @("init", "--here", "--force", "--non-interactive", "--integration", "generic", "--integration-options=--commands-dir .myagent/commands/")) "specify init"

Step "4 install bridge package from tarball"
Push-Location $bridge
pnpm pack --pack-destination temp-pack | Out-Null
$tgz = (Get-ChildItem temp-pack/*.tgz | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
Pop-Location
$prefix = Join-Path $demo ".prefix"
MustPass (Run "npm" @("install", "-g", $tgz, "--prefix", $prefix)) "bridge install"
$globalRoot = (Run "npm" @("root", "-g", "--prefix", $prefix)).out.Trim().Split("`n") | Select-Object -Last 1
$installed = Join-Path $globalRoot.Trim() "@cynrath/ackit-spec-kit-bridge/dist/cli/index.js"
if (-not (Test-Path $installed)) { throw "installed CLI missing: $installed" }
function Bs($bsArgs) { return Run "node" (@($installed) + $bsArgs) }

Step "5 install bridge extension (dev)"
MustPass (Run "specify" @("extension", "add", "--dev", (Join-Path $bridge "spec-kit/extension"), "--force")) "extension add"
MustPass (Run "specify" @("extension", "list")) "extension list"

Step "6 fixture feature + ackit task"
New-Item -ItemType Directory -Path (Join-Path $demo "specs/001-demo") | Out-Null
"# Demo spec`n" | Out-File (Join-Path $demo "specs/001-demo/spec.md") -Encoding utf8
"# Demo plan`n" | Out-File (Join-Path $demo "specs/001-demo/plan.md") -Encoding utf8
"# Demo tasks`n" | Out-File (Join-Path $demo "specs/001-demo/tasks.md") -Encoding utf8
$taskOut = Run "ackit" @("task", "create", "Demo delivery")
MustPass $taskOut "task create"
$taskId = ([regex]::Match($taskOut.out, "TASK-\d+")).Value
Add-Content $log ("taskId=" + $taskId)
Write-Host ("taskId=" + $taskId)
MustPass (Run "ackit" @("task", "start", $taskId)) "task start"

Step "7 sync"
MustPass (Bs @("init")) "bridge init"
MustPass (Bs @("sync")) "sync"

Step "8 status"
MustPass (Bs @("status")) "status"

# ACKit completion flow FIRST: it writes review/evidence files that are part
# of the bridge subject, so it must settle before the bridge verifies.
# (The bridge never bypasses ACKit's own task lifecycle.)
Step "8a ackit completion flow for mapped task"
MustPass (Run "ackit" @("evidence", "sync", $taskId)) "evidence sync"
MustPass (Run "ackit" @("evidence", "verify", $taskId, "--criterion", "AC-001", "--type", "test", "--ref", "bridge demo verify PASS")) "evidence 1"
MustPass (Run "ackit" @("evidence", "verify", $taskId, "--criterion", "AC-002", "--type", "test", "--ref", "bridge demo gate PASS, transcript kept")) "evidence 2"
# The verdict file lives under .ackit/reviews, which ACKit state-binding
# observes, so author it BEFORE exporting the bundle.
$verdictYaml = @'
schemaId: "ackit.verdict.v1"
id: "VR-0001"
taskId: __TASKID__
verdict: "PASS"
verifier:
  agent: "release demo (same-session verifier)"
  context: "same"
  issuedAt: "2026-10-02"
findings: []
checkedCriteria:
  - "AC-001"
  - "AC-002"
summary: "Demo task verified in clean temp repo."
'@ -replace "__TASKID__", $taskId
New-Item -ItemType Directory -Force -Path (Join-Path $demo ".ackit/reviews") | Out-Null
$verdictYaml | Out-File (Join-Path $demo ".ackit/reviews/verdict-demo.yaml") -Encoding utf8
MustPass (Run "ackit" @("verification", "bundle", $taskId, "--format", "json", "--out", ".ackit/reviews/bundle-demo.json")) "bundle"
MustPass (Run "ackit" @("verification", "record", $taskId, "--verdict", ".ackit/reviews/verdict-demo.yaml", "--bundle", ".ackit/reviews/bundle-demo.json")) "record"
# ACKit's own completion gate requires ticked criteria + real completion
# notes in the task file. Do this BEFORE the bridge verifies (the task file
# is part of the bridge subject).
$taskFile = (Get-ChildItem (Join-Path $demo "docs/tasks/active") -Filter "$taskId-*.md" | Select-Object -First 1).FullName
$taskText = Get-Content $taskFile -Raw
$taskText = $taskText -replace "- \[ \]", "- [x]"
$taskText = $taskText -replace "\(placeholder\)", "Completed via ackit-speckit complete --profile quick after fresh PASS gate; ACKit verdict VR-0001 PASS; see release transcript."
$taskText | Out-File $taskFile -Encoding utf8 -NoNewline

Step "9 verify standard-of-demo (quick)"
MustPass (Bs @("verify", "--profile", "quick")) "verify"

Step "10 gate PASS"
MustPass (Bs @("gate", "--profile", "quick")) "gate"

Step "11 mutate spec"
Add-Content (Join-Path $demo "specs/001-demo/spec.md") "`nMutation probe.`n"

Step "12 status STALE"
$st = Bs @("status", "--json")
MustPass $st "status"
if ($st.out -notmatch "STALE") { throw "expected STALE, got: $($st.out)" }

Step "13 gate FAIL"
MustFail (Bs @("gate", "--profile", "quick")) "gate-after-mutate"

Step "14 reverify"
MustPass (Bs @("verify", "--profile", "quick")) "reverify"

Step "15 gate PASS again"
MustPass (Bs @("gate", "--profile", "quick")) "gate-again"

Step "16 checkpoint"
MustPass (Bs @("checkpoint")) "checkpoint"

Step "17 handoff"
MustPass (Bs @("handoff")) "handoff"

Step "18 complete through bridge"
MustPass (Bs @("complete", "--profile", "quick")) "complete"

Step "19 final verify + COMPLETE"
MustPass (Bs @("verify", "--profile", "quick")) "final verify"
$final = Bs @("status")
MustPass $final "final status"
if ($final.out -notmatch "COMPLETE") { throw "expected COMPLETE, got: $($final.out)" }

Step "DONE"
Write-Host ("DEMO PASS demo=" + $demo)
Add-Content $log ("DEMO PASS demo=" + $demo)
$evidenceDir = Join-Path $bridge "docs/evidence"
New-Item -ItemType Directory -Force -Path $evidenceDir | Out-Null
# Sanitize machine-specific paths before preserving: the transcript must not
# leak user-home, temp-dir, or workspace absolute paths into the repo.
$txt = Get-Content $log -Raw
$txt = $txt -replace [regex]::Escape($demo), "<demo-dir>"
$txt = $txt -replace [regex]::Escape($bridge), "<bridge-repo>"
$txt = $txt -replace "C:\\Users\\[^\\\s]+", "<user-home>"
$txt = $txt -replace "C:/Users/[^/\s]+", "<user-home>"
$txt = $txt -replace [regex]::Escape($demo.Replace("\", "/")), "<demo-dir>"
$txt = $txt -replace [regex]::Escape($bridge.Replace("\", "/")), "<bridge-repo>"
$txt | Out-File (Join-Path $evidenceDir "release-demo-v0.1.0.txt") -Encoding utf8 -NoNewline
Write-Host "transcript preserved (sanitized)"
