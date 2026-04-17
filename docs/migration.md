# Repository Migration Notes

## 这次迁移做了什么

这个仓库从“按版本文件和过程资料堆叠”的结构，迁移为“按插件维护当前源码”的结构。

目标是让 GitHub 成为唯一真源，便于后续在新的本地目录中重新克隆、继续开发和让 AI 直接接手。

## 新结构

- `triangle-agency/`
  - 主插件目录
- `other-plugins/`
  - 其他插件目录
- `shared/`
  - 共用类型定义
- `docs/`
  - 仓库级维护说明

## 文件归位规则

- `TA-triangle-agency 0.1.3/TA-triangle-agency0.1.3.ts`
  - 迁为 `triangle-agency/triangle-agency.ts`
- `武经插件/UJ-wujing-0.3.0.ts`
  - 迁为 `other-plugins/wujing/wujing.ts`
- 多份 `seal.d.ts`
  - 收敛为 `shared/seal.d.ts`

## 不再保留在当前树中的内容

- 旧版本并排源码
- 备份目录
- 稳定版本目录
- 过程性待办、修改意见、更新备忘录
- 单次协作过程中的提示词文件

这些内容如果已经进过 Git 历史，可以通过提交记录回看；如果只存在于旧本地工作目录，则由旧本地目录继续保存。

## 以后新增插件时的规则

1. 在 `other-plugins/` 下为新插件建立独立目录。
2. 每个插件目录只保留一份当前源码。
3. 把目录说明写进该插件自己的 `README.md`，把完整使用说明写进 `HELP.md`。
4. 不再通过复制 `0.x.x.ts` 文件来保存版本。

## 以后发布新版本时的规则

- 日常开发直接修改当前源码文件。
- 使用 Git commit 记录版本演进。
- 需要明确发布节点时，优先使用 Git tag，而不是再复制一份版本号文件。
