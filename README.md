# TokenHubTop AI Video Generator

Generate AI videos from text and reference media through TokenHubTop, with request previews, task tracking, and downloads.

通过 TokenHubTop 生成 AI 视频，支持文字、图片、首尾帧和音视频参考。

## Quick start / 新手快速开始

### 1. 复制这段话，发给你使用的智能体

适用于支持安装 Skill、执行脚本和联网的智能体。复制下面整段内容即可：

```text
请帮我安装 TokenHubTop AI Video Generator（视频生成 Skill）。
GitHub 仓库：https://github.com/TokenHubTop/tokenhubtop-video-generator
请阅读仓库的 README.md 和 SKILL.md，按当前智能体的技能安装方式完成安装，
检查 Node.js 22+ 是否可用，并指导我在本机安全配置 TOKENHUBTOP_API_KEY。
不要让我把完整 API Key 发到聊天里。安装完成后告诉我如何开始生成视频。
```

For an English-speaking agent, paste:

```text
Install the TokenHubTop AI Video Generator skill from:
https://github.com/TokenHubTop/tokenhubtop-video-generator
Read README.md and SKILL.md, follow this agent's skill installation process,
check that Node.js 22+ is available, and guide me through configuring
TOKENHUBTOP_API_KEY securely in my local environment.
Do not ask me to paste the full API key into chat. Then explain how to generate a video.
```

安装方式由智能体决定；如果它不能自动安装，请使用下方 ZIP 按该产品的技能安装说明导入。

### 2. 获取 API Key 和使用额度

前往 **[TokenHubTop 官网 → https://tokenhubtop.com/](https://tokenhubtop.com/)** 注册或登录，获取 API Key 并购买使用额度，然后按智能体提示完成配置。生成费用以平台实际规则为准。

### 3. 告诉智能体你想生成什么视频

配置完成后，可以这样说：

```text
请使用 TokenHubTop 视频生成 Skill，生成一段 5 秒的茶杯产品展示视频：
竖屏 9:16，暖色自然光，镜头缓慢靠近，茶杯上方有轻柔热气，不要字幕。
请先让我选择账号可用的视频模型，然后提交生成，完成后帮我下载。
```

也可以提供产品图片或参考视频，并说明希望保留的外观和动作。素材需要可访问的链接或有效的平台素材库引用。

You can request a video in your own language after setup. Specify an available model and describe the scene; reference media are optional.

## Installation / 其他安装方式

Import this repository into an agent supporting Skills, or download [v1.0.0 ZIP](packages/tokenhubtop-video-generator-1.0.0.zip). Keep SKILL.md at the skill root. Follow your agent's installation instructions.

将本仓库导入支持 Skill 的智能体，或下载上述安装包并按智能体说明安装。

## Requirements / 要求

- Node.js 22+ and permission to execute scripts and access the network. No npm dependencies.
- Configure TOKENHUBTOP_API_KEY securely in the execution environment; never commit keys or paste them into chat.
- A video model available to your account and sufficient credit. Generation costs are billed by TokenHubTop.

需要有效 API Key、可用模型与账户额度。安装包不包含生成额度。

**[Get an API Key & purchase credits / 获取 API Key 与购买额度 → tokenhubtop.com](https://tokenhubtop.com/)**

Visit [TokenHubTop](https://tokenhubtop.com/) to register or sign in, obtain your API key, and purchase usage credits. Available models and pricing are shown on the platform.

前往 [TokenHubTop 官网](https://tokenhubtop.com/) 注册或登录，获取 API Key 并购买使用额度。可用模型与价格以平台页面为准。

## Script usage / 脚本调用（进阶）

Ask your agent to generate a video using this skill, specifying an available model. Direct script usage:

```sh
node scripts/video-generator.mjs init project.json
# Fill model and shot direction in project.json.
node scripts/video-generator.mjs plan project.json
node scripts/video-generator.mjs render project.json shot-01 ./runs
node scripts/video-generator.mjs sync project.json shot-01 ./runs
node scripts/video-generator.mjs collect project.json shot-01 ./runs
```

See [project format](references/project-format.md). Plan is offline; render submits one potentially billable task; sync queries once. Keep task records private. Check platform history before retrying an uncertain submission.

详见项目格式说明。任务记录请保存在私有目录；提交结果不确定时先核查平台记录，避免重复扣费。

## Output / 输出说明

Each generation task produces a separate video asset. For a multi-shot project, download the clips and assemble them in your preferred video editor.

每个生成任务输出独立视频。制作多镜头作品时，可下载各段素材，在常用剪辑软件中组合成片。

[Website / 官网](https://tokenhubtop.com/) · [API docs / 接口文档](https://tokenhubtop.com/zh/docs/api/ai-model/videos/createvideogeneration)
