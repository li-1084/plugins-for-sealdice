# plugins-for-sealdice

这是我为 SealDice 编写并持续整理的插件源码仓库。

当前仓库以 `Triangle Agency` 作为主要维护项目，同时收纳其他独立插件。与早期按版本文件堆叠的整理方式不同，现在这里更强调“当前维护版本 + 清晰文档 + Git 历史”，便于继续开发、发布和协作。

## 下载入口

### Triangle Agency

- 直接下载源码：
  [triangle-agency.ts](https://raw.githubusercontent.com/li-1084/plugins-for-sealdice/main/triangle-agency/triangle-agency.ts)
- 正式发布页：
  [Triangle Agency Release](https://github.com/li-1084/plugins-for-sealdice/releases/tag/triangle-agency-v0.1.3)

### Other Plugins

- WuJing 直接下载源码：
  [wujing.ts](https://raw.githubusercontent.com/li-1084/plugins-for-sealdice/main/other-plugins/wujing/wujing.ts)

> 当前 `Triangle Agency` 提供独立 Release；其他插件暂时只提供源码直链下载。

## 安装方式

1. 下载对应插件的 `.ts` 文件。
2. 在 SealDice 中上传并加载脚本。
3. 如果希望使用相对稳定、带发布说明的版本，优先查看 `Triangle Agency Release`。

## 仓库结构

- `triangle-agency/`
  - 主插件，当前维护重点。
- `other-plugins/`
  - 其他独立插件集合，当前包含 `wujing`。
- `shared/`
  - 共用类型定义，目前保存一份 `seal.d.ts`。
- `docs/`
  - 仓库维护说明与迁移记录。

## 当前插件

### Triangle Agency

三角机构规则插件，支持属性检定、现实改写、三重升华、QA 调整、混沌管理与风味文字配置。

- 源码：`triangle-agency/triangle-agency.ts`
- 说明：`triangle-agency/README.md`

### Other Plugins

其他插件统一放在 `other-plugins/` 下，单个插件各自维护自己的 README 与源码。

- 武经：`other-plugins/wujing/`

## 维护原则

- 每个插件目录只保留一份当前源码。
- 旧版本、备份稿、过程性材料不进入当前仓库结构。
- 插件共用类型定义尽量收敛到 `shared/seal.d.ts`。
- 需要了解历史版本时，请查看 Git 提交历史或后续 Tag。

## 开发说明

本项目中的规则实现与主要逻辑均由我独立设计和编写。开发过程中会使用 AI 工具辅助起草、补全、整理和重构，但最终提交内容都会经过人工检查、修改与验证。

对我来说，这个仓库既是实际可用的插件集合，也是持续提升插件开发、代码组织与维护方式的实践项目。

## 致谢

感谢 `sealdice/sealdice-core` 项目的开发者。海豹的扩展机制非常好用，也让很多个人开发者有机会把自己的想法真正做成插件。

感谢 `oissevalt/sealdice-plugins` 中与 `Triangle Agency` 相关的实现与思路参考：
<https://github.com/oissevalt/sealdice-plugins/tree/main/src/triangle-agency>

我带的第一个长团就是《三角机构》，也正因为实际跑团中的需求，才慢慢把这个插件做成现在的样子。

## 贡献与交流

如果这个仓库对你有帮助，欢迎点一个 Star。这对个人开发者来说是很直接的鼓励。

本项目目前不接受直接的 PR 与 Push；如果你有想法、问题反馈或修复建议，欢迎通过 GitHub Discussions 或 Issue 交流。我会尽量在合适的时候整理并合入。

## 许可证

本项目基于 MIT License 开源，详见 `LICENSE`。
