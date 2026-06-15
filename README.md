# PI Planning Assistant

PI Planning Assistant is a desktop tool for local PI planning with read-only Jira import.

It can import Jira Epics and their child Stories/Tasks, arrange Stories into local PI sprints, monitor sprint capacity, track committed Epic completion, save/open local project JSON files, and export CSV or human-readable HTML reports.

## Jira Safety

- Jira integration is read-only.
- The app does not write sprint assignments, estimates, comments, status changes, or any other planning data back to Jira.
- Jira requests run in the Electron main process.
- The renderer does not receive the Jira PAT.
- Jira config files and project files are local user files and should not be committed to GitHub.

## Run From Release Builds

Download the correct file from GitHub Releases:

- macOS Apple Silicon: `PI Planning Assistant-0.1.0-arm64.dmg`
- macOS Intel: `PI Planning Assistant-0.1.0-x64.dmg`
- Windows x64: `PI Planning Assistant-0.1.0.exe`

The current builds are not code-signed or notarized. macOS Gatekeeper or Windows SmartScreen may ask for confirmation before opening the app.

## Run From Source

Requirements:

- Node.js 20 or newer
- npm

If you only run the downloaded release build, you do not need Node.js or npm. These requirements are only needed when running from source.

### Install Requirements On Windows

1. Open the Node.js website: <https://nodejs.org>
2. Download the Windows Installer for the LTS version.
3. Run the `.msi` installer and keep the default options.
4. Make sure Node.js is added to `PATH`.
5. Open a new PowerShell or Command Prompt and verify:

```powershell
node -v
npm -v
```

### Install Requirements On macOS With Homebrew

Install Node.js:

```bash
brew install node
```

Verify:

```bash
node -v
npm -v
```

### Install Requirements On macOS Without Homebrew

1. Open the Node.js website: <https://nodejs.org>
2. Download the macOS Installer for the LTS version.
3. Run the `.pkg` installer.
4. Open a new Terminal and verify:

```bash
node -v
npm -v
```

Install dependencies:

```bash
npm install
```

Run the desktop app in development mode:

```bash
npm run dev
```

Build the Electron app:

```bash
npm run build
```

## Package Release Builds

Generate app icons:

```bash
npm run generate:icons
```

Build macOS Apple Silicon DMG:

```bash
npm run dist:mac:arm64
```

Build macOS Intel DMG:

```bash
npm run dist:mac:x64
```

Build Windows x64 portable EXE:

```bash
npm run dist:win:portable
```

Build all targets:

```bash
npm run dist:all
```

Release artifacts are written to `release/`.

## Local Files

The app uses two kinds of local files:

- Jira config file: contains Jira host URL and PAT.
- Project file: contains local planning data, sprint assignments, notes, and imported Jira snapshots.

Do not commit Jira config files, project JSON files, CSV exports, HTML reports, or release binaries.
