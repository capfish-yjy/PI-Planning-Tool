# PI Planning Assistant 用户手册

PI Planning Assistant 是一个桌面端 PI Planning 工具。它从 Jira 只读导入 Epic 以及 Epic 下的 Story/Task，然后让用户在本地创建 PI/Sprint、拖拽 Story 做排期、查看容量和完成度，并导出 CSV 或 HTML 报告。

## 1. 重要原则

- Jira 集成是只读的。
- 软件不会把 Sprint 分配、备注、估算、状态或任何计划结果写回 Jira。
- Jira Personal Access Token 只保存在用户选择的 Jira config JSON 文件中。
- Project file 是本地计划 JSON 文件，用来保存 Epic 快照、Sprint、Story 分配、备注和本地计划状态。
- Jira config file 和 Project file 是两个不同文件，不要把它们上传到 GitHub。

## 2. 第一次使用流程

推荐按这个顺序开始：

1. 打开软件。
2. 点击 `New Project`，选择一个位置创建新的空白项目计划文件。
3. 在 Settings 区域创建或打开 Jira config file。
4. 输入 Jira Host URL 和 Personal Access Token。
5. 如网络需要代理，展开 `Proxy Settings` 并配置 proxy。
6. 点击 `Test` 测试 Jira 连接。
7. 输入 Project Key 和 Epic Ticket Numbers。
8. 点击 `Import` 导入 Epic 和 Story。
9. 创建 PI 或 Sprint。
10. 从 Backlog 拖拽 Story 到 Sprint。
11. 使用自动保存、CSV 导出或 HTML 导出保存/分享结果。

## 3. 顶部文件按钮

### New Project

创建一个新的空白 Project file。创建后，后续计划变更会自动保存到这个 JSON 文件。

如果当前已经有计划内容并且已经有 Project file，软件会先尝试保存当前 Project，然后再创建新的空白项目。

如果当前 Project 保存失败，软件会提示继续创建新项目可能导致最近修改没有保存。如果当前计划还没有 Project file，软件会提示创建新项目将丢弃当前计划。

确认后选择保存位置并创建新项目；如果取消确认或取消保存对话框，当前计划不会改变。

在没有 Project file 时，Import Epic、创建 PI/Sprint、拖拽 Story 等规划操作会被阻止，并提示先创建或打开 Project。

### Open Project

打开已有 Project JSON 文件，并恢复之前保存的计划状态，包括：

- Project Key
- 已导入 Epic 和 Story 快照
- Sprint 列表
- Story 到 Sprint 的本地分配
- Epic commitment
- 本地备注

Project file 不保存 Jira PAT。

### Import CSV

从 CSV 文件导入计划数据。适合恢复或迁移基础计划内容。

### Export CSV

导出当前本地计划明细。CSV 每行对应一个 Story/Task，包含 Epic、Story、Sprint、容量、备注等信息。

CSV 导出只反映本地规划结果，不代表 Jira 已更新。

### Export HTML

导出更适合阅读和分享的 HTML 报告。HTML 报告包含：

- 总体统计
- Epic View：按 Epic 查看 Story 分配到哪个 Sprint
- Sprint View：按 Sprint 查看包含哪些 Story，以及 Story 属于哪个 Epic
- Sprint Summary：容量和超载信息
- Epic/Story Jira 链接
- Epic/Story 本地备注

如果已选择 Jira config，HTML 中的 Epic key 和 Story key 会生成 Jira 链接。

## 4. Jira 设置

### Jira Host URL

填写 Jira host，例如：

```text
https://devstack.vwgroup.com
```

软件会自动使用类似下面的 Jira browse 链接格式：

```text
https://devstack.vwgroup.com/jira/browse/PROJECT-12345
```

### Personal Access Token

填写 Jira PAT。PAT 只保存在 Jira config file 中，不会写入 Project file。

### Config File 按钮

- 文件夹按钮：打开已有 Jira config file。
- `New`：选择一个新的 Jira config file 路径。
- 保存按钮：保存当前 Jira Host URL、PAT 和 Proxy Settings。
- `Test`：通过 Jira `/myself` API 测试 Host URL 和 PAT 是否可用。

### Proxy Settings

如果公司网络访问 Jira 需要 proxy：

1. 展开 `Proxy Settings`。
2. 勾选 `Use proxy for Jira requests`。
3. 输入 Proxy URL，例如：

```text
http://proxy.company.com:8080
```

如果 proxy 需要用户名密码：

```text
http://username:password@proxy.company.com:8080
```

Proxy 设置只影响 Jira 请求，不影响 Project file、CSV、HTML 或 GitHub。

## 5. 导入 Epic 和 Story

### Project Key

Project Key 只需要输入一次，例如：

```text
E3AUDEDM
```

### Epic Ticket Numbers

可以输入一个或多个 Epic ticket number，支持空格、逗号、分号分隔。例如：

```text
18519, 18520, 18521
```

也可以输入完整 issue key：

```text
E3AUDEDM-18519
```

或者粘贴 Jira browse URL：

```text
https://devstack.vwgroup.com/jira/browse/E3AUDEDM-18519
```

### Import

点击 `Import` 后，软件会从 Jira 只读导入：

- Epic 信息
- Epic 下的 Story/Task
- Summary
- Status
- Story Points
- Description
- Numerical Priority / Priority Weight
- Epic commitment

状态为 `closed` 的 Story 不会被导入。

如果 Jira 中存在 Epic commitment 字段，软件会读取并显示为 `committed`、`uncommitted` 或 `unplanned`。如果 Jira 中没有该值或无法识别，默认使用 `unplanned`。

### Refresh

顶部 Import 区域的 `Refresh` 会刷新所有已导入 Epic 以及 Epic 下的 Story 列表，包括新增或删除的 Story 和 Story 详情。已有本地 Sprint 分配会尽量保留。

Epic 或 Story 卡片上的 refresh 按钮只刷新对应对象。

## 6. Epic Backlog

左侧 `Epic Backlog` 显示所有已导入 Epic 和 Story。

### 搜索 Ticket

Backlog 标题下方可以输入 ticket number 或完整 issue key 搜索已导入的 Epic 或 Story。例如：

```text
18539
E3AUDEDM-18539
```

搜索到 Epic 时，软件会滚动到对应 Epic 并短暂高亮。搜索到 Story 时，软件会自动展开所属 Epic，滚动到对应 Story 并短暂高亮。搜索只在已导入的 Backlog 内容中查找，不会调用 Jira。

### Epic 排序

Epic 按 Jira 中读取到的 `Numerical Priority / Priority Weight` 排序。Priority Weight 不能在软件中手动修改。

### Epic 状态颜色

- 绿色：Epic 下所有 Story 都已 planned。
- 红色：Committed Epic 仍有 Story 在 Backlog。
- 灰色：Uncommitted 或 Unplanned。

### 折叠 Epic

每个 Epic 左侧有折叠按钮，可以单独折叠/展开 Epic 下的 Story。

Backlog 标题行右侧有一个小图标按钮，可以一键折叠或展开所有 Epic。

### 删除 Epic

Epic 卡片上的删除按钮会从本地计划中移除该 Epic。移除 Epic 后，该 Epic 下已经 planned 的 Story 也会从 Sprint 中移除。

这个操作只影响本地计划，不会删除 Jira issue。

### Description 和 Note

- Info 图标：查看 Jira description。
- Note 图标：添加或编辑本地备注。

本地备注只保存在 Project file、CSV 和 HTML 导出中，不会写回 Jira。

### 打开 Jira

双击 Epic key 或 Story key 可以在浏览器中打开对应 Jira 页面。

## 7. PI Sprints

右侧 `PI Sprints` 是本地 Sprint 排期区域。

### 添加单个 Sprint

点击 `Sprint`：

- 默认名称会按现有 Sprint 自动生成。
- 第一个 Sprint 默认开始日期为今天。
- 后续 Sprint 默认开始日期为上一个 Sprint 结束日期的第二天。
- 默认结束日期为开始日期加 13 天。
- 用户可以修改 Sprint name、日期和 capacity。

### 添加 PI

点击 `PI`：

- 输入 PI start date。
- 输入 Sprint 数量。
- 软件按两周一个 Sprint 创建对应数量的 Sprint。
- 创建后用户仍可以修改每个 Sprint 的 name、日期和 capacity。

### 修改 Capacity

每个 Sprint 中可以直接输入 Point Capacity。Sprint 会显示：

```text
used points / capacity points
```

如果 used points 超过 capacity，会显示 warning。

### 删除 Sprint

删除 Sprint 后，该 Sprint 中的 Story 会回到未 planned 状态，但仍保留在 Backlog 中。

## 8. 拖拽规划 Story

### 从 Backlog 拖到 Sprint

将 Story 从 Backlog 拖到某个 Sprint，即可把 Story planned 到该 Sprint。

未估算 Story 会高亮，并禁止拖入 Sprint。

### Planned Story 仍留在 Backlog

Story planned 后不会从 Backlog 消失。它会继续显示在 Epic 下，并通过高亮、Sprint 名称和 `Planned` 标签表示已经计划。

### 从 Sprint 移到另一个 Sprint

可以直接把 Sprint 中的 Story 拖到另一个 Sprint。

也可以从 Backlog 中同一个 planned Story 拖到另一个 Sprint 重新分配。

### 通过右键菜单移动 Story

当 Sprint 很多或列表很长、不方便拖拽时，可以右键点击可规划的 Story 卡片，在原生菜单中选择 `Move to`，然后选择目标 Sprint。

右键菜单适用于 Backlog 和 Sprint 中的 Story。当前所在 Sprint 不会出现在目标列表中。未估算、不可规划的 Story 不能通过右键菜单分配到 Sprint。

### 从 Sprint 移除 Story

Sprint 中每个 Story 有移除按钮。点击后，该 Story 会从 Sprint 中移除，并在 Backlog 中恢复为 unplanned。

## 9. 快速定位 Story

如果同一个 Story 同时显示在 Backlog 和 Sprint 中，可以使用双击快速定位。

- 在 Backlog 中双击 planned Story 卡片空白区域：右侧 Sprint 中对应 Story 会滚动到可见区域并短暂高亮。
- 在 Sprint 中双击 Story 卡片空白区域：左侧 Backlog 中对应 Story 会滚动到可见区域并短暂高亮。
- 如果目标 Epic 是折叠的，软件会自动展开该 Epic。

注意：双击 Story key 会打开 Jira，不会触发快速定位。

## 10. 自动保存

创建 Project file 后，计划软件会自动保存到当前 Project file。

通常不需要手动 Save。创建或打开 Project 后，计划修改会自动保存到当前 Project file。点击 `New Project` 时，软件也会先尝试保存当前 Project。

状态栏会显示：

- `Autosaving...`
- `Autosaved`
- `Autosave failed`

自动保存只写 Project file，不写 Jira config，也不写回 Jira。

成功操作的绿色通知会在短时间后自动关闭；错误通知会保留在界面上，直到用户手动关闭。

## 11. 常见问题

### 为什么 Import 前必须创建 Project file？

Project file 是本地规划结果的保存位置。先创建 Project file 可以避免用户导入和排期后因为意外关闭软件而丢失计划。

### Test connection 为什么不需要 Project Key？

Test connection 只验证 Jira Host URL 和 PAT 是否可访问。导入 Epic 时才需要 Project Key。

### Refresh 会不会覆盖我本地排好的 Sprint？

Refresh 会从 Jira 更新 Epic/Story 信息，并尽量保留本地 Sprint 分配和备注。它不会把本地规划同步到 Jira。

### 为什么某些 Story 没有被导入？

常见原因：

- Story 状态是 `closed`。
- 当前 PAT 没有权限访问该 issue。
- Jira 字段映射或 Epic 子项关系无法读取。
- 网络、VPN 或 proxy 连接失败。

### HTML/CSV 导出是否代表 Jira 已更新？

不是。导出文件只代表当前本地计划状态。

### 我可以把 Jira config 或 Project file 发给别人吗？

Project file 可以按团队规则分享，但其中包含本地计划和备注。Jira config file 包含 PAT，不应该分享或上传。

### 关闭软件前需要手动保存吗？

如果已经创建 Project file，计划软件会自动保存。仍建议在关闭前确认状态栏显示 `Autosaved`。

## 12. 安全提醒

- 不要把 Jira config file 提交到 GitHub。
- 不要把 Project file、CSV、HTML 报告提交到公共仓库。
- 不要把 PAT 写进 README、issue、PR 或聊天记录。
- 如果怀疑 PAT 泄露，应立即在 Jira 中撤销并重新生成。
