# 镜头项目格式

项目是 UTF-8 JSON。示例中的模型来自官方文档，实际使用前需确认账号支持；example.com 地址仅表示字段位置，不能当作真实素材。

```json
{
  "title": "陶瓷杯新品素材",
  "model": "Seedance 2.0/uP",
  "shots": [
    {
      "id": "shot-01",
      "label": "杯口细节",
      "direction": "近景展示杯口釉面，镜头平稳侧移，保持产品比例，暖白背景，不新增文字",
      "seconds": 5,
      "frame": {"aspect": "9:16", "quality": "720p"},
      "sound": false,
      "references": [{"role": "image", "uri": "https://example.com/product.jpg"}]
    }
  ]
}
```

title、model、shots 必填；每个镜头的 id、label、direction 必填。id 只用字母数字和短横线，区分镜头版本。seconds、frame、sound、references 均可省略，省略项不覆盖服务默认值。

references 的 role 可为 image、video、audio、start、end。image/video/audio 允许多项，start/end 各最多一项；image 不与 start/end 混用。audio 需要至少一种视觉参考。uri 可为公网 HTTP/HTTPS，或用户已有且处于 Active 状态的 asset:// 引用。不会凭名称猜测素材 ID，也不负责上传或资产身份核验。

seconds 为 4–15 的整数或 -1。frame.aspect 为正整数比，例如 16:9；frame.quality 为 480p、720p、1080p 或 4k。规格能否生效以模型实际支持为准。sound 为布尔值，控制成片音频。

## 与官方接口的关系

以 2026-09-21 获取的 TokenHubTop 文档为依据：

- [创建视频任务](https://tokenhubtop.com/zh/docs/api/ai-model/videos/createvideogeneration)
- [读取任务结果](https://tokenhubtop.com/zh/docs/api/ai-model/videos/getvideogeneration)
- [转换模式规格](https://tokenhubtop.com/zh/docs/api/ai-model/videos/seedance/convert)

创建路径为 POST https://tokenhubtop.com/v1/video/generations；查询在其后附加任务 ID，并使用 GET。只有这两个 API 操作使用 Bearer 密钥。

项目 model 映射到 model，direction 映射到 prompt，seconds 映射到 duration。frame 和 sound 分别映射到 metadata.ratio、metadata.resolution 和 metadata.generate_audio。素材角色按顺序映射到 images、metadata.video_urls、metadata.audio_urls、first_frame_url、last_frame_url。

queued、in_progress 为处理中；completed 才可下载；failed 为远端失败。视频链接来自 output.video_url，兼容 content.video_url。未知状态保留原值并停止推断。

## 记录及边界

每个镜头的 .json 记录包含请求指纹、提交阶段、任务 ID、响应快照和下载路径，不含 API 密钥。快照可能含临时签名链接，因此记录应保留在私有工作目录。不要将生成记录上传到技能市场。

独占记录阻止相同镜头意外重复提交，不代表服务端具备幂等性。程序不绕过平台权限，不声称自动下载已验证所有公网安全条件；如在不可信多租户服务运行，应另设网络隔离和域名准入。

本版本仅覆盖上述转换接口，未承诺其他厂商原生接口通用兼容，也未接入技能市场的代收款能力。

## 版权

Copyright © 2026 SEASKY INTELLIGENT TECH (HK) LIMITED (TokenHubTop). All rights reserved. 本文件随 TokenHubTop AI Video Generator 一同授权，详见 [LICENSE](../LICENSE)。
