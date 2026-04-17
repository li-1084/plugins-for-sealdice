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
