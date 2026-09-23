# TokenHubTop 视频生成接口参考

本文件记录 TokenHubTop AI Video Generator v1.0.2 实际使用和验证的接口字段。字段未在本文档列出时，不要把其他平台或模型的参数直接套用到本 Skill。

- BaseURL：`https://tokenhubtop.com`
- 鉴权：`Authorization: Bearer <TOKENHUBTOP_API_KEY>`
- 请求类型：`Content-Type: application/json`
- 创建任务：`POST /v1/video/generations`
- 查询任务：`GET /v1/video/generations/{task_id}`

API Key 只由运行环境提供给 `scripts/video-generator.mjs`，不会写入项目文件、任务记录或下载请求。

## 1. 接口概览

| 操作 | 方法 | 路径 | 说明 |
|---|---|---|---|
| 提交任务 | `POST` | `/v1/video/generations` | 创建一个可能产生费用的视频任务，返回任务 ID |
| 查询任务 | `GET` | `/v1/video/generations/{task_id}` | 查询排队、生成、成功或失败状态 |

脚本不会自动轮询、自动重试或批量提交。每次 `render` 只提交一个明确指定的镜头。

## 2. 请求字段

### 基础字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `model` | string | 是 | 用户账号明确可用的模型名称 |
| `prompt` | string | 条件必填 | 视频描述；文生视频必须提供 |
| `duration` | integer | 否 | 4–15 秒或 `-1`（模型智能选择） |
| `images` | string[] | 条件必填 | 参考图地址数组；图生视频或多参考图使用 |
| `first_frame_url` | string | 否 | 首帧地址 |
| `last_frame_url` | string | 否 | 尾帧地址 |
| `metadata` | object | 否 | 画面规格、参考视频、参考音频和音频生成选项 |

### metadata 字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `ratio` | string | 画面比例，例如 `16:9`、`9:16`、`1:1` |
| `resolution` | string | `480p`、`720p`、`1080p` 或 `4k` |
| `generate_audio` | boolean | 是否生成成片音频；未设置时按接口默认值处理 |
| `video_urls` | string[] | 参考视频地址数组 |
| `audio_urls` | string[] | 参考音频地址数组；不能脱离视觉参考单独使用 |

模型、账号、额度和素材共同决定参数能否生效。平台文档或示例中出现的规格不保证当前账号一定支持。

## 3. 项目 JSON 与接口映射

项目文件使用以下结构：

```json
{
  "title": "项目名称",
  "model": "账号可用模型名称",
  "shots": [
    {
      "id": "shot-01",
      "label": "镜头名称",
      "direction": "画面描述、摄影机运动和要求",
      "seconds": 5,
      "frame": {"aspect": "16:9", "quality": "720p"},
      "sound": true,
      "references": [
        {"role": "image", "uri": "https://cdn.example.com/reference.png"}
      ]
    }
  ]
}
```

字段映射：

| 项目字段 | 接口字段 |
|---|---|
| `model` | `model` |
| `direction` | `prompt` |
| `seconds` | `duration` |
| `frame.aspect` | `metadata.ratio` |
| `frame.quality` | `metadata.resolution` |
| `sound` | `metadata.generate_audio` |
| `role: "image"` | `images` |
| `role: "start"` | `first_frame_url` |
| `role: "end"` | `last_frame_url` |
| `role: "video"` | `metadata.video_urls` |
| `role: "audio"` | `metadata.audio_urls` |

## 4. 生成模式

| 模式 | 项目中的素材 | 说明 |
|---|---|---|
| 文生视频 | 不填 `references` | 只使用 `model` 和 `direction` |
| 单图生视频 | 一个 `image` | 参考图作为主要画面依据 |
| 多参考图 | 多个 `image` | 在 `direction` 中说明每张图用途 |
| 首尾帧生视频 | 一个 `start`、一个 `end` | 与 `image` 互斥 |
| 视频参考 | 一个或多个 `video` | 参考动作、风格或结构，是否支持以平台为准 |
| 参考音频 | `audio` 加视觉参考 | 音频必须搭配图片、视频或首尾帧 |
| 无声成片 | `sound: false` | 映射为 `metadata.generate_audio: false` |

## 5. 素材地址规则

1. 公网地址必须可被平台访问；不要提交 `localhost`、内网地址、带用户名密码的 URL 或带 fragment 的 URL。
2. 允许 `http://` 和 `https://` 参考地址；自动下载成片只接受 HTTPS。
3. `asset://` 引用必须是用户在 TokenHubTop 中已有且处于 Active 状态的素材。脚本不根据文件名猜测素材 ID。
4. 图片、视频、音频的实际可接受格式和大小由平台及模型决定。示例中的 `example.com` 地址不是可用素材。
5. 用户必须拥有素材的使用权。涉及真人形象、声音、隐私或品牌资产时，先确认授权。

## 6. 查询响应与状态

脚本依赖任务 ID 和以下状态：

| 状态 | 说明 |
|---|---|
| `queued` | 已排队，尚未开始生成 |
| `in_progress` | 正在生成 |
| `completed` | 已完成，可以尝试下载 |
| `failed` | 生成失败，应读取平台错误信息 |

成片地址优先读取 `output.video_url`，兼容 `content.video_url`。其他字段可能随平台或模型变化，以实际响应为准，不要根据未返回字段编造结果。

`sync` 只查询一次。任务仍在处理中时，保留任务记录并按宿主环境可用时间再次查询；不启动无限后台循环。

## 7. 下载规则

`collect` 先确认状态，再下载 `completed` 任务的视频：

- 下载请求不携带 API Key。
- 只允许 HTTPS 成片链接。
- 拒绝重定向和非视频响应。
- 连接超时为 120 秒，单文件上限 512 MiB。
- 文件保存失败时保留任务记录，并输出可手动保存的链接。
- 本技能不自动拼接、转码、烧录字幕或下载尾帧。

## 8. 错误处理

| 错误或情况 | 处理 |
|---|---|
| 401 / 403 | 到 TokenHubTop 控制台检查 Key、权限和账号状态 |
| 网络错误、超时或 5xx | 停止自动重试，展示错误；网络恢复后再由用户明确重试 |
| 素材地址不合规 | 拒绝提交，提示提供公网地址或有效 asset 引用 |
| 参数冲突 | 修正图片/首尾帧混用、音频单独使用或时长越界后重试 |
| 模型不可用 | 由用户从账号可用模型中重新选择，不自动替换模型 |
| 生成失败 | 展示平台错误；建议简化提示词或减少素材，不自动重建收费任务 |
| 下载失败 | 保留任务 ID 和成片 URL，交由用户手动保存 |
| 提交结果不确定 | 先查询平台任务历史，禁止自动重复提交 |

## 9. 核验信息

- 核验日期：2026-09-23
- 官方视频创建接口：<https://tokenhubtop.com/zh/docs/api/ai-model/videos/createvideogeneration>
- 官方视频查询接口：<https://tokenhubtop.com/zh/docs/api/ai-model/videos/getvideogeneration>
- 项目格式说明：[project-format.md](project-format.md)
- 配置说明：[setup-guide.md](setup-guide.md)

## 版权

Copyright © 2026 SEASKY INTELLIGENT TECH (HK) LIMITED (TokenHubTop). All rights reserved. 本文件随 TokenHubTop AI Video Generator 一同授权，详见 [LICENSE](../LICENSE)。