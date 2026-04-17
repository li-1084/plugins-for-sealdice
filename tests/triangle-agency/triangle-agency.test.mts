import test from "node:test";
import assert from "node:assert/strict";

import { TriangleAgencyTestRuntime } from "./runtime.mts";

test("QA 调整会扣除资质保证并结算混沌", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext();
    runtime.setInt(ctx, "专注", 5);
    runtime.setInt(ctx, "过载", 0);

    await runtime.runCommand("ta", ["专注"], { ctx, rolls: [3, 1, 1, 1, 1, 1] });
    assert.match(runtime.lastReply(), /QA阶段/);

    await runtime.runCommand("taqa", ["1"], { ctx });

    assert.equal(runtime.getInt(ctx, "专注"), 4);
    assert.equal(runtime.getInt(ctx, "$g混沌值"), 4);
    assert.match(runtime.lastReply(), /成功/);
});

test("QA 调整超出当前资质保证时会被拒绝", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext();
    runtime.setInt(ctx, "专注", 1);
    runtime.setInt(ctx, "过载", 0);

    await runtime.runCommand("ta", ["专注"], { ctx, rolls: [3, 1, 1, 1, 1, 1] });
    const repliesBefore = runtime.replyCount();

    await runtime.runCommand("taqa", ["2"], { ctx });

    assert.equal(runtime.getInt(ctx, "专注"), 1);
    assert.equal(runtime.getInt(ctx, "$g混沌值"), 0);
    assert.match(runtime.lastReply(), /资质保证不足/);
    assert.equal(runtime.replyCount(), repliesBefore + 1);
});

test("taqa quit 会直接结算并清除 QA 状态", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext();
    runtime.setInt(ctx, "专注", 3);
    runtime.setInt(ctx, "过载", 0);

    await runtime.runCommand("ta", ["专注"], { ctx, rolls: [3, 1, 1, 1, 1, 1] });
    await runtime.runCommand("taqa", ["quit"], { ctx });

    assert.equal(runtime.getInt(ctx, "$g混沌值"), 5);

    await runtime.runCommand("taqa", ["quit"], { ctx });
    assert.match(runtime.lastReply(), /当前没有等待处理的QA调整状态/);
});

test("属性小于等于 0 时会先归零并增加过载", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext();
    runtime.setInt(ctx, "专注", 0);
    runtime.setInt(ctx, "过载", 0);

    await runtime.runCommand("ta", ["专注"], { ctx, rolls: [3, 1, 1, 1, 1, 1] });

    assert.equal(runtime.getInt(ctx, "专注"), 0);
    assert.equal(runtime.getInt(ctx, "过载"), 1);
    assert.match(runtime.lastReply(), /质保:0 \| 过载:1/);

    await runtime.runCommand("taqa", ["quit"], { ctx });
    assert.match(runtime.lastReply(), /1「已\+1」/);
});

test("三重升华会进入分支选择而不是普通 QA", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext();
    runtime.setInt(ctx, "专注", 5);
    runtime.setInt(ctx, "过载", 0);

    await runtime.runCommand("ta", ["专注"], { ctx, rolls: [3, 3, 3, 1, 1, 1] });

    assert.match(runtime.lastReply(), /三重升华/);

    await runtime.runCommand("taqa", ["quit"], { ctx });
    assert.match(runtime.lastReply(), /当前没有等待处理的QA调整状态/);
});

test("新投掷打断旧 QA 状态时会结算旧状态混沌", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext();
    runtime.setInt(ctx, "专注", 5);
    runtime.setInt(ctx, "过载", 0);

    await runtime.runCommand("ta", ["专注"], { ctx, rolls: [3, 1, 1, 1, 1, 1] });
    assert.equal(runtime.getInt(ctx, "$g混沌值"), 0);

    await runtime.runCommand("ta", ["1"], { ctx, rolls: [1, 1, 1, 1, 1, 1] });

    assert.equal(runtime.getInt(ctx, "$g混沌值"), 5);
});

test("新投掷打断三重升华状态时不会错误计入混沌", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext();
    runtime.setInt(ctx, "专注", 5);
    runtime.setInt(ctx, "过载", 0);

    await runtime.runCommand("ta", ["专注"], { ctx, rolls: [3, 3, 3, 1, 1, 1] });
    await runtime.runCommand("ta", ["1"], { ctx, rolls: [1, 1, 1, 1, 1, 1] });

    assert.equal(runtime.getInt(ctx, "$g混沌值"), 0);
});

test("三重升华 A 分支会等待数量输入并在完成后清理状态", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext();
    runtime.setInt(ctx, "专注", 5);
    runtime.setInt(ctx, "过载", 0);

    await runtime.runCommand("ta", ["专注"], { ctx, rolls: [3, 3, 3, 1, 1, 1] });
    await runtime.runCommand("tatr", ["a"], { ctx });
    assert.match(runtime.lastReply(), /请输入要增加的“3”的数量/);

    await runtime.runCommand("tatr", ["oops"], { ctx });
    assert.match(runtime.lastReply(), /请输入有效的数字/);

    await runtime.runCommand("tatr", ["2"], { ctx });
    assert.match(runtime.lastReply(), /已确认分支: A/);
    assert.match(runtime.lastReply(), /成功数 \+2 \| 当前: 5/);
    assert.equal(runtime.getInt(ctx, "$g混沌值"), 0);

    await runtime.runCommand("tatr", ["c"], { ctx });
    assert.match(runtime.lastReply(), /当前没有等待处理的三重升华状态/);
});

test("三重升华 B 分支会给出手动调整提示且不计入混沌", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext();
    runtime.setInt(ctx, "专注", 4);
    runtime.setInt(ctx, "过载", 0);

    await runtime.runCommand("ta", ["专注"], { ctx, rolls: [3, 3, 3, 1, 1, 1] });
    await runtime.runCommand("tatr", ["b"], { ctx });

    assert.match(runtime.lastReply(), /已确认分支: B/);
    assert.match(runtime.lastReply(), /请手动调整资质保证/);
    assert.equal(runtime.getInt(ctx, "专注"), 4);
    assert.equal(runtime.getInt(ctx, "$g混沌值"), 0);
});

test("三重升华 C 分支会增加嘉奖并清理状态", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext();
    runtime.setInt(ctx, "专注", 4);
    runtime.setInt(ctx, "嘉奖", 1);
    runtime.setInt(ctx, "过载", 0);

    await runtime.runCommand("ta", ["专注"], { ctx, rolls: [3, 3, 3, 1, 1, 1] });
    await runtime.runCommand("tatr", ["c"], { ctx });

    assert.equal(runtime.getInt(ctx, "嘉奖"), 4);
    assert.equal(runtime.getInt(ctx, "$g混沌值"), 0);
    assert.match(runtime.lastReply(), /已确认分支: C/);
    assert.match(runtime.lastReply(), /嘉奖已发放: 3/);
});

test("taflavor set 与 reset 会影响混沌查看的风味文字", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext();
    runtime.setInt(ctx, "$g混沌值", 7);

    await runtime.runCommand("taflavor", ["set", "chaos_show", "自定义", "混沌:{val}"], { ctx });
    assert.equal(runtime.getString(ctx, "$gTriangleAgency:Flavor:chaos_show"), "自定义 混沌:{val}");

    await runtime.runCommand("tcs", [], { ctx });
    assert.equal(runtime.lastReply(), "自定义 混沌:7");

    await runtime.runCommand("taflavor", ["reset", "chaos_show"], { ctx });
    assert.equal(runtime.getString(ctx, "$gTriangleAgency:Flavor:chaos_show"), "");

    await runtime.runCommand("tcs", [], { ctx });
    assert.equal(runtime.lastReply(), "[ 混沌 ] 当前读数: 7");
});

test("taflavor reset all 会清空多个自定义风味并回退到默认文本", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext();
    runtime.setInt(ctx, "$g混沌值", 3);

    await runtime.runCommand("taflavor", ["set", "chaos_show", "混沌读数:{val}"], { ctx });
    await runtime.runCommand("taflavor", ["set", "card_header", "特工:{name}"], { ctx });

    await runtime.runCommand("taflavor", ["reset", "all"], { ctx });

    assert.equal(runtime.getString(ctx, "$gTriangleAgency:Flavor:chaos_show"), "");
    assert.equal(runtime.getString(ctx, "$gTriangleAgency:Flavor:card_header"), "");

    await runtime.runCommand("tcs", [], { ctx });
    assert.equal(runtime.lastReply(), "[ 混沌 ] 当前读数: 3");

    await runtime.runCommand("tas", [], { ctx });
    assert.match(runtime.lastReply(), /┏TRIANGLE AGENCY┓/);
    assert.match(runtime.lastReply(), /┃ 特工档案: Test Player/);
});

test("tas 会展示角色卡核心属性与状态区", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext({ playerName: "Agent Q" });
    runtime.setInt(ctx, "专注", 2);
    runtime.setInt(ctx, "欺瞒", 1);
    runtime.setInt(ctx, "活力", 3);
    runtime.setInt(ctx, "共情", 4);
    runtime.setInt(ctx, "主动", 5);
    runtime.setInt(ctx, "坚毅", 6);
    runtime.setInt(ctx, "气场", 7);
    runtime.setInt(ctx, "专业", 8);
    runtime.setInt(ctx, "诡秘", 9);
    runtime.setInt(ctx, "过载", 3);
    runtime.setInt(ctx, "嘉奖", 1);
    runtime.setInt(ctx, "申诫", 2);

    await runtime.runCommand("tas", [], { ctx });

    assert.match(runtime.lastReply(), /┃ 特工档案: Agent Q/);
    assert.match(runtime.lastReply(), /专注: 2/);
    assert.match(runtime.lastReply(), /主动: 5/);
    assert.match(runtime.lastReply(), /诡秘: 9/);
    assert.match(runtime.lastReply(), /嘉奖: 1  申诫: 2  额外过载: 3/);
    assert.match(runtime.lastReply(), /指令: \.st \[属性\]\[数值\] 改写数值/);
});

test("tcs 会按正负参数减少或增加混沌", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext();
    runtime.setInt(ctx, "$g混沌值", 4);

    await runtime.runCommand("tcs", [], { ctx });
    assert.equal(runtime.lastReply(), "[ 混沌 ] 当前读数: 4");

    await runtime.runCommand("tcs", ["2"], { ctx });
    assert.equal(runtime.getInt(ctx, "$g混沌值"), 2);
    assert.equal(runtime.lastReply(), "[ 混沌 ] 显化: 2 | 当前: 2");

    await runtime.runCommand("tcs", ["-3"], { ctx });
    assert.equal(runtime.getInt(ctx, "$g混沌值"), 5);
    assert.equal(runtime.lastReply(), "[ 混沌 ] 扭曲加剧! +3 混沌 | 当前: 5");
});

test("tcst 会处理缺参、非法值与直接设定", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext();

    await runtime.runCommand("tcst", [], { ctx });
    assert.match(runtime.lastReply(), /请输入数值/);

    await runtime.runCommand("tcst", ["abc"], { ctx });
    assert.equal(runtime.lastReply(), "[ 混沌 ] 数值无效: abc");

    await runtime.runCommand("tcst", ["6"], { ctx });
    assert.equal(runtime.getInt(ctx, "$g混沌值"), 6);
    assert.equal(runtime.lastReply(), "[ 混沌 ] 指数重置: 6");
});

test("QA 调整超出成功数边界时会保留状态并允许后续继续结算", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext();
    runtime.setInt(ctx, "专注", 3);
    runtime.setInt(ctx, "过载", 0);

    await runtime.runCommand("ta", ["专注"], { ctx, rolls: [3, 1, 1, 1, 1, 1] });
    await runtime.runCommand("taqa", ["6"], { ctx });

    assert.match(runtime.lastReply(), /成功数 必须在 0 到 6 之间/);
    assert.equal(runtime.getInt(ctx, "专注"), 3);
    assert.equal(runtime.getInt(ctx, "$g混沌值"), 0);

    await runtime.runCommand("taqa", ["1"], { ctx });
    assert.equal(runtime.getInt(ctx, "专注"), 2);
    assert.equal(runtime.getInt(ctx, "$g混沌值"), 4);
    assert.match(runtime.lastReply(), /成功/);
});

test("tahelp 会展示完整的速查帮助与进阶提示", async () => {
    const runtime = new TriangleAgencyTestRuntime();
    await runtime.loadPlugin();

    const ctx = runtime.createContext();

    await runtime.runCommand("tahelp", [], { ctx });

    assert.match(runtime.lastReply(), /> \.tcst <数值>  \/\/ 直接设定混沌/);
    assert.match(runtime.lastReply(), /> \.tatr a\/b\/c   \/\/ 升华分支/);
    assert.match(runtime.lastReply(), /> \.taqa <数值>  \/\/ QA调整/);
    assert.match(runtime.lastReply(), /> \.tahelp       \/\/ 速查帮助/);
    assert.match(runtime.lastReply(), /使用 \.help <指令名> 查看特定指令的进阶参数/);
});
