# Triangle Agency Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `Triangle Agency` 建立第一批可自动回归的流程测试、长期维护的测试目录结构，并在完成首批测试后同步更新待办文档。

**Architecture:** 不先把插件拆成多模块，而是直接在测试中加载真实的 `triangle-agency.ts`，同时注入一个最小 fake `seal` 运行时。测试只 fake 当前流程需要的变量读写、命令注册、消息回复与随机数，从而覆盖真实的 QA、三重升华、过载与中断逻辑。

**Tech Stack:** TypeScript, Node built-in `node:test`, Node built-in `assert/strict`, fake SealDice runtime

---

### Task 1: 建立测试目录与运行脚本

**Files:**
- Create: `tests/README.md`
- Create: `tests/triangle-agency/runtime.ts`
- Create: `tests/triangle-agency/tsconfig.json`
- Modify: `package.json`

- [ ] **Step 1: 写入测试目录说明**

说明内容应包括：

- `tests/` 作为长期测试目录
- 每个插件一个子目录
- 优先测试真实插件入口，而不是复制业务逻辑
- 新 bug 优先补回归测试

- [ ] **Step 2: 写入 Triangle Agency fake runtime**

fake runtime 至少要提供：

- `seal.ext.find/new/register/registerStringConfig/newCmdItemInfo/newCmdExecuteResult`
- `seal.gameSystem.newTemplate`
- `seal.vars.intGet/intSet/strGet/strSet`
- `seal.replyToSender`
- `seal.getCtxProxyFirst`

还要提供测试辅助方法：

- 创建 `ctx`
- 创建 `msg`
- 创建 `cmdArgs`
- 按骰点序列 mock `Math.random`
- 读取玩家变量、群变量、回复消息、注册命令

- [ ] **Step 3: 增加测试脚本**

在 `package.json` 中加入：

```json
"test": "npm run test:triangle-agency",
"test:triangle-agency": "node --experimental-strip-types --test --test-concurrency=1 tests/triangle-agency/triangle-agency.test.ts"
```

- [ ] **Step 4: 为测试目录写 tsconfig**

`tests/triangle-agency/tsconfig.json` 至少应覆盖：

- `tests/triangle-agency/**/*.ts`
- `triangle-agency/triangle-agency.ts`
- `shared/seal.d.ts`

并保持：

- `noEmit: true`
- `skipLibCheck: true`

### Task 2: 先写失败测试覆盖首批高风险流程

**Files:**
- Create: `tests/triangle-agency/triangle-agency.test.ts`

- [ ] **Step 1: 写 QA 正常结算的失败测试**

测试要验证：

- `.ta <属性>` 进入 QA
- `.taqa 1` 扣减对应属性
- 最终混沌写回群变量

- [ ] **Step 2: 写 QA 资源不足的失败测试**

测试要验证：

- `.taqa` 超过当前资质保证时拒绝扣除
- 提示“资质保证不足”
- 状态不被清除

- [ ] **Step 3: 写 `taqa quit` 的失败测试**

测试要验证：

- 放弃 QA 时直接结算
- 结算后再执行 `.taqa` 会提示当前无状态

- [ ] **Step 4: 写过载先于 QA 的失败测试**

测试要验证：

- 属性小于等于 0 时先归零
- `过载 +1`
- 最终输出带上本次过载增加标记

- [ ] **Step 5: 写三重升华分支的失败测试**

测试要验证：

- 原始 `Tri = 3` 时进入 `trine_select`
- 不进入普通 QA

- [ ] **Step 6: 写“新投掷打断旧 QA 状态”的失败测试**

测试要验证：

- 第二次 `.ta` / `.tr` 会打断旧 QA 状态
- 旧状态的混沌按当前数值结算

- [ ] **Step 7: 写“新投掷打断三重升华状态”的失败测试**

测试要验证：

- 三重升华状态被打断时不应错误计入混沌

### Task 3: 让测试通过并整理长期维护入口

**Files:**
- Modify: `tests/triangle-agency/runtime.ts`
- Modify: `tests/triangle-agency/triangle-agency.test.ts`
- Modify: `package.json`
- Modify: `docs/todo.md`

- [ ] **Step 1: 调整 fake runtime，使真实插件可被反复加载**

需要确保：

- 每个测试都能获得干净的 `seal`
- 每个测试都能重新加载 `triangle-agency.ts`
- 模块缓存不会污染后续测试

- [ ] **Step 2: 运行单项测试并修正 fake runtime**

Run:

```bash
npm run test:triangle-agency
```

Expected:

- 第一次运行先失败，且失败点能对应到测试预期
- 通过最小调整让它们稳定通过

- [ ] **Step 3: 更新待办**

在 `docs/todo.md` 中补充：

- 已完成第一批 Triangle Agency 自动化测试
- 后续优先补哪些流程测试
- 长期测试目录如何继续扩展

- [ ] **Step 4: 做最终验证**

Run:

```bash
npm run test:triangle-agency
npm run typecheck
```

Expected:

- 首批流程测试全部通过
- 现有类型检查继续通过

