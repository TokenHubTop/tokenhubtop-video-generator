# TokenHubTop AI Video Generator

Generate AI videos from text and reference media through TokenHubTop, with request previews, task tracking, and downloads.

通过 TokenHubTop 生成 AI 视频，支持文字、图片、首尾帧和音视频参考。

## Installation / 安装

Import this repository into an agent supporting Skills, or download [v1.0.0 ZIP](packages/tokenhubtop-video-generator-1.0.0.zip). Keep SKILL.md at the skill root. Follow your agent's installation instructions.

将本仓库导入支持 Skill 的智能体，或下载上述安装包并按智能体说明安装。

## Requirements / 要求

- Node.js 22+ and permission to execute scripts and access the network. No npm dependencies.
- Configure TOKENHUBTOP_API_KEY securely in the execution environment; never commit keys or paste them into chat.
- A video model available to your account and sufficient credit. Generation costs are billed by TokenHubTop.

需要有效 API Key、可用模型与账户额度。安装包不包含生成额度。

## Usage / 使用

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

## Verification / 验证

Version 1.0.0. Nine local behavior tests and skill validation passed. Live paid video generation has not yet been verified. Multiple shots are separate assets; automatic editing, stitching, and subtitles are not included.

已通过本地测试，尚未完成真实付费生成验收。多个镜头分别输出，不包含自动剪辑、拼接或字幕制作。

[Website / 官网](https://tokenhubtop.com/) · [API docs / 接口文档](https://tokenhubtop.com/zh/docs/api/ai-model/videos/createvideogeneration)
