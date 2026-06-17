# PI Planning Assistant User Manual

PI Planning Assistant is a desktop PI planning tool. It imports Jira Epics and their child Stories/Tasks through read-only Jira APIs, then lets users create local PI/Sprint plans, drag Stories into Sprints, monitor capacity and completion, and export CSV or HTML reports.

## 1. Core Principles

- Jira integration is read-only.
- The app does not write Sprint assignments, notes, estimates, status changes, or any other planning data back to Jira.
- The Jira Personal Access Token is stored only in the Jira config JSON file selected by the user.
- The Project file is a local planning JSON file. It stores Epic snapshots, Sprints, Story assignments, notes, and local planning state.
- The Jira config file and Project file are separate files. Do not upload either file to GitHub.

## 2. First-Time Workflow

Recommended starting flow:

1. Open the app.
2. Click `Create Project File` and choose where to save the project planning file.
3. In the Settings area, create or open a Jira config file.
4. Enter the Jira Host URL and Personal Access Token.
5. If your network requires a proxy, expand `Proxy Settings` and configure the proxy.
6. Click `Test` to verify the Jira connection.
7. Enter the Project Key and Epic Ticket Numbers.
8. Click `Import` to import Epics and Stories.
9. Create a PI or individual Sprints.
10. Drag Stories from the Backlog into Sprints.
11. Use autosave, CSV export, or HTML export to save or share the result.

## 3. Top File Buttons

### Create Project File

Creates the Project file for the current plan. After it is created, later planning changes are automatically saved to this JSON file.

Without a Project file, planning actions such as importing Epics, creating PI/Sprints, and dragging Stories are blocked. The app will ask you to create a Project file first.

### Open JSON

Opens an existing Project file and restores the saved planning state, including:

- Project Key
- Imported Epic and Story snapshots
- Sprint list
- Local Story-to-Sprint assignments
- Epic commitment
- Local notes

The Project file does not store the Jira PAT.

### Import CSV

Imports planning data from a CSV file. This is useful for restoring or migrating basic planning content.

### Export CSV

Exports the current local planning details. Each CSV row represents one Story/Task and includes Epic, Story, Sprint, capacity, note, and related planning fields.

The CSV export reflects only the local plan. It does not mean Jira has been updated.

### Export HTML

Exports a human-readable HTML report for review or sharing. The HTML report includes:

- Overall statistics
- Epic View: see which Sprint each Story is assigned to under each Epic
- Sprint View: see which Stories are in each Sprint and which Epic each Story belongs to
- Sprint Summary: capacity and over-capacity information
- Epic/Story Jira links
- Epic/Story local notes

If a Jira config file is selected, Epic keys and Story keys in the HTML report become Jira links.

## 4. Jira Settings

### Jira Host URL

Enter the Jira host, for example:

```text
https://devstack.vwgroup.com
```

The app builds Jira browse links in this format:

```text
https://devstack.vwgroup.com/jira/browse/PROJECT-12345
```

### Personal Access Token

Enter the Jira PAT. The PAT is stored only in the Jira config file and is never written to the Project file.

### Config File Buttons

- Folder button: open an existing Jira config file.
- `New`: choose a new Jira config file path.
- Save button: save the current Jira Host URL, PAT, and Proxy Settings.
- `Test`: test the Jira Host URL and PAT through the Jira `/myself` API.

### Proxy Settings

If your company network requires a proxy to access Jira:

1. Expand `Proxy Settings`.
2. Enable `Use proxy for Jira requests`.
3. Enter the Proxy URL, for example:

```text
http://proxy.company.com:8080
```

If the proxy requires a username and password:

```text
http://username:password@proxy.company.com:8080
```

Proxy settings affect only Jira requests. They do not affect the Project file, CSV export, HTML export, or GitHub.

## 5. Importing Epics And Stories

### Project Key

The Project Key only needs to be entered once, for example:

```text
E3AUDEDM
```

### Epic Ticket Numbers

You can enter one or more Epic ticket numbers. Spaces, commas, and semicolons are supported separators. Example:

```text
18519, 18520, 18521
```

You can also enter full issue keys:

```text
E3AUDEDM-18519
```

Or paste a Jira browse URL:

```text
https://devstack.vwgroup.com/jira/browse/E3AUDEDM-18519
```

### Import

After clicking `Import`, the app reads the following data from Jira:

- Epic information
- Story/Task items under the Epic
- Summary
- Status
- Story Points
- Description
- Numerical Priority / Priority Weight
- Epic commitment

Stories with status `closed` are not imported.

If Jira has an Epic commitment field, the app reads it and displays it as `committed`, `uncommitted`, or `unplanned`. If Jira has no value or the value cannot be recognized, the app uses `unplanned` by default.

### Refresh

The `Refresh` button in the import area refreshes all imported Epics and the Story lists under them, including newly added or removed Stories and updated Story details. Existing local Sprint assignments are preserved where possible.

Refresh buttons on individual Epic or Story cards refresh only that item.

## 6. Epic Backlog

The left `Epic Backlog` panel shows all imported Epics and Stories.

### Search Tickets

Under the Backlog title, you can search imported Epics or Stories by ticket number or full issue key. Examples:

```text
18539
E3AUDEDM-18539
```

When an Epic is found, the app scrolls to that Epic and briefly highlights it. When a Story is found, the app expands its parent Epic if needed, scrolls to the Story, and briefly highlights it. Search is local-only across imported Backlog content and does not call Jira.

### Epic Sorting

Epics are sorted by `Numerical Priority / Priority Weight` read from Jira. Priority Weight cannot be edited manually in the app.

### Epic Status Colors

- Green: all Stories under the Epic are planned.
- Red: a Committed Epic still has Stories in the Backlog.
- Gray: Uncommitted or Unplanned.

### Collapsing Epics

Each Epic has a collapse button on the left side. It collapses or expands the Story list under that Epic.

The small icon button in the Backlog title row collapses or expands all imported Epics at once.

### Removing An Epic

The delete button on an Epic card removes that Epic from the local plan. If Stories under that Epic were already planned in Sprints, those Story assignments are also removed from the Sprints.

This affects only the local plan. It does not delete any Jira issue.

### Description And Note

- Info icon: view the Jira description.
- Note icon: add or edit a local note.

Local notes are saved only in the Project file, CSV export, and HTML export. They are not written back to Jira.

### Open Jira

Double-click an Epic key or Story key to open the corresponding Jira page in your browser.

## 7. PI Sprints

The right `PI Sprints` area is the local Sprint planning board.

### Add One Sprint

Click `Sprint`:

- The default name is generated from existing Sprints.
- The first Sprint starts today by default.
- Later Sprints start on the day after the previous Sprint ends.
- The default end date is start date plus 13 days.
- Users can edit the Sprint name, dates, and capacity.

### Add A PI

Click `PI`:

- Enter the PI start date.
- Enter the Sprint count.
- The app creates the requested number of Sprints, with each Sprint lasting two weeks.
- After creation, users can still edit each Sprint name, dates, and capacity.

### Edit Capacity

Each Sprint has a Point Capacity input. The Sprint displays:

```text
used points / capacity points
```

If used points exceed capacity, the Sprint shows a warning.

### Delete A Sprint

After a Sprint is deleted, the Stories in that Sprint become unplanned again but remain visible in the Backlog.

## 8. Drag Planning Stories

### Drag From Backlog To Sprint

Drag a Story from the Backlog into a Sprint to plan that Story in the Sprint.

Unestimated Stories are highlighted and cannot be dragged into a Sprint.

### Planned Stories Stay In Backlog

After a Story is planned, it does not disappear from the Backlog. It remains under its Epic with a highlight, Sprint name, and `Planned` label.

### Move From One Sprint To Another

You can drag a Story directly from one Sprint to another Sprint.

You can also drag the same planned Story from the Backlog to another Sprint to reassign it.

### Move Story With Right-Click Menu

When there are many Sprints or long Story lists, right-click a plannable Story card, choose `Move to` in the native context menu, then choose the target Sprint.

The right-click menu works for Stories in both Backlog and Sprint. The Story's current Sprint is hidden from the target list. Unestimated or non-plannable Stories cannot be assigned to a Sprint from this menu.

### Remove A Story From Sprint

Each Story in a Sprint has a remove button. Clicking it removes the Story from the Sprint and returns it to unplanned status in the Backlog.

## 9. Quickly Locate A Story

When the same Story is visible in both Backlog and Sprint, you can quickly locate its matching card.

- Double-click the empty/body area of a planned Story card in Backlog: the matching Story card in the Sprint area scrolls into view and is briefly highlighted.
- Double-click the empty/body area of a Story card in Sprint: the matching Story card in Backlog scrolls into view and is briefly highlighted.
- If the target Epic is collapsed, the app automatically expands that Epic.

Note: double-clicking the Story key opens Jira and does not trigger quick location.

## 10. Autosave

After a Project file is created, the app automatically saves planning changes to that Project file.

The status bar may show:

- `Autosaving...`
- `Autosaved`
- `Autosave failed`

Autosave writes only the Project file. It does not write the Jira config and does not write anything back to Jira.

Green success notifications close automatically after a short time. Error notifications stay visible until the user closes them manually.

## 11. FAQ

### Why must I create a Project file before importing?

The Project file is where local planning results are saved. Creating it first helps prevent losing imported and planned work after an unexpected close or crash.

### Why does Test connection not need a Project Key?

Test connection only verifies whether the Jira Host URL and PAT are accessible. The Project Key is needed later when importing Epics.

### Will Refresh overwrite my local Sprint plan?

Refresh updates Epic/Story data from Jira and preserves local Sprint assignments and notes where possible. It does not sync local planning data back to Jira.

### Why were some Stories not imported?

Common reasons:

- The Story status is `closed`.
- The PAT does not have permission to access the issue.
- Jira field mapping or Epic child relationship cannot be read.
- Network, VPN, or proxy connection failed.

### Does HTML/CSV export mean Jira was updated?

No. Export files represent only the current local planning state.

### Can I share the Jira config file or Project file?

Project files may be shared according to your team rules, but they contain local planning data and notes. Jira config files contain PATs and should not be shared or uploaded.

### Do I need to save manually before closing the app?

If a Project file has been created, the app autosaves. It is still recommended to confirm that the status bar shows `Autosaved` before closing.

## 12. Security Reminders

- Do not commit Jira config files to GitHub.
- Do not commit Project files, CSV exports, or HTML reports to public repositories.
- Do not put PATs in README files, issues, pull requests, or chat messages.
- If you suspect a PAT was leaked, revoke it in Jira and generate a new one.
