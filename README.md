# plugins-for-sealdice

这是我为 SealDice 编写并持续整理的插件源码仓库。

当前仓库以 `Triangle Agency` 作为主要维护项目，同时收纳其他独立插件。与早期按版本文件堆叠的整理方式不同，现在这里更强调“当前维护版本 + 清晰文档 + Git 历史”，便于继续开发、发布和协作。

## 待办 / 待修

仓库内当前明确的维护项、待办和待修记录，统一收敛在 [docs/todo.md](docs/todo.md)。

如果你是第一次进入这个仓库，除了下载入口之外，最值得先看的就是这两类位置：

- 待办 / 待修：`docs/todo.md`
- 各插件说明页：对应插件目录下的 `README.md`
- 各插件帮助页：对应插件目录下的 `HELP.md`

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
  - 仓库维护说明、迁移记录与待办文档。

## 当前插件

### Triangle Agency

三角机构规则插件，支持属性检定、现实改写、三重升华、QA 调整、混沌管理与风味文字配置。

- 源码：`triangle-agency/triangle-agency.ts`
- 说明页：`triangle-agency/README.md`
- 帮助页：`triangle-agency/HELP.md`

### Other Plugins

其他插件统一放在 `other-plugins/` 下，单个插件各自维护自己的源码、说明页 README 与帮助页 HELP。

- 武经：`other-plugins/wujing/`
- 说明页：`other-plugins/wujing/README.md`
- 帮助页：`other-plugins/wujing/HELP.md`

## 维护原则

- 每个插件目录只保留一份当前源码。
- 旧版本、备份稿、过程性材料不进入当前仓库结构。
- 插件共用类型定义尽量收敛到 `shared/seal.d.ts`。
- 需要了解历史版本时，请查看 Git 提交历史或后续 Tag。
- 完成一轮相对明确的仓库更新后，可以顺手更新本 README 中的“最近更新”条目，给 GitHub 首页保留一段简短概览。

## 最近更新

2026-04-17 这一轮整理主要完成了几件事：

- 为 `Triangle Agency` 建立了可长期维护的自动化测试目录，当前已经覆盖 QA、三重升华分支、风味文字、角色卡、混沌管理和 `.tahelp` 回归。
- 修复了 `Triangle Agency` 中 `.tahelp` 帮助输出末尾说明缺失的问题，并把帮助内容补得更完整。
- 将两个插件目录中的帮助内容从 `README.md` 拆分为独立 `HELP.md`，让说明页与使用帮助分开。
- 为仓库补上 `package.json`、TypeScript 检查配置和测试约定，方便后续继续扩测试与做回归验证。

如果想看更细的维护记录和下一步计划，可以直接查看 [docs/todo.md](docs/todo.md)。

## 开发说明

本项目中的规则实现与主要逻辑均由我独立设计和编写。开发过程中会使用 AI 工具辅助起草、补全、整理和重构，但最终提交内容都会经过人工检查、修改与验证。

对我来说，这个仓库既是实际可用的插件集合，也是持续提升插件开发、代码组织与维护方式的实践项目。

## 关于当前源码形态

目前仓库里的插件源码，还是刻意保留了“单文件、贴近运行时”的写法。

原因很简单：SealDice 的插件最终还是运行在 JS 脚本环境里，而这类规则插件真正复杂的地方，通常也不是模块拆分本身，而是命令流程、状态管理、文本模板和长期迭代时的可维护性。

所以我现在的做法是，在源码层使用 TypeScript 风格的类型标注和 `seal.d.ts` 来提升补全、重构和审查体验，同时尽量让源码仍然接近最终可上传的脚本形态。这样做会比完整前端工具链更轻，也更符合当前这些插件的开发节奏。

我自己其实也还没有完全搞明白，为什么一些原本按 JS 习惯写的插件，在直接改成 `.ts` 之后，原来比较容易出的 bug 就少了。

后面如果插件继续变大，或者发布流程变得更复杂了，我再慢慢把这部分补得更完整一点。

如果你在实际使用里遇到 bug，或者发现哪里和文档写得对不上，也欢迎来提 Issue 或者 Discussions 告诉我，我会继续修。

## 致谢

感谢 `sealdice/sealdice-core` 项目的开发者。海豹的扩展机制非常好用，也让很多个人开发者有机会把自己的想法真正做成插件。

感谢 `oissevalt/sealdice-plugins` 中与 `Triangle Agency` 相关的实现与思路参考：
<https://github.com/oissevalt/sealdice-plugins/tree/main/src/triangle-agency>

我带的第一个长团就是《三角机构》，也正因为实际跑团中的需求，才慢慢把这个插件做成现在的样子。

## 贡献与交流

如果这个仓库对你有帮助，欢迎点一个 Star。这对个人开发者来说是很直接的鼓励。

本项目目前不接受直接的 PR 与 Push；如果你有想法、问题反馈或修复建议，欢迎通过 GitHub Discussions 或 Issue 交流。我会尽量在合适的时候整理并合入。

对于仓库作者自己明确要跟进的维护项，则统一记录在 `docs/todo.md`，避免分散在提交说明、聊天记录或零散备注里。

## 许可证

本项目基于 MIT License 开源，详见 `LICENSE`。
