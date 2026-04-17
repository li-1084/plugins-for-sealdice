# plugins-for-sealdice

为 SealDice 编写的插件源码仓库。

这个仓库现在只保留各插件的当前维护版本，历史版本不再以 `0.x.x.ts` 副本的方式并排存放，统一交给 Git 历史管理。

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

本项目核心逻辑与规则实现均为开发者原创编写。开发过程中可以使用 AI 工具辅助起草、补全与整理，但所有最终提交内容都应经过人工检查。

## 致谢

感谢 `sealdice/sealdice-core` 项目的开发者。

感谢 `oissevalt/sealdice-plugins` 中与 Triangle Agency 相关的实现与思路参考：
<https://github.com/oissevalt/sealdice-plugins/tree/main/src/triangle-agency>

## 许可证

本项目基于 MIT License 开源，详见 `LICENSE`。
