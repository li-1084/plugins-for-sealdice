# Tests

这个目录用于长期维护仓库里的自动化测试。

## 约定

- 每个插件使用自己的测试子目录。
- 测试优先压到真实插件入口文件上，而不是复制一份平行逻辑。
- 如果插件依赖运行时环境，优先为测试补一个最小 fake runtime，只实现当前测试真正需要的接口。
- 发现 bug 后，优先先补回归测试，再改实现。

## 当前结构

- `tests/triangle-agency/`
  - `runtime.mts`
    - `Triangle Agency` 的最小 fake SealDice runtime。
  - `triangle-agency.test.mts`
    - 首批流程状态测试。
  - `tsconfig.json`
    - 测试目录的 TypeScript 检查配置。

## 后续维护

- 新增插件测试时，继续沿用 `tests/<plugin-name>/` 的目录结构。
- 如果测试开始需要共享辅助函数，再考虑新增 `tests/shared/`，不要过早抽象。
- 如果以后需要高保真集成测试，再考虑单独增加更完整的运行时模拟层。
