# TokenHubTop 视频生成配置指南

本 Skill 依赖以下运行条件：

1. **Node.js runtime**：运行 `scripts/video-generator.mjs` 和 `scripts/check-environment.mjs`，要求 Node.js 22 或更高版本。
2. **TokenHubTop 视频服务**：提交视频任务、查询状态并获取成片。需要用户自己的 `TOKENHUBTOP_API_KEY`。

## 1. Node.js 运行环境

- 官方网站：<https://nodejs.org/>
- 下载页面：<https://nodejs.org/en/download>
- 验证命令：

```bash
node --version
```

版本应为 `v22.x` 或更高。版本过低或缺失时，安装或切换到满足要求的版本后重新执行。脚本只使用 Node.js 标准库，不需要 `npm install`，不会安装第三方依赖，也不会写入凭据。

## 2. 获取 API Key

1. 打开 TokenHubTop 官网并注册或登录：<https://tokenhubtop.com/>
2. 进入控制台，在 API Key / API 密钥相关页面创建一个 Key。以后台实际页面名称为准。
3. 确认账号有可用的视频模型和足够额度。
4. 不要把完整 Key 发到聊天、群聊、工单、公开仓库或截图里。

TokenHubTop 控制台是密钥状态、权限、额度和撤销操作的权威来源。平台价格、模型权限和可用额度以控制台及接口返回为准。

## 3. 安全配置 TOKENHUBTOP_API_KEY

推荐只在当前终端会话临时设置环境变量，不写入项目文件、`.env`、Git 仓库或任务记录。

### Windows PowerShell

在需要运行视频生成命令的同一个 PowerShell 会话中执行：

```powershell
$secureKey = Read-Host "请输入 TOKENHUBTOP_API_KEY（输入时不会显示）" -AsSecureString
$env:TOKENHUBTOP_API_KEY = [System.Net.NetworkCredential]::new('', $secureKey).Password
Remove-Variable secureKey
```

### macOS / Linux

```bash
read -r -s TOKENHUBTOP_API_KEY
export TOKENHUBTOP_API_KEY
printf '\n'
```

### 智能体或自动化环境

应由宿主产品提供的密钥管理器或受控环境变量注入。不要要求用户把完整 Key 粘贴到公开对话；不要让 Key 出现在命令历史、日志、崩溃报告或生成任务记录中。

## 4. 首次使用前环境检查

在技能目录执行：

```bash
node scripts/check-environment.mjs
node scripts/check-environment.mjs --network
```

返回状态：

- `ready`：Node.js 版本和（启用 `--network` 时）网络连接满足要求。
- `needs_setup`：Node.js 低于 22 或环境缺少必要运行条件。
- `unavailable`：无法访问 TokenHubTop，生成类功能停止，稍后重试。

`--network` 只使用匿名请求检查 TokenHubTop 是否可达，不读取、不发送 API Key，也不提交视频任务。

## 5. 验证 Key 是否可用

本 Skill 没有单独的付费或免费“测试生成”命令，也不应为了测试 Key 而提交收费任务。

- 已有任务记录时，可执行 `sync` 做只读查询。查询成功返回任务 JSON，说明 Key 至少具备相应读取权限。
- 返回 HTTP 401 或 403 时，Key 可能缺失、无效、已撤销或权限不足，应到 TokenHubTop 控制台检查。
- 返回额度、模型权限或参数错误时，按平台错误信息处理，不要自动创建新任务重试。
- 环境检查不会代替 Key 验证。

## 6. 模型名说明

`project.json` 中的 `model` 必须是用户账号明确可用的模型名称。不要依赖隐藏默认模型，不要把官网文档或示例中出现过的模型当成当前账号一定可用。

如果用户没有指定模型：

1. 请用户从 TokenHubTop 控制台或可用模型清单中确认。
2. 确认后再写入 `project.json`。
3. 先运行离线 `plan`，确认接口映射。

## 7. Key 失效、权限不足或额度耗尽

1. 重新登录 TokenHubTop 控制台，确认账号状态、可用模型和余额。
2. 检查 API Key 是否被禁用、删除或限制权限。
3. 仍不可用时，撤销旧 Key 并创建新 Key，再在运行环境更新 `TOKENHUBTOP_API_KEY`。
4. 不把旧 Key 或新 Key 写入仓库、项目文件、日志或对话。

## 8. 轮换与撤销

- **轮换**：在控制台创建新 Key，更新当前运行环境中的 `TOKENHUBTOP_API_KEY`，确认新 Key 可用后再撤销旧 Key。
- **撤销**：在控制台删除或禁用对应 Key；撤销后相关调用应被平台拒绝。
- **怀疑泄漏**：第一时间在控制台撤销，检查使用记录，并更换新 Key。

## 9. 常见问题

| 现象 | 处理 |
|---|---|
| `node` 不存在 | 安装 Node.js 22+，重新打开终端后验证 |
| Node.js 版本低于 22 | 升级或切换版本，不要使用旧版本强行运行 |
| `Configure TOKENHUBTOP_API_KEY` | 当前运行环境没有设置变量；按本指南在同一会话配置 |
| HTTP 401 / 403 | Key 无效、撤销、权限不足或账号状态异常 |
| 无法访问 TokenHubTop | 检查网络、代理、防火墙和平台状态，停止生成后重试 |
| 找不到模型 | 从账号可用模型清单确认，不猜测或自动替换 |
| 素材地址被拒绝 | 改用公网 HTTP(S) URL 或用户已有的有效 `asset://` 引用 |

## 10. 核验信息

- 服务 BaseURL：`https://tokenhubtop.com`
- 创建任务：`POST /v1/video/generations`
- 查询任务：`GET /v1/video/generations/{task_id}`
- 鉴权：`Authorization: Bearer <TOKENHUBTOP_API_KEY>`
- 接口字段：[视频接口参考](video-api.md)
- 本指南核验日期：2026-09-23

## 版权

Copyright © 2026 SEASKY INTELLIGENT TECH (HK) LIMITED (TokenHubTop). All rights reserved. 本文件随 TokenHubTop AI Video Generator 一同授权，详见 [LICENSE](../LICENSE)。