# TokenHubTop AI Video Generator v1.0.2

> Copyright © 2026 SEASKY INTELLIGENT TECH (HK) LIMITED (TokenHubTop). All rights reserved. 商业使用与再分发受 [LICENSE](LICENSE) 约束。

通过 TokenHubTop 生成 AI 视频，支持文字、图片、首尾帧以及音视频参考。技能提供请求预检、任务查询、单镜头提交和视频下载；需要多个画面时，可按镜头分别生成并在剪辑软件中组合成片。

- 官方仓库：<https://github.com/TokenHubTop/tokenhubtop-video-generator>
- 官方网站：<https://tokenhubtop.com/>
- 视频接口文档：<https://tokenhubtop.com/zh/docs/api/ai-model/videos/createvideogeneration>
- 安装包：[v1.0.2 ZIP](packages/tokenhubtop-video-generator-1.0.2.zip)

## Quick start / 新手快速开始

### 1. 复制这段话，发给你使用的智能体

```text
请帮我安装 TokenHubTop AI Video Generator（视频生成 Skill）。
GitHub 仓库：https://github.com/TokenHubTop/tokenhubtop-video-generator
请阅读仓库的 README.md 和 SKILL.md，按当前智能体的技能安装方式完成安装，
检查 Node.js 22+ 是否可用，并指导我在本机安全配置 TOKENHUBTOP_API_KEY。
不要让我把完整 API Key 发到聊天里。安装完成后告诉我如何开始生成视频。
```

English-speaking agents:

```text
Install the TokenHubTop AI Video Generator skill from:
https://github.com/TokenHubTop/tokenhubtop-video-generator
Read README.md and SKILL.md, follow this agent's skill installation process,
check that Node.js 22+ is available, and guide me through configuring
TOKENHUBTOP_API_KEY securely in my local environment.
Do not ask me to paste the full API key into chat. Then explain how to generate a video.
```

### 2. 获取 API Key 和使用额度

登录 [TokenHubTop 官网](https://tokenhubtop.com/) 或控制台，创建 API Key、确认账号可用的视频模型，并购买满足本次使用需求的额度。生成费用以平台实际页面和接口返回为准，安装包不包含生成额度。

密钥只允许在运行环境或本机终端中配置，不要写入仓库、项目文件或对话。

### 3. 告诉智能体你想生成什么视频

```text
请使用 TokenHubTop 视频生成 Skill，生成一段 5 秒的茶杯产品展示视频：
竖屏 9:16，暖色自然光，镜头缓慢靠近，茶杯上方有轻柔热气，不要字幕。
请先用我账号可用的视频模型做离线预检，确认参数后再提交。
```

## 1. 运行环境与素材规则

- Node.js 22 或更高版本；无需安装 npm 第三方依赖。
- 需要执行本机脚本和访问 TokenHubTop 的权限。
- 参考素材可以是公网 `http(s)` URL，也可以是用户已有且处于 Active 状态的 `asset://` 引用。
- 参考图与首尾帧模式互斥；`start`、`end` 各最多一个。
- 参考音频必须搭配图片、视频或首尾帧，不能单独使用。
- 技能不负责上传素材或核验素材身份。使用真人形象、声音、商标和版权内容前，用户须确认拥有相应权利。

## 2. API Key 规则

1. 用户在运行环境中配置 `TOKENHUBTOP_API_KEY`。
2. 密钥不进入对话、命令参数、项目文件、任务记录、日志或 Git 仓库。
3. 推荐只在当前终端会话临时设置环境变量；完整说明见 [配置指南](references/setup-guide.md)。
4. Key 失效、权限不足或额度耗尽时，到 TokenHubTop 控制台检查、轮换或撤销，不要猜测其他密钥。
5. 环境检查脚本不会读取或发送 API Key。

## 3. 首次使用前环境检查

在技能目录执行：

```bash
node scripts/check-environment.mjs
node scripts/check-environment.mjs --network
```

- `ready`：Node.js 和网络检查通过，可以继续。
- `needs_setup`：缺少 Node.js 22+ 或运行环境不完整。
- `unavailable`：当前无法访问 TokenHubTop，停止生成并稍后重试。
- `--network` 只做匿名连通性探测，不发送凭据。

## 4. 创建项目与预检

```bash
node scripts/video-generator.mjs init project.json
```

打开 `project.json`，填写账号实际可用的 `model`、镜头描述和可选参数，然后运行：

```bash
node scripts/video-generator.mjs plan project.json
```

`plan` 完全离线，只展示将要发送的接口结构和请求指纹，不会验证额度、探测素材或生成视频。字段定义见 [项目格式](references/project-format.md)，接口字段见 [视频接口参考](references/video-api.md)。

最简项目示例：

```json
{
  "title": "陶瓷杯新品素材",
  "model": "账号可用模型名称",
  "shots": [
    {
      "id": "shot-01",
      "label": "杯口细节",
      "direction": "近景展示杯口釉面，镜头平稳侧移，保持产品比例，暖白背景，不新增文字",
      "seconds": 5,
      "frame": {"aspect": "9:16", "quality": "720p"},
      "sound": false,
      "references": [
        {"role": "image", "uri": "https://cdn.example.com/product.jpg"}
      ]
    }
  ]
}
```

## 5. 生成模式

### 5.1 文生视频

不填写 `references`，在 `direction` 中描述画面、动作、摄影机运动和需要保持的元素。提交前确认 `model` 是用户账号可用的模型。

### 5.2 图生视频 / 多参考图

在 `references` 中使用 `role: "image"`：

```json
"references": [
  {"role": "image", "uri": "https://cdn.example.com/composition.png"},
  {"role": "image", "uri": "https://cdn.example.com/lighting.png"}
]
```

建议在 `direction` 中说明每张参考图的用途，例如构图、主体外观或光影风格。

### 5.3 首尾帧生视频

```json
"references": [
  {"role": "start", "uri": "https://cdn.example.com/start.png"},
  {"role": "end", "uri": "https://cdn.example.com/end.png"}
]
```

首尾帧不能与 `role: "image"` 混用。

### 5.4 视频参考 / 多参考视频

```json
"references": [
  {"role": "video", "uri": "https://cdn.example.com/source.mp4"}
]
```

`role: "video"` 可以多项。模型是否支持参考视频、参考视频数量和组合方式，以账号权限及平台返回为准。

### 5.5 参考音频与无声视频

参考音频：

```json
{
  "sound": true,
  "references": [
    {"role": "image", "uri": "https://cdn.example.com/scene.png"},
    {"role": "audio", "uri": "https://cdn.example.com/voice.mp3"}
  ]
}
```

无声成片：将镜头的 `sound` 设置为 `false`。参考音频不能脱离视觉参考单独使用。

## 6. 常用字段

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 项目名称，仅用于本地组织 |
| `model` | 是 | 用户账号明确可用的模型名称 |
| `shots` | 是 | 至少一个镜头 |
| `id` | 是 | 镜头编号，只使用字母、数字和短横线 |
| `label` | 是 | 人类可读的镜头名称 |
| `direction` | 是 | 画面、动作、摄影机运动和要求，对应接口 `prompt` |
| `seconds` | 否 | 4–15 秒或 `-1`，对应接口 `duration` |
| `frame.aspect` | 否 | 画面比例，如 `16:9`、`9:16`，对应 `metadata.ratio` |
| `frame.quality` | 否 | `480p`、`720p`、`1080p` 或 `4k`，对应 `metadata.resolution` |
| `sound` | 否 | 是否生成成片音频，对应 `metadata.generate_audio` |
| `references[].role` | 否 | `image`、`video`、`audio`、`start`、`end` |
| `references[].uri` | 否 | 公网 URL 或用户已有的有效 `asset://` 引用 |

可选字段未填写时不覆盖接口默认值。不要编造模型权限、价格、额度或平台承诺。完整字段说明见 [视频接口参考](references/video-api.md)。

## 7. 提交、查询与下载

```bash
node scripts/video-generator.mjs render project.json shot-01 ./runs
node scripts/video-generator.mjs sync project.json shot-01 ./runs
node scripts/video-generator.mjs collect project.json shot-01 ./runs
```

1. `render` 每次只提交明确指定的一个镜头，是可能产生费用的操作，不批量隐式执行。
2. `render` 在发送前建立独占记录，阻止同一目录下同一镜头重复提交；提交结果不确定时先核查平台任务记录。
3. `sync` 只查询一次。`queued`、`in_progress` 为处理中；`completed` 才可下载；`failed` 为失败。
4. `collect` 先查询状态，再保存成功镜头的视频。下载不携带 API Key，拒绝重定向和非 HTTPS 媒体链接。
5. 项目变更后创建新镜头版本，例如 `shot-01-v2`。不要用旧结果冒充新描述生成的视频。
6. 多镜头交付时逐个列出名称、任务编号、状态、链接和本地路径；任一项未完成即标记为部分完成。

## 8. 失败处理与降级

| 情况 | 处理 |
|---|---|
| API Key 缺失 | 停止提交，引导用户在运行环境配置 |
| 401 / 403 | 到控制台检查 Key、权限、账号状态和额度 |
| 网络错误或超时 | 停止自动重试，保留项目与任务记录，稍后手动重试 |
| 素材地址不合规 | 拒绝提交，提示改用公网 URL 或有效 asset 引用 |
| 参数冲突 | 修正图片/首尾帧、音频或时长后重试，不猜测参数 |
| `failed` | 展示平台原因，可建议简化提示词或减少素材，不自动重建收费任务 |
| 下载失败 | 输出任务编号和视频 URL，由用户手动保存 |
| 提交结果不确定 | 先查平台历史，禁止自动重复提交 |

停止条件：API Key 缺失且用户拒绝配置、网络不可用、素材不合规、平台明确拒绝或用户放弃重试时，停止对应流程。

## 9. 内容安全与合规

1. 生成内容须合法合规，不得用于违法、侵权、欺诈、恶意冒充或损害他人权益的用途。
2. 参考素材须由用户有权使用；涉及他人形象、声音、隐私或品牌资产时须事先取得授权。
3. 遵守平台内容审核和适用标识要求；AI 生成内容应按用途依法进行标识。
4. 本技能只调用 TokenHubTop 官方接口，不绕过、不干预平台审核。
5. 生成内容的使用责任由使用者承担。

## 10. 使用前自查

1. 模型名已由用户指定或从账号可用清单确认。
2. 素材地址合规，没有猜测 `asset://` ID。
3. 图片与首尾帧未混用，参考音频有视觉素材配合，时长在允许范围内。
4. 已运行 `plan` 核对请求结构和可能产生费用的参数。
5. 内容与素材合法合规，用户有权使用相关形象、声音和品牌资产。
6. 生成后向用户报告任务编号、状态、成片路径或 URL，不把任务编号当成已生成成功。

## Installation / 安装

将本仓库导入支持 Skill 的智能体，或下载 [v1.0.2 安装包](packages/tokenhubtop-video-generator-1.0.2.zip)，保持 `SKILL.md` 位于技能根目录，并按对应产品的技能安装说明导入。

## Requirements / 要求

- Node.js 22+，允许执行脚本和访问网络。
- 在运行环境安全配置 `TOKENHUBTOP_API_KEY`。
- 用户账号具备可用视频模型和足额额度。
- 不包含生成额度、模型权限、素材上传、资产核验、自动剪辑、拼接、转码或字幕功能。

## License / 许可

本 Skill 及其安装包适用 [TokenHubTop AI Video Generator 商业许可](LICENSE)。未经 TokenHubTop 事先书面许可，不得销售、转售、再许可、重新发布或向第三方分发。

This Skill and its installation package are governed by the TokenHubTop AI Video Generator Proprietary License. It is not open-source software.