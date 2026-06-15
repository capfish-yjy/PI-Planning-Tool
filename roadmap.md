# PI Planning Assistant Roadmap

This document records candidate requirements for future versions. These items are intentionally outside the current v1 scope unless explicitly promoted into an implementation plan.

## Version Strategy

- **v1:** Read-only Jira integration and local PI planning.
- **v2:** Improve planning quality with automation, dependency checks, team capacity, and better reporting.
- **v3:** Consider Jira write-back, collaboration, and advanced intelligence after local workflows are stable.

## V2 Candidate Requirements

### Automatic Planning Suggestions

- Generate an initial sprint plan based on Epic priority, Story Points, and Sprint capacity.
- Keep generated plans editable by the user.
- Do not place unestimated stories into sprints.
- Start with simple rules: higher priority first, avoid capacity overflow, keep committed Epic stories planned within the PI.

### Dependency Management

- Display issue dependencies such as blocks / blocked by relationships.
- Warn when a dependent issue is scheduled before its prerequisite.
- Include dependency warnings in planning health checks and exports.

### Risk and ROAM Tracking

- Allow risks to be attached to Epics or Stories.
- Support ROAM states: Resolved, Owned, Accepted, Mitigated.
- Include risk information in exports and readiness summaries.

### Team Capacity

- Support planning across multiple teams.
- Allow stories to be assigned to a team and sprint.
- Track capacity at both sprint level and team-within-sprint level.
- Show warnings when a team exceeds capacity.

### Local Version History

- Keep local snapshots when plans are saved.
- Allow users to inspect changes between saved versions.
- Support rollback to a previous local plan version.

### Scenario / What-if Planning

- Allow multiple planning scenarios within the same PI.
- Compare scenarios by capacity usage, unplanned committed work, and overload warnings.
- Let the user choose a final scenario for export.

### Export Enhancements

- Export Excel workbooks in addition to CSV.
- Include separate sheets or files for story detail and sprint summary.
- Export Markdown or HTML planning reports for sharing with stakeholders.

### Filtering and Search

- Filter by Epic, Jira status, unestimated stories, unplanned stories, committed Epics, team, assignee, and sprint.
- Add keyword search across Epic and Story keys/summaries.
- Preserve filters while users adjust the plan.

### Planning Health Dashboard

- Show total PI capacity and used capacity.
- Show unestimated story count.
- Show unplanned committed story count.
- Show overloaded sprint count.
- Provide a readiness summary for PO review before export.

## V3 Candidate Requirements

### Jira Write-back

- Optionally sync selected local planning results back to Jira.
- Keep write-back disabled by default.
- Require a change preview and explicit confirmation before writing.
- Maintain an audit log of attempted Jira updates.
- Candidate write-back fields may include sprint assignment, planning labels, comments, or commitment metadata, depending on Jira configuration.

### Jira Agile Board Integration

- Read Jira boards and sprint metadata.
- Map local PI sprints to Jira sprints.
- Use board context to improve imports and future write-back.

### Multi-user Collaboration

- Support shared planning sessions or shared plan storage.
- Handle concurrent edits and conflict resolution.
- Defer until local planning and file formats are stable.

### AI-assisted Planning Review

- Identify planning risks such as overloaded sprints, large unestimated work, missing dependencies, or incomplete committed Epics.
- Suggest story movement options to reduce overload.
- Summarize PI readiness for PO review.

## Notes

- Jira write-back should not be added until the read-only workflow is stable and users can review exact changes before syncing.
- Future requirements should preserve v1's separation between Jira credentials and local plan files.
- Any Jira write operation must be introduced behind explicit user confirmation and tests that prove read-only flows remain read-only.
