# Triangle Agency

`Triangle Agency` 是本仓库当前的主插件。

## 下载

- 直接下载源码：
  [triangle-agency.ts](https://raw.githubusercontent.com/li-1084/plugins-for-sealdice/main/triangle-agency/triangle-agency.ts)
- GitHub Release：
  [Triangle Agency v0.1.3](https://github.com/li-1084/plugins-for-sealdice/releases/tag/triangle-agency-v0.1.3)

## 简介

这是一个面向 SealDice 的《三角机构》规则插件，核心体验围绕流程化检定展开：

- `.ta` 进行属性检定
- `.tr` 进行现实改写
- 检定后根据结果进入三重升华或 QA 调整
- 最终统一结算混沌、过载与其他结果

插件同时提供角色卡查看、混沌管理和风味文字配置。

## 主要指令

- `.set ta`
  - 切换到三角机构规则模板。
- `.st <属性><数值>`
  - 录入或调整角色属性。
- `.tas`
  - 查看当前角色卡。
- `.ta <属性>`
  - 发起资质检定。
- `.tr <属性>`
  - 发起现实改写。
- `.ta <数值>` / `.tr <数值>`
  - 进行不带完整流程的测试投掷。
- `.tatr a/b/c`
  - 在三重升华阶段选择分支。
- `.taqa <数值>` / `.taqa quit`
  - 在 QA 阶段调整成功数或结束调整。
- `.tcs`
  - 查看或调整当前混沌值。
- `.tcst <数值>`
  - 直接设置混沌值。
- `.taflavor`
  - 管理群内风味文字配置。
- `.tahelp`
  - 查看插件帮助。

## 机制说明

- 插件不支持代骰。
  - 这是因为 `.ta` / `.tr` 的后续阶段依赖进行中的状态记录，代骰会让操作者和被代骰者的状态归属混乱。
- 三重升华与 QA 调整都依赖内存中的临时状态。
  - 发起新投掷、插件重载或流程结束后，当前状态会被覆盖或清除。
- 混沌值使用群变量维护。
- 过载等角色属性依赖角色卡属性存储。

## 文件

- 当前源码：`triangle-agency.ts`
- 共用类型：`../shared/seal.d.ts`

## 维护约定

- 当前目录只保留当前维护版本。
- 历史版本通过 Git 历史回溯，不再保留平行版本文件。
