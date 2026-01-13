// ==UserScript==
// @name         TA-triangle-agency0.1.0
// @author       小李Lxt
// @version      0.1.1
// @description  三角机构插件，.tahelp 打开帮助指令。特色是投掷后的QA结算功能，以及风味文字功能。过载使用.st存储在玩家属性中。
// @timestamp    1704988800
// @license      MIT
// ==/UserScript==

//0.1.1
//1、更新大部分风味文字，修正逻辑错误的注释。
//2、修复新投掷打断旧投掷时，旧投掷混沌值未结算的问题。
//3、优化三重升华选项A的交互逻辑。


/// <reference path="./seal.d.ts" />

// 属性定义
const ATTR_FOCUS = "专注";
const ATTR_DECEPTION = "欺瞒";
const ATTR_VIGOR = "活力";
const ATTR_EMPATHY = "共情";
const ATTR_INITIATIVE = "主动";
const ATTR_RESOLVE = "坚毅";
const ATTR_PRESENCE = "气场";
const ATTR_PROFESSIONALISM = "专业";
const ATTR_SECRECY = "诡秘";

const ATTR_OVERLOAD = "过载";
const ATTR_COMMENDATION = "嘉奖";
const ATTR_ADMONITION = "申诫";

const VAR_CHAOS = "$g混沌值";

// 默认风味文字配置
// 这是一个键值对对象，存储了插件中所有可配置的文本模板。
// 用户可以通过 .taflavor set <key> <value> 来覆盖这些默认值。
// 值中的 {xxx} 是占位符，会被 formatText 函数替换为实际变量。
const DEFAULT_FLAVOR: Record<string, string> = {
    // 投掷指令 (.ta) 的输出模板
    // "roll_start": "> 正在接入机构OS... 特工 {$t玩家} (d4): [{1d4}]",
    
    // 角色卡 (.tas) 的头部和尾部模板
    "card_header": "┏━━━━ TRIANGLE AGENCY ━━━━┓\n┃ 特工档案: {name}",
    "card_footer": "┗━━━━━━━━━━━━━━━━━━━━━━━━━┛\n> 指令: .st [属性][数值] 改写数值",
    
    // 混沌值管理 (.tcs/.tcst) 的相关提示
    "chaos_show": "[ 混沌 ] 当前读数: {val}",
    "chaos_eliminate": "[ 混沌 ] 显化: {val} | 当前: {current}",
    "chaos_increase": "[ 混沌 ] 扭曲加剧! +{val} 混沌 | 当前: {current}",
    "chaos_set": "[ 系统 ] 混沌指数重置: {val}",
    "chaos_error_param": "[ 错误 ] 参数无效: {val}",
    "chaos_error_val": "[ 错误 ] 数值无效: {val}",
    "chaos_missing_val": "> 请输入数值。范例: .tcst 5",

    // 新版投掷相关 (.ta/.tr) - 12种基础模版
    // 模版A: 非属性-普通
    "ta_normal_no_attr": ">>> 属性检定 // 测试\n[ 序列 ] {rolls}\n[ 状态 ] 成功数: {cntTri} | 拟增加{cntChaos}混沌",
    "tr_normal_no_attr": ">>> 现实干涉 // 测试\n[ 序列 ] {rolls}\n[ 状态 ] 成功数: {cntTri} | 拟增加{cntChaos}混沌",
    
    // 模版B: 非属性-三重升华
    "ta_trine_no_attr": ">>> 属性检定 // ▲ 三重升华 ▲\n[ 序列 ] {rolls}\n[ ! ] 警告: 能量指数异常！\n您的力量很强大... 祝您好运，特工。",
    "tr_trine_no_attr": ">>> 现实干涉 // ▲ 三重升华 ▲\n[ 序列 ] {rolls}\n[ ! ] 警告: 现实边界波动！\n它在注视着你... 非常好运，不是吗？",

    // 模版C: 属性-三重升华提示
    "ta_trine_start": ">>> 属性: {attr} // ▲ 三重升华 ▲\n[ 序列 ] {rolls}\n[ ! ] 力量... 更多的力量正在涌入！！！\n\n[ 分支协议 ]\n> A. 全员协力 (+任意3)\n> B. 稍后再议 (+3 QA)\n> C. 此刻之星 (+3 嘉奖)\n\n> 等待指令: .tatr a/b/c/quit",
    "tr_trine_start": ">>> 协议: 现实改写 // ▲ 三重升华 ▲\n[ 序列 ] {rolls}\n[ ! ] 世界在您的意志下颤抖！！！\n\n[ 分支协议 ]\n> A. 全员协力 (+任意3)\n> B. 稍后再议 (+3 QA)\n> C. 此刻之星 (+3 嘉奖)\n\n> 等待指令: .tatr a/b/c/quit",

    // 模版D: 属性-失败
    "ta_fail": ">>> 属性: {attr} // 判定失败\n{details}\n{status}\n[ 阻滞 ] 现实拒绝了你的干涉。",
    "tr_fail": ">>> 协议: 现实改写 // 失败\n{details}\n{status}\n[ 观测 ] 它冰冷而不可撼动，仿若一座黑色的方尖碑。",

    // 模版E: 属性-稳定成功
    "ta_stable": ">>> 属性: {attr} // 稳定成功\n{details}\n{status}\n[ 稳定 ] 心如止水，无物可扰。",
    "tr_stable": ">>> 协议: 现实改写 // 稳定成功\n{details}\n{status}\n[ 稳定 ] 此情此景反而更像是现实。",

    // 模版F: 属性-成功
    "ta_success": ">>> 属性: {attr} // 成功\n{details}\n{status}\n[ 确认 ] 恭喜你，特工。",
    "tr_success": ">>> 协议: 现实改写 // 成功\n{details}\n{status}\n[ 确认 ] 现实已重构。",
    
    // 模版G: 属性-QA阶段预览
    "ta_qa_start": ">>> 属性: {attr} // QA批准\n[ 状态 ] 成功数: {cntTri} | 新增混沌: {cntChaos}\n{prompt}",
    "tr_qa_start": ">>> 协议: 现实改写 // QA批准\n[ 状态 ] 成功数: {cntTri} | 新增混沌: {cntChaos}\n{prompt}",

    // 通用组件
    "roll_details": "[ 序列 ] {rolls}",
    "status_line": "[ 详情 ] 质保:{val} | 过载:{burn} | 混沌:{chaos}",
    
    // 其他提示
    "qa_prompt": "> 等待QA调整: .taqa <数值> / .taqa quit",
    "qa_error_guarantee": "[ 错误 ] 资质保证不足。无法扣除 {val} (当前{attr}: {current})",
    "qa_quit": "> QA阶段结束。执行结算...",
    "trine_selected": "> 已确认分支: {selection}",
    "trine_option_a_result": "[ 全员协力 ] 支援抵达 | 成功数 +{addCount} | 当前: {newTri}",
    "trine_option_a_large": "[ 全员协力 ] 分部全力响应 | 成功数 +{addCount} | 当前: {newTri}\n[ 警报 ] 天际被巨大的红色三角遮蔽...",
    "trine_option_a_infinite": "[ 全员协力 ] 无限增援协议生效 | 成功数 +{addCount} | 当前: {newTri}\n[ 警报 ] 现实边界正在崩塌...",
    "trine_option_b_result": "[ 稍后重议 ] 指令确认。请手动调整资质保证 (如: .st 专注+3)。",
    "trine_option_c_result": "[ 此刻之星 ] 嘉奖已发放: {commendAmount} 点。",
    "trine_quit": "> 三重升华协议已取消。",
};

/**
 * 全局投掷状态存储 (rollStates)
 * 
 * 1. 存储机制:
 *    - 这是一个内存中的对象 (JavaScript Object)，用于暂存所有进行中的投掷状态。
 *    - 键 (Key): 由 `Group ID` 和 `Player ID` 组合而成 (例如: `QQ-Group:123456:QQ:987654321`)。
 *      这意味着每个玩家在每个群组中只能有一个活跃的投掷状态。
 *    - 值 (Value): 包含当前投掷的所有信息 (骰点结果、成功数、混沌值、当前阶段 step 等)。
 * 
 * 2. 状态失效条件 (Invalidation):
 *    - 发起新投掷: 玩家发送新的 .ta 或 .tr 指令时，旧状态会被直接覆盖 (delete -> new)。
 *      (之前的等待 QA 或 三重升华 状态会立即丢失)
 *    - 结算完成: .taqa quit 或 .tatr 完成后，状态会被清除。
 *    - 插件重载/重启: 由于存储在内存中，插件重载或 Sealdice 重启会导致所有状态丢失。
 *    - 代骰限制: 本系统不支持代骰 (.ta @某人)，因为这会导致 ID 混淆和状态无法正确对应。
 */

/**
 * 投掷状态接口定义
 * 用于描述存储在 rollStates 中的对象结构
 */
interface RollState {
    type: 'ta' | 'tr';
    rolls: number[];
    cntTri: number;
    cntChaos: number;
    cntBurn: number;
    isAttributeRoll: boolean;
    playerAttr: string;
    playerAttrVal: number;
    step: 'init' | 'trine_select' | 'qa_wait';
    overloadIncreased?: boolean;
    waitingForOptionACount?: boolean;
}

// 下方一行代码：投掷状态存储
const rollStates: Record<string, RollState> = {};


// .ta/.tr 指令的属性别名映射(用这里的别名才能触发流程化掷骰)
const ALIAS_MAP = {
    "专注": ATTR_FOCUS, "foc": ATTR_FOCUS,
    "欺瞒": ATTR_DECEPTION, "dec": ATTR_DECEPTION,
    "活力": ATTR_VIGOR, "vig": ATTR_VIGOR,
    "共情": ATTR_EMPATHY, "emp": ATTR_EMPATHY,
    "主动": ATTR_INITIATIVE, "ini": ATTR_INITIATIVE,
    "坚毅": ATTR_RESOLVE, "res": ATTR_RESOLVE,
    "气场": ATTR_PRESENCE, "pre": ATTR_PRESENCE,
    "专业": ATTR_PROFESSIONALISM, "pro": ATTR_PROFESSIONALISM,
    "诡秘": ATTR_SECRECY, "sec": ATTR_SECRECY,
    "过载": ATTR_OVERLOAD, "ove": ATTR_OVERLOAD
};

const ATTRIBUTES = [
    ATTR_FOCUS, ATTR_DECEPTION, ATTR_VIGOR,
    ATTR_EMPATHY, ATTR_INITIATIVE, ATTR_RESOLVE,
    ATTR_PRESENCE, ATTR_PROFESSIONALISM, ATTR_SECRECY
];

const ALL_ATTRIBUTES = [...ATTRIBUTES, ATTR_OVERLOAD, ATTR_COMMENDATION, ATTR_ADMONITION];


    let ext = seal.ext.find('TA-triangle-agency');
    if (!ext) {
        ext = seal.ext.new('TA-triangle-agency', '小李Lxt', '0.1.1');
        seal.ext.register(ext);
        
        // 注册风味文字配置
        for (const key in DEFAULT_FLAVOR) {
             seal.ext.registerStringConfig(ext, `flavor_${key}`, DEFAULT_FLAVOR[key], `风味文字: ${key}`);
        }
    }
    console.log("TA-triangle-agency plugin loading...");


    // 注册三角机构规则模板 (用于 .set ta)
    try {
        const template: any = {
            name: "TriangleAgency",
            fullName: "三角机构",
            authors: ["小李Lxt"],
            version: "0.1.1",
            updatedTime: "20260111",
            templateVer: "1.0",
            attrSettings: {
                top: ALL_ATTRIBUTES,
                sortBy: "name",
                showAs: {}
            },
            setConfig: {
                diceSides: 4,
                keys: ["ta", "TA", "TriangleAgency"],
                enableTip: "已切换至三角机构规则，默认骰子D4",
                relatedExt: ["TriangleAgency"]
            },
            alias: {
                "专注": ["foc"],
                "欺瞒": ["dec"],
                "活力": ["vig"],
                "共情": ["emp"],
                "主动": ["ini"],
                "坚毅": ["res"],
                "气场": ["pre"],
                "专业": ["pro"],
                "诡秘": ["sec"],
                "过载": ["ove"],
                "嘉奖": ["com"],
                "申诫": ["adm"]
            },
            defaults: ALL_ATTRIBUTES.reduce((acc: Record<string, number>, attr) => {
                acc[attr] = 0;
                return acc;
            }, {})
        };
        // 尝试注册 JSON 格式模板
        seal.gameSystem.newTemplate(JSON.stringify(template));
    } catch (e) {
        console.error(`无法装载三角机构规则: ${e}`);
    }

    // ============================================================================
    // 辅助指令 (.tas / .tcs / .tcst)
    // ============================================================================

    // 注册 .tas 指令 (查看角色卡)
    const cmdTas = seal.ext.newCmdItemInfo();
    cmdTas.name = 'tas';
    cmdTas.help = '三角机构角色卡查看:\n.tas - 查看当前角色卡属性\n.tas @某人 - 查看他人角色卡';
    cmdTas.solve = (ctx, msg, cmdArgs) => {
        const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
        const targetCtx = mctx ? mctx : ctx;
        const name = targetCtx.player.name;

        // 获取并格式化头部风味文字
        let output = formatText(getFlavor(ctx, "card_header"), { name: name }) + "\n";
        output += "----------------\n";
        
        // 显示9个固定属性
        output += "【核心属性】\n";
        ATTRIBUTES.forEach((attr, index) => {
            const val = seal.vars.intGet(targetCtx, attr)[0];
            // 获取属性名称
            output += `${attr}: ${val}`;
            // 每行显示3个，美观一点
            if ((index + 1) % 3 === 0) output += "\n";
            else output += "  ";
        });
        if (ATTRIBUTES.length % 3 !== 0) output += "\n";

        // 显示过载
        output += "\n【状态】\n";
        const overload = seal.vars.intGet(targetCtx, ATTR_OVERLOAD)[0];
        const commendation = seal.vars.intGet(targetCtx, ATTR_COMMENDATION)[0];
        const admonition = seal.vars.intGet(targetCtx, ATTR_ADMONITION)[0];
        // 获取过载属性名称
        output += `${ATTR_COMMENDATION}: ${commendation}  ${ATTR_ADMONITION}: ${admonition}  额外${ATTR_OVERLOAD}: ${overload}\n`;

        output += "----------------\n";
        // 获取尾部提示的风味文字
        output += getFlavor(ctx, "card_footer");

        seal.replyToSender(ctx, msg, output);
        return seal.ext.newCmdExecuteResult(true);
    };
    ext.cmdMap['tas'] = cmdTas;

    // 注册 .tcs 指令 (混沌管理)
    const cmdTcs = seal.ext.newCmdItemInfo();
    cmdTcs.name = 'tcs';
    cmdTcs.help = '三角机构混沌管理:\n.tcs - 查看当前混沌值\n.tcs <数值> - 修改混沌值 (正数消除，负数增加)';
    cmdTcs.solve = (ctx, msg, cmdArgs) => {
        const valStr = cmdArgs.getArgN(1);
        
        // 获取当前混沌值
        let currentChaos = seal.vars.intGet(ctx, VAR_CHAOS)[0];

        if (!valStr || valStr === 'show') {
            // 仅查看：使用 chaos_show 模板
            const text = formatText(getFlavor(ctx, "chaos_show"), { val: currentChaos });
            seal.replyToSender(ctx, msg, text);
            return seal.ext.newCmdExecuteResult(true);
        }

        const val = parseInt(valStr);
        if (isNaN(val)) {
             // 参数错误：使用 chaos_error_param 模板
             const text = formatText(getFlavor(ctx, "chaos_error_param"), { val: valStr });
             seal.replyToSender(ctx, msg, text);
             return seal.ext.newCmdExecuteResult(true);
        }

        // 逻辑：正数消除（减少），负数增加（减少负数=增加）
        // 即: new = old - val
        currentChaos -= val;
        
        // 保存新值
        seal.vars.intSet(ctx, VAR_CHAOS, currentChaos);
        
        let absVal = Math.abs(val);
        // 根据操作类型选择不同的风味文字模板 (消除或增加)
        let key = val > 0 ? "chaos_eliminate" : "chaos_increase";
        
        const text = formatText(getFlavor(ctx, key), { val: absVal, current: currentChaos });
        seal.replyToSender(ctx, msg, text);
        return seal.ext.newCmdExecuteResult(true);
    };
    ext.cmdMap['tcs'] = cmdTcs;

    // 注册 .tcst 指令 (设置混沌)
    const cmdTcst = seal.ext.newCmdItemInfo();
    cmdTcst.name = 'tcst';
    cmdTcst.help = '三角机构设置混沌:\n.tcst <数值> - 强制设置混沌值为指定数值';
    cmdTcst.solve = (ctx, msg, cmdArgs) => {
        const valStr = cmdArgs.getArgN(1);
        if (!valStr) {
            // 缺少参数：使用 chaos_missing_val 模板
            const text = getFlavor(ctx, "chaos_missing_val");
            seal.replyToSender(ctx, msg, text);
            return seal.ext.newCmdExecuteResult(true);
        }

        const val = parseInt(valStr);
        if (isNaN(val)) {
             // 数值无效：使用 chaos_error_val 模板
             const text = formatText(getFlavor(ctx, "chaos_error_val"), { val: valStr });
             seal.replyToSender(ctx, msg, text);
             return seal.ext.newCmdExecuteResult(true);
        }

        // 直接设置
        seal.vars.intSet(ctx, VAR_CHAOS, val);
        // 强制设置成功：使用 chaos_set 模板
        const text = formatText(getFlavor(ctx, "chaos_set"), { val: val });
        seal.replyToSender(ctx, msg, text);
        return seal.ext.newCmdExecuteResult(true);
    };
    ext.cmdMap['tcst'] = cmdTcst;

    // ============================================================================
    // 核心投掷逻辑 (.ta / .tr / .tatr / .taqa)
    // ============================================================================

    /*
     * 逻辑流程 (7 阶段):
     * - 阶段 1 (投掷): 所有 .ta/.tr 指令首先投掷 6d4。若非属性投掷，直接判定是否为三重升华 (模版B) 或普通结果 (模版A)，不计入全局混沌，直接结束。
     * - 阶段 2 (过载计算): 若属性 <= 0，归零并过载 +1 (无论后续是否三重升华，过载都会增加)。
     * - 阶段 3 (三重升华判定): 若是属性投掷且 Tri =3，进入选择状态 (模版C)，等待 .tatr。
     * - 阶段 4 (过载应用): 扣除 Tri，增加 Chaos (仅在非三重升华时生效，因三重升华不计混沌)。
     * - 阶段 5 (QA调整): 进入 QA 等待状态，等待 .taqa。调整后进入阶段 6。
     * - 阶段 6 (结果结算): 根据最终 Tri 判定失败 (模版D)、稳定成功 (模版E)、成功 (模版F)。
     * - 阶段 7 (混沌计入): 仅在非三重升华且 Chaos != 3 时，将 Chaos 计入全局。
     * 
     * 12 种风味文字模版:
     * - 非属性: ta_normal_no_attr, tr_normal_no_attr, ta_trine_no_attr, tr_trine_no_attr (A/B 类)
     * - 属性-三重提示: ta_trine_start, tr_trine_start (C 类)
     * - 属性-结算: ta_fail, tr_fail (D 类), ta_stable, tr_stable (E 类), ta_success, tr_success (F 类)
     */

    
    /**
     * 结算混沌值
     * 独立出此函数是为了处理"新投掷打断旧投掷"的情况，确保混沌值不丢失
     */
    function applyChaos(ctx: seal.MsgContext, state: RollState) {
        if (!state) return;

        // 特殊情况：三重升华阶段 (trine_select)
        // 处于三重升华选择阶段时，意味着投掷结果为三重升华（cntTri=3，cntChaos=3）。
        // 此时混沌处于平衡态（或由升华协议处理），因此无论是正常完成还是被打断，都不应计入/累加全局混沌。
        if (state.step === 'trine_select') {
            return;
        }

        const { cntChaos } = state;

        // 鲁棒性检查：确保 cntChaos 是有效数字
        if (typeof cntChaos !== 'number' || isNaN(cntChaos)) {
            console.log(`[TA-Plugin] Warning: Invalid cntChaos detected: ${cntChaos}`);
            return;
        }

        if (cntChaos === 3) {
            // 不计算混沌 (平衡态)
        } else if (cntChaos > 0) {
            // 计入总混沌
            const oldChaos = seal.vars.intGet(ctx, VAR_CHAOS)[0];
            seal.vars.intSet(ctx, VAR_CHAOS, oldChaos + cntChaos);
        }
    }

    /**
     * 阶段6 & 7: 结果结算与混沌计入
     */
    function resolveState(ctx: seal.MsgContext, msg: seal.Message, state: RollState) {
        const { cntTri, cntChaos, cntBurn, rolls, type, playerAttr, isAttributeRoll } = state;
        
        // --- 阶段 6: 结果结算 ---
        let resultKey = "";
        
        if (cntTri <= 0) {
            // 模版D: 失败
            resultKey = `${type}_fail`;
        } else if (cntTri === 3) {
            // 模版E: 稳定成功
            resultKey = `${type}_stable`;
        } else {
            // 模版F: 成功 (1, 2, 4, 5, 6)
            resultKey = `${type}_success`;
        }

        // 构建通用组件
        const rollsStr = renderRolls(rolls, cntBurn);
        const details = formatText(getFlavor(ctx, "roll_details"), { rolls: rollsStr });
        
        const currentAttrVal = playerAttr ? seal.vars.intGet(ctx, playerAttr)[0] : 0;
        let burnStr = cntBurn.toString();
        if (state.overloadIncreased) burnStr += "「已+1」";
        
        const status = formatText(getFlavor(ctx, "status_line"), {
            val: currentAttrVal,
            burn: burnStr,
            chaos: cntChaos === 3 ? "X" : cntChaos
        });

        // 组装最终文本
        const output = formatText(getFlavor(ctx, resultKey), {
            attr: playerAttr,
            details: details,
            status: status
        });

        seal.replyToSender(ctx, msg, output);

        // --- 阶段 7: 混沌计入 ---
        applyChaos(ctx, state);

        // 清空状态
        const key = `${ctx.group.groupId}:${ctx.player.userId}`;
        delete rollStates[key];
    }

    /**
     * 处理 .ta/.tr 投掷逻辑 (阶段 1-5)
     */
    function handleRoll(ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs, type: 'ta' | 'tr') {
        const key = `${ctx.group.groupId}:${ctx.player.userId}`;
        
        // 检查是否存在未完成的投掷状态
        if (rollStates[key]) {
            // 如果存在旧状态（如等待 QA 或 三重升华选择），被新投掷打断。
            // 先尝试结算旧状态的混沌值（视为放弃后续调整，当前数值直接生效）。
            applyChaos(ctx, rollStates[key]);
            delete rollStates[key];
        }

        // --- 阶段 1: 投掷阶段 ---
        let arg = cmdArgs.getArgN(1);
        let isAttributeRoll = false;
        let playerAttr = "";
        let playerAttrVal = 0;

        // 检查是否为属性投掷
        if (arg && (ALIAS_MAP as Record<string, string>)[arg.toLowerCase()]) {
            isAttributeRoll = true;
            playerAttr = (ALIAS_MAP as Record<string, string>)[arg.toLowerCase()];
            playerAttrVal = seal.vars.intGet(ctx, playerAttr)[0];
        }

        // 投掷 6d4
        const rolls = [];
        let cntTri = 0;
        for (let i = 0; i < 6; i++) {
            const r = Math.floor(Math.random() * 4) + 1;
            rolls.push(r);
            if (r === 3) cntTri++;
        }
        let cntChaos = 6 - cntTri;
        let cntBurn = 0;

        // 初始化状态
        const state: RollState = {
            type, rolls, cntTri, cntChaos, cntBurn,
            isAttributeRoll, playerAttr, playerAttrVal,
            step: 'init' as const, overloadIncreased: false
        };
        rollStates[key] = state;

        if (isAttributeRoll) {
            // 若玩家使用指定属性投点

            // --- 阶段 2: 过载计算阶段 (提前执行) ---
            // 规则修正：无论是否达成三重升华，只要属性值 <= 0，都会触发过载增加。
            // 因此必须先进行过载判定，再处理三重升华。
            if (playerAttrVal <= 0) {
                // 属性为负时归零，且过载+1
                seal.vars.intSet(ctx, playerAttr, 0);
                state.playerAttrVal = 0;
                
                const currentOverload = seal.vars.intGet(ctx, ATTR_OVERLOAD)[0];
                seal.vars.intSet(ctx, ATTR_OVERLOAD, currentOverload + 1);
                state.overloadIncreased = true;
            }

            // 获取当前的过载值（用于后续计算）
            cntBurn = seal.vars.intGet(ctx, ATTR_OVERLOAD)[0];
            state.cntBurn = cntBurn;

            // --- 阶段 3: 判断三重升华阶段 ---
            if (cntTri === 3) {
                // 输出模版C: 三重升华提示
                state.step = 'trine_select';
                
                // 注意：这里不需要扣除过载带来的 Tri 减少，因为三重升华是基于原始投掷结果的判定。
                // 即使过载增加了，只要原始有 3 个 3，依然触发三重升华。
                // 但是，过载增加的事实已经发生（上面的代码已执行）。
                
                let output = formatText(getFlavor(ctx, `${type}_trine_start`), {
                    attr: playerAttr,
                    rolls: renderRolls(rolls, 0) // 显示原始骰点
                });
                
                if (state.overloadIncreased) {
                    output += "\n(警告：因资质保证不足，过载等级已+1)";
                }

                seal.replyToSender(ctx, msg, output);
                return seal.ext.newCmdExecuteResult(true);
            }

            // --- 阶段 4: 过载调整应用阶段 (仅在非三重升华时继续执行) ---
            // 如果没达成三重升华，继续正常的 QA 流程
            
            state.cntTri -= cntBurn;
            state.cntChaos += cntBurn;

            // --- 阶段 5: QA调整阶段 ---
            state.step = 'qa_wait';
            
            // 显示 QA 提示
            // 使用模版G: QA阶段预览
            const output = formatText(getFlavor(ctx, `${type}_qa_start`), {
                attr: playerAttr,
                rolls: renderRolls(rolls, cntBurn),
                burn: cntBurn,
                cntTri: state.cntTri,
                cntChaos: state.cntChaos === 3 ? "X" : state.cntChaos,
                prompt: getFlavor(ctx, "qa_prompt")
            });
            
            seal.replyToSender(ctx, msg, output);
            return seal.ext.newCmdExecuteResult(true);

        } else {
            // 若否 (非属性投掷)
            if (cntTri === 3) {
                // 输出模版B: 三重升华播报
                const output = formatText(getFlavor(ctx, `${type}_trine_no_attr`), {
                    rolls: renderRolls(rolls, 0)
                });
                seal.replyToSender(ctx, msg, output);
            } else {
                // 输出模版A: 普通结果
                const output = formatText(getFlavor(ctx, `${type}_normal_no_attr`), {
                    rolls: renderRolls(rolls, 0),
                    cntTri: cntTri,
                    cntChaos: cntChaos
                });
                seal.replyToSender(ctx, msg, output);
            }
            // 不增加整体混沌数量，结束
            delete rollStates[key];
            return seal.ext.newCmdExecuteResult(true);
        }
    }

    // 注册 .ta 指令
    const cmdTa = seal.ext.newCmdItemInfo();
    cmdTa.name = 'ta';
    // 注意：三角机构系统不支持代骰 (如 .ta 专注 @张三)
    // 原因：本系统涉及复杂的多阶段交互流程 (过载计算 -> 三重升华选择 -> QA数值调整 -> 最终结算)。
    // 这些状态存储在全局的 rollStates 中，依赖于 ctx.player.userId 作为键。
    // 如果允许代骰，不仅会导致状态键值混乱 (操作者 vs 被代骰者)，而且后续的 .tatr/.taqa 交互指令无法正确识别是哪位玩家在进行操作。
    // 因此，为了保证逻辑的严密性和流程的完整性，必须禁止代骰行为。
    cmdTa.help = '三角机构投掷:\n.ta <属性> - 进行技能检定\n.ta <数值> - 进行普通投掷（不支持代骰，因本系统涉及复杂的过载/升华/QA流程，代骰将导致逻辑断裂）';
    cmdTa.solve = (ctx, msg, cmdArgs) => handleRoll(ctx, msg, cmdArgs, 'ta');
    ext.cmdMap['ta'] = cmdTa;

    // 注册 .tr 指令
    const cmdTr = seal.ext.newCmdItemInfo();
    cmdTr.name = 'tr';
    // 同上，不支持代骰
    cmdTr.help = '三角机构现实改写:\n.tr <属性> - 进行现实改写\n.tr <数值> - 进行普通现实改写（不支持代骰，因本系统涉及复杂的过载/升华/QA流程，代骰将导致逻辑断裂）';
    cmdTr.solve = (ctx, msg, cmdArgs) => handleRoll(ctx, msg, cmdArgs, 'tr');
    ext.cmdMap['tr'] = cmdTr;

    // 注册 .tatr 指令 (三重升华)
    const cmdTatr = seal.ext.newCmdItemInfo();
    cmdTatr.name = 'tatr';
    cmdTatr.help = '三重升华选择:\n.tatr a/b/c - 选择分支\n.tatr quit - 退出\n(注意：若发起新投掷或插件重载，当前状态将失效)';
    cmdTatr.solve = (ctx, msg, cmdArgs) => {
        const key = `${ctx.group.groupId}:${ctx.player.userId}`;

        const state = rollStates[key];
        
        if (!state || state.step !== 'trine_select') {
            seal.replyToSender(ctx, msg, "当前没有等待处理的三重升华状态。\n(可能是因为发起了新投掷、插件已重载、或状态已过期)");
            return seal.ext.newCmdExecuteResult(true);
        }

        const choice = cmdArgs.getArgN(1).toLowerCase();
        
        if (choice === 'quit') {
            seal.replyToSender(ctx, msg, getFlavor(ctx, "trine_quit"));
            delete rollStates[key];
            return seal.ext.newCmdExecuteResult(true);
        }

        // 处理等待 A 选项数量输入的情况
        if (state.waitingForOptionACount) {
            const count = parseInt(choice);
            if (!isNaN(count) && count > 0) {
                 const output = formatText(getFlavor(ctx, "trine_selected"), { selection: "A" }) + 
                                "\n" + executeTrineOptionA(ctx, state, count);
                 seal.replyToSender(ctx, msg, output);
                 delete rollStates[key];
                 return seal.ext.newCmdExecuteResult(true);
            }
            // 如果不是数字，继续判断是否是切换选项
        }

        if (['a', 'b', 'c'].includes(choice)) {
            // 选择分支
            if (choice === 'a') {
                handleTrineOptionA(ctx, msg, state, cmdArgs, key);
                return seal.ext.newCmdExecuteResult(true);
            }
            
            let output = formatText(getFlavor(ctx, "trine_selected"), { selection: choice.toUpperCase() });
            
            // 执行对应选项逻辑
            if (choice === 'b') {
                output += "\n" + executeTrineOptionB(ctx, state);
            } else if (choice === 'c') {
                output += "\n" + executeTrineOptionC(ctx);
            }
            
            seal.replyToSender(ctx, msg, output);
            
            // 三重升华结束后，不执行任何混沌值的增加或减少操作。
            // 也不调用 resolveState，直接清理状态。
            delete rollStates[key];
        } else {
            if (state.waitingForOptionACount) {
                seal.replyToSender(ctx, msg, "请输入有效的数字，或使用 quit 退出。");
            } else {
                seal.replyToSender(ctx, msg, "无效的选项，请使用 a, b, c 或 quit。");
            }
        }
        return seal.ext.newCmdExecuteResult(true);
    };
    ext.cmdMap['tatr'] = cmdTatr;

    // 注册 .taqa 指令 (QA调整)
    const cmdTaqa = seal.ext.newCmdItemInfo();
    cmdTaqa.name = 'taqa';
    cmdTaqa.help = '三角机构QA调整:\n.taqa <数值> - 调整 成功数 (消耗属性)\n.taqa quit - 结束调整\n(注意：若发起新投掷或插件重载，当前状态将失效)';
    cmdTaqa.solve = (ctx, msg, cmdArgs) => {
        const key = `${ctx.group.groupId}:${ctx.player.userId}`;
        const state = rollStates[key];
        
        if (!state || state.step !== 'qa_wait') {
            seal.replyToSender(ctx, msg, "当前没有等待处理的QA调整状态。\n(可能是因为发起了新投掷、插件已重载、或状态已过期)");
            return seal.ext.newCmdExecuteResult(true);
        }

        const arg = cmdArgs.getArgN(1);
        if (!arg || arg === 'quit') {
            seal.replyToSender(ctx, msg, getFlavor(ctx, "qa_quit"));
            // 进入阶段 6
            resolveState(ctx, msg, state);
            return seal.ext.newCmdExecuteResult(true);
        }

        const n = parseInt(arg);
        if (isNaN(n)) {
            seal.replyToSender(ctx, msg, "请输入有效的数字。");
            return seal.ext.newCmdExecuteResult(true);
        }

        // 检查 成功数 数量边界 (0-6)
        const newTri = state.cntTri + n;
        if (newTri < 0 || newTri > 6) {
            seal.replyToSender(ctx, msg, `调整失败：成功数 必须在 0 到 6 之间 (当前: ${state.cntTri}, 调整后: ${newTri})。`);
            return seal.ext.newCmdExecuteResult(true);
        }

        // 检查资质保证
        const currentAttrVal = seal.vars.intGet(ctx, state.playerAttr)[0];
        if (Math.abs(n) > currentAttrVal) {
            const output = formatText(getFlavor(ctx, "qa_error_guarantee"), {
                val: Math.abs(n),
                attr: state.playerAttr,
                current: currentAttrVal
            });
            seal.replyToSender(ctx, msg, output);
            return seal.ext.newCmdExecuteResult(true);
        }

        // 合法，执行扣除
        seal.vars.intSet(ctx, state.playerAttr, currentAttrVal - Math.abs(n));
        state.cntTri += n;
        state.cntChaos -= n;
        
        // 进入阶段 6
        resolveState(ctx, msg, state);
        return seal.ext.newCmdExecuteResult(true);
    };
    ext.cmdMap['taqa'] = cmdTaqa;

    // ============================================================================
    // 风味文字管理 (.taflavor)
    // ============================================================================

    // 注册 .taflavor 指令 (风味文字管理)
    const cmdTaFlavor = seal.ext.newCmdItemInfo();
    cmdTaFlavor.name = 'taflavor';
    cmdTaFlavor.help = '风味文字管理：\n.taflavor list         // 查看所有风味文字\n.taflavor set <属性> <文字>  // 设置指定属性的风味文字 (群内有效)\n.taflavor reset <属性> // 重置为默认';
    cmdTaFlavor.solve = (ctx, msg, cmdArgs) => {
        const ret = seal.ext.newCmdExecuteResult(true);
        const op = cmdArgs.getArgN(1);
        
        if (op === "list" || op === "") {
            // 列出所有当前生效的风味文字
            let output = "当前风味文字配置：\n";
            for (const key in DEFAULT_FLAVOR) {
                const flavor = getFlavor(ctx, key);
                output += `${key}: “${flavor}”\n`;
            }
            output += "\n使用 .taflavor set <键名> <文字> 进行修改";
            seal.replyToSender(ctx, msg, output);
        } else if (op === "set") {
            const key = cmdArgs.getArgN(2);
            
            // 验证键名是否有效 (必须在默认配置中存在)
            if (!DEFAULT_FLAVOR.hasOwnProperty(key)) {
                 seal.replyToSender(ctx, msg, `未知键名：${key}。请使用 list 查看可用键名。`);
                 return ret;
            }
            
            // 尝试拼接后续参数以支持带空格的文本
            let parts = [];
            for (let i = 3; i <= 20; i++) {
               let p = cmdArgs.getArgN(i);
               if (!p) break;
               parts.push(p);
            }
            const val = parts.join(" "); // 重新组合参数

            if (!val) {
                seal.replyToSender(ctx, msg, "请提供风味文字内容。");
                return ret;
            }
            
            // 保存用户自定义配置到群组变量 ($gTriangleAgency:Flavor:key)
            const customKey = `$gTriangleAgency:Flavor:${key}`;
            seal.vars.strSet(ctx, customKey, val);
            seal.replyToSender(ctx, msg, `已将 ${key} 的风味文字设置为：“${val}”`);
            
        } else if (op === "reset") {
            const key = cmdArgs.getArgN(2);
            if (DEFAULT_FLAVOR.hasOwnProperty(key)) {
                 const customKey = `$gTriangleAgency:Flavor:${key}`;
                 seal.vars.strSet(ctx, customKey, ""); // 清空变量，从而回退到默认值
                 seal.replyToSender(ctx, msg, `已重置 ${key} 的风味文字。`);
            } else {
                 seal.replyToSender(ctx, msg, `未知键名：${key}`);
            }
        } else {
            ret.showHelp = true;
        }
        return ret;
    };
    ext.cmdMap['taflavor'] = cmdTaFlavor;

    // 注册 .tahelp 指令
    const cmdTaHelp = seal.ext.newCmdItemInfo();
    cmdTaHelp.name = 'tahelp';
    cmdTaHelp.help = '三角机构插件帮助指令:\n.tahelp - 显示插件的帮助信息';
    cmdTaHelp.solve = (ctx, msg, cmdArgs) => {
        const helpText = '┏━━━━ TRIANGLE AGENCY OS v0.1.1 ━━━━┓\n' +
            '> 正在接入机构OS...\n' +
            '> 身份验证通过。\n\n' +
            '[ 指令协议 ]\n' +
            '> .set ta       // 装载规则\n' +
            '> .st <属性>    // 档案录入 (支持连续)\n' +
            '> .ta <属性>    // 资质检定\n' +
            '> .tr <属性>    // 现实改写\n' +
            '> .ta/tr <数值> // 测试投掷 (不含流程)\n' +
            '> .tas          // 档案查询\n' +
            '> .tcs          // 混沌管控\n' +
            '> .taflavor     // 终端配置\n\n' +
            '[ ! ] 警告: 本终端不支持代骰代理。\n' +
            '[ i ] 流程: 检定 -> (升华) -> (QA) -> 结算';
            '使用 .help <指令名> 查看特定指令的进阶参数。';
        seal.replyToSender(ctx, msg, helpText);
        return seal.ext.newCmdExecuteResult(true);
    };
    ext.cmdMap['tahelp'] = cmdTaHelp;

    // 注册扩展
    console.log(`TA-triangle-agency commands registered: ${Object.keys(ext.cmdMap).join(', ')}`);


// ============================================================================
// 工具函数 (Tools)
// ============================================================================

/**
 * 渲染骰子结果，处理过载标记 (ø)
 */
function renderRolls(rolls: number[], burnCount: number) {
    let burned = 0;
    const res = rolls.map(r => {
        if (r === 3) {
            if (burned < burnCount) {
                burned++;
                return "3ø";
            }
            return "3√";
        }
        return `${r}x`;
    });
    return res.join(",");
}

/**
 * 获取指定键的风味文字
 * 优先从当前群组的变量中查找（用户自定义），如果未找到则返回默认值。
 * 
 * @param {object} ctx - 上下文对象
 * @param {string} key - 风味文字的键名
 * @returns {string} - 风味文字模板
 */
function getFlavor(ctx: seal.MsgContext, key: string) {
    const customKey = `$gTriangleAgency:Flavor:${key}`;
    const custom = seal.vars.strGet(ctx, customKey)[0];
    if (custom) return custom;
    
    // 检查扩展配置 (支持 UI 修改)
    return seal.ext.getStringConfig(ext, `flavor_${key}`);
}

/**
 * 格式化文本，将模板中的 {key} 替换为 params[key] 的值
 * 采用单次正则替换，防止递归注入和特殊字符($)干扰
 * 
 * @param {string} text - 包含占位符的模板文本
 * @param {object} params - 替换参数对象 {key: value}
 * @returns {string} - 替换后的文本
 */
function formatText(text: string, params: Record<string, any>) {
    if (!text) return "";
    return text.replace(/\{(\w+)\}/g, (match, key) => {
        return (params && params[key] !== undefined) ? params[key] : match;
    });
}

/**
 * 执行三重升华选项A (全员协力): 为本次掷骰增加任意数量的3
 * @param {object} ctx - Sealdice上下文对象
 * @param {object} state - 三重升华状态对象
 * @param {number} addCount - 要增加的3的数量
 * @returns {string} - 执行结果文本
 */
function executeTrineOptionA(ctx: seal.MsgContext, state: RollState, addCount: number) {
    if (addCount <= 0) return "增加数量必须为正整数";
    
    // 计算预测的新成功数（仅用于风味文字显示）
    const newTri = state.cntTri + addCount;

    // 判定无限 (阈值设为100)
    if (addCount >= 100) {
        return formatText(getFlavor(ctx, "trine_option_a_infinite"), {
            addCount: addCount,
            newTri: newTri
        });
    }

    // 判定过大 (超过6)
    if (newTri > 6) {
        return formatText(getFlavor(ctx, "trine_option_a_large"), {
            addCount: addCount,
            newTri: newTri
        });
    }

    // 精细控制 (<=6)
    // 仅返回风味文字，不修改实际状态，纯粹为了剧情表现
    return formatText(getFlavor(ctx, "trine_option_a_result"), {
        addCount: addCount,
        newTri: newTri
    });
}

/**
 * 执行三重升华选项B (稍后重议): 提示玩家手动恢复资质保证
 * @param {object} ctx - Sealdice上下文对象
 * @param {object} state - 三重升华状态对象
 * @returns {string} - 执行结果文本
 */
function executeTrineOptionB(ctx: seal.MsgContext, state: RollState) {
    const replenishAmount = 3;
    // 不执行实际操作，只返回提示
    return formatText(getFlavor(ctx, "trine_option_b_result"), {
        attr: state.playerAttr,
        replenishAmount: replenishAmount
    });
}

/**
 * 执行三重升华选项C (此刻之星): 获得3次嘉奖
 * @param {object} ctx - Sealdice上下文对象
 * @returns {string} - 执行结果文本
 */
function executeTrineOptionC(ctx: seal.MsgContext) {
    const commendAmount = 3;
    const currentCommend = seal.vars.intGet(ctx, ATTR_COMMENDATION)[0];
    seal.vars.intSet(ctx, ATTR_COMMENDATION, currentCommend + commendAmount);
    return formatText(getFlavor(ctx, "trine_option_c_result"), {
        commendAmount: commendAmount
    });
}

/**
 * 处理三重升华选项A的输入逻辑 (解耦工具函数)
 * @param {object} ctx - 上下文
 * @param {object} msg - 消息对象
 * @param {object} state - 当前状态
 * @param {object} args - 指令参数
 * @param {string} key - 状态键
 */
function handleTrineOptionA(ctx: seal.MsgContext, msg: seal.Message, state: RollState, args: seal.CmdArgs, key: string) {
    const arg2 = args.getArgN(2);
    if (arg2) {
        const count = parseInt(arg2);
        if (!isNaN(count) && count > 0) {
            const output = formatText(getFlavor(ctx, "trine_selected"), { selection: "A" }) + 
                           "\n" + executeTrineOptionA(ctx, state, count);
            seal.replyToSender(ctx, msg, output);
            delete rollStates[key];
        } else {
            seal.replyToSender(ctx, msg, "数量无效，请输入正整数。");
        }
    } else {
        state.waitingForOptionACount = true;
        seal.replyToSender(ctx, msg, "> 已选择【全员协力】\n> 请输入要增加的“3”的数量\n> 指令: .tatr <数量>");
    }
}

