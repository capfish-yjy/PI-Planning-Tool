# PI Planning Assistant

PI Planning Assistant is a desktop tool for local PI planning with read-only Jira import.

It can import Jira Epics and their child Stories/Tasks, arrange Stories into local PI sprints, monitor sprint capacity, track committed Epic completion, save/open local project JSON files, and export CSV or human-readable HTML reports.

For step-by-step usage instructions, see the [English User Manual](docs/USER_MANUAL_EN.md) or [中文用户手册](docs/USER_MANUAL.md).

## Jira Safety

- Jira integration is read-only.
- The app does not write sprint assignments, estimates, comments, status changes, or any other planning data back to Jira.
- Jira requests run in the Electron main process.
- The renderer does not receive the Jira PAT.
- Jira config files and project files are local user files and should not be committed to GitHub.

## Run From Release Builds

Download the correct file from GitHub Releases:

- macOS Apple Silicon: `PI Planning Assistant-0.2.0-arm64.dmg`
- macOS Intel: `PI Planning Assistant-0.2.0-x64.dmg`
- Windows x64: `PI Planning Assistant-0.2.0.exe`

The current builds are not code-signed or notarized. macOS Gatekeeper or Windows SmartScreen may ask for confirmation before opening the app.

## Run From Source

Requirements:

- Node.js 20 LTS or 22 LTS
- npm

If you only run the downloaded release build, you do not need Node.js or npm. These requirements are only needed when running from source.

Node.js 24 is not recommended for this project. It can leave Electron partially installed, for example with `node_modules/electron/dist/Electron.app` present but `node_modules/electron/path.txt` missing, which causes `npm run dev` to fail with `Error: Electron uninstall`.

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

Install dependencies.

This project includes `package-lock.json`, so use `npm ci` to install the exact dependency versions. The `--verbose` flag is optional, but useful when diagnosing network or proxy problems.

If your network does not require a proxy, run:

```bash
npm ci --verbose
```

Only configure proxy settings if your network requires them to access npm or Electron downloads.

### If Your Network Requires A Proxy

There are two download paths to configure:

- npm dependencies use npm proxy settings.
- Electron runtime and electron-builder downloads use Electron download proxy environment variables.

Windows Command Prompt:

```cmd
npm config set proxy http://your-company-proxy:8080
npm config set https-proxy http://your-company-proxy:8080

set ELECTRON_GET_USE_PROXY=1
set GLOBAL_AGENT_HTTP_PROXY=http://your-company-proxy:8080
set GLOBAL_AGENT_HTTPS_PROXY=http://your-company-proxy:8080

npm ci --verbose
```

macOS Terminal:

```bash
npm config set proxy http://your-company-proxy:8080
npm config set https-proxy http://your-company-proxy:8080

export ELECTRON_GET_USE_PROXY=1
export GLOBAL_AGENT_HTTP_PROXY=http://your-company-proxy:8080
export GLOBAL_AGENT_HTTPS_PROXY=http://your-company-proxy:8080

npm ci --verbose
```

If your proxy requires a username and password, use:

```text
http://username:password@your-company-proxy:8080
```

URL encode special characters in the username or password.

To clear proxy settings later, use:

Windows Command Prompt:

```cmd
npm config delete proxy
npm config delete https-proxy

set ELECTRON_GET_USE_PROXY=
set GLOBAL_AGENT_HTTP_PROXY=
set GLOBAL_AGENT_HTTPS_PROXY=
```

macOS Terminal:

```bash
npm config delete proxy
npm config delete https-proxy

unset ELECTRON_GET_USE_PROXY
unset GLOBAL_AGENT_HTTP_PROXY
unset GLOBAL_AGENT_HTTPS_PROXY
```

These command-line proxy settings are only for source install and build downloads. Jira runtime proxy is configured separately inside the app under Settings -> Proxy Settings.

Run the desktop app in development mode:

```bash
npm run dev
```

### Fix Electron Uninstall Errors

If `npm run dev` fails with `Error: Electron uninstall`, first verify your Node.js version:

```bash
node -v
npm -v
```

Use Node.js 20 LTS or 22 LTS, then reinstall dependencies:

```bash
rm -rf node_modules
npm ci --verbose
npm run dev
```

If you use `nvm` on macOS:

```bash
nvm install 22
nvm use 22
rm -rf node_modules
npm ci --verbose
npm run dev
```

You can also check whether Electron generated its executable path file:

```bash
cat node_modules/electron/path.txt
```

On macOS, it should print:

```text
Electron.app/Contents/MacOS/Electron
```

If `Electron.app` exists but `path.txt` is missing, switching to Node.js 20 LTS or 22 LTS and reinstalling with `npm ci --verbose` is the recommended fix.

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
