# Vibe Coding Protocol & Agent Constraints

You are an expert, senior desktop application developer specializing in React, TypeScript, and Electron. We are "vibe coding" this project together. I will drive the product vision, user experience, and architecture; you will handle the syntax, implementation, and boilerplate. 

To ensure this project scales without tech debt, you must strictly adhere to the following rules:
1. Context Before Code: Match my existing naming conventions and architectural patterns.
2. Step-by-Step Execution: Do not attempt to build a massive feature all at once. Break complex requests down into small, logical steps. Ask for my approval after completing each step.
3. Radical Honesty: If my request is architecturally flawed or creates tech debt, tell me. Propose a better alternative.
4. Constraints First: Keep functions small. Do not install new third-party dependencies unless necessary.

---

### 🛠️ Tech Stack Requirement:
* **Framework:** Electron (Use `electron-vite` with React + TypeScript template)
* **Frontend:** React 18+ with TypeScript
* **Styling:** Tailwind CSS
* **Drag-and-Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
* **Icons:** `lucide-react`
* **State Management:** `zustand`
* **Network / CORS:** Since this is an Electron app, we will rely on Electron's native capabilities (either IPC or modifying webPreferences in the main process) to completely bypass browser CORS restrictions when fetching data from the self-hosted Jira API.

---

### 📄 PI Planning Assistant - Product Requirements Document (PRD)

#### 1. Project Overview
A portable desktop application for a Product Owner (PO) to plan a Program Increment (PI). The tool connects to a self-hosted Jira instance, imports Epics, distributes child user stories across PI sprints, monitors capacities, and tracks commitments.

#### 2. Jira Setup & Security (Global Settings)
* **Global Configuration:** A "Settings" screen where the user configures their Jira connection once.
* **Fields:** `Jira Host URL` (e.g., https://jira.yourcompany.com) and `Personal Access Token (PAT)`.
* **Storage:** Securely save these using Electron's local storage capabilities (e.g., `electron-store` or securely via IPC).

#### 3. Creating a Plan & Data Integration
* **New Plan Flow:** User enters a `Jira Project Key` and a list of `Epic Ticket Numbers`.
* **Test Connection:** Validate the globally saved Host URL and PAT against the Project Key before fetching.
* **Auto-fetching:** Automatically fetch the provided Epics and traverse the Jira hierarchy to import all child user stories/tasks.
* **Missing Estimates:** Highlight unestimated stories. They *cannot* be planned (moved to a sprint). Provide a "Reload/Refresh" button to fetch updated points.

#### 4. UI Layout & Views
* **Epic View (Left Panel - Backlog):** Lists imported Epics (sorted by a user-defined "Priority Weight") and shows child stories under each Epic.
* **Sprint View (Right Panel - Board):** Displays PI Sprints. User can dynamically add/edit/remove Sprints (requires `Start Date`, `End Date`, `Point Capacity`).
* **Interaction:** Drag-and-drop stories from the Epic View into Sprints, or back to the Epic View.

#### 5. Planning Logic & Capacity Management
* **Capacity Tracking:** Continuously calculate the sum of story points in each sprint.
* **Warnings:** Display a visual warning (red text/icon) on the sprint header if it exceeds capacity.
* **Distribution Rule:** High-priority Epic stories must be planned somewhere within the PI.

#### 6. Epic Status & Visual Indicators
* **Statuses:** `Committed` (Must plan all stories), `Uncommitted` (Optional), `Unplanned` (Default).
* **Visual Formatting:**
  * `Green`: "Committed" Epic where 100% of child stories are in sprints.
  * `Red`: "Committed" Epic with stories left in the backlog.
  * `Neutral (Gray)`: "Uncommitted" or "Unplanned" Epic.

#### 7. File Management & Exporting
* **Save/Open (Native OS Dialogs):** Use Electron's `dialog` API via IPC to open native OS file pickers. Save the current working session as a local `.json` file, and allow opening it later to resume.
* **Export:** Export the finalized plan into a CSV format to the user's local disk.

#### 8. Cross-platform Distribution - Phase 1
* **Packaging Tooling:** Add a desktop packaging workflow using `electron-builder` or an equivalent Electron packaging tool.
* **macOS Build:** Produce a macOS installable artifact, preferably `.dmg`, with a configured application name, bundle identifier, version, and app icon.
* **Windows Build:** Produce a Windows installable artifact, preferably `.exe` installer, with a configured application name, application ID, version, and app icon.
* **Architecture Support:** Support Apple Silicon macOS as the primary macOS target. Add Intel or universal macOS builds if needed by the user base.
* **Portable File Compatibility:** Plan `.json` files and Jira configuration files must remain portable across macOS and Windows. Do not store OS-specific absolute paths in plan files.
* **Credential Separation:** Shared plan files must not contain Jira PAT values. Each user should use their own local Jira configuration file.
* **Cross-platform Paths:** All file access must use Electron dialogs and Node path utilities such as `path.join` and `app.getPath(...)`; do not hard-code platform-specific paths.
* **CSV Compatibility:** CSV export should be readable by Excel on Windows and macOS. Prefer UTF-8 with BOM and Windows-compatible line endings (`\r\n`).
* **Release Smoke Test:** Before sharing a build, verify that the packaged macOS and Windows apps can launch, open/save a plan file, load a Jira configuration file, and export CSV.
* **Out of Scope for Phase 1:** Code signing, notarization, automatic updates, crash reporting, and enterprise deployment are deferred to later distribution phases.

---

### 🚀 First Step: Kickoff

Let's officially start building! Please execute the following steps one by one. **Do not move to the next step until I confirm the previous one is working.**

**Step 1: Scaffolding**
Give me the exact terminal command to create a new project using `electron-vite`. It must use the React and TypeScript template. 

**Step 2: Dependency Installation**
Once scaffolded, give me the exact commands to install:
1. Tailwind CSS (and its initialization commands for Vite)
2. `lucide-react`
3. `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`
4. `zustand`
5. `electron-store` (for saving Jira credentials locally)

**Step 3: The Architecture Proposal**
Before you write any UI code, print out a proposed file tree structure. Explain exactly how you will structure the IPC communication (Inter-Process Communication) between the React frontend and Electron main process for:
- Saving/Loading files (JSON and CSV)
- Bypassing CORS for Jira API requests

Please start with Step 1!
