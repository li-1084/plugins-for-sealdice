// ==UserScript==
// @name         武经规则
// @author       理水叠山333
// @version      0.3.0
// @description  武经TRPG规则插件。.ujhelp 打开帮助。支持属性投点、角色卡管理、风味文字配置。
// @timestamp    1769011200
// @license      MIT
// @homepageURL  https://github.com/li-1084/plugins-for-sealdice
// ==/UserScript==

// 0.3.0
// 1、重构代码结构，与 TriangleAgency 风格对齐
// 2、统一风味文字系统：getFlavor 三级优先链，key 统一 $gWuJing:Flavor:${key}
// 3、config 注册统一 flavor_${key} 前缀，消除原分类 if-else
// 4、.ujflavor 支持所有 DEFAULT_FLAVOR 键（不限于属性）
// 5、修复 ALIAS_MAP 与模板 alias 字段的不一致
// 6、提取魔法数字为具名常量


/// <reference path="../../shared/seal.d.ts" />

// 扩展信息
const EXT_NAME = "WuJing";
const EXT_AUTHOR = "理水叠山333";
const EXT_VERSION = "0.3.0";

// 属性定义
const ATTR_JINROU = "筋肉";
const ATTR_LINGQIAO = "灵巧";
const ATTR_JIANYI = "坚毅";
const ATTR_WUXING = "悟性";
const ATTR_LIUSHI = "六识";
const ATTR_YUNQI = "运气";
const ATTR_QIZHI = "气质";
const ATTR_GENGU = "根骨等级";

// 投掷参数
const DICE_SIDES = 10;
const SUCCESS_THRESHOLD = 7; // 骰子点数 >= 此值算成功

const ATTRIBUTES = [
    ATTR_JINROU, ATTR_LINGQIAO, ATTR_JIANYI,
    ATTR_WUXING, ATTR_LIUSHI, ATTR_YUNQI, ATTR_QIZHI
];

const ALL_ATTRIBUTES = [...ATTRIBUTES, ATTR_GENGU];

// 属性别名映射（用这里的别名才能触发属性检定流程）
const ALIAS_MAP: Record<string, string> = {
    "筋肉": ATTR_JINROU, "筋": ATTR_JINROU, "jin": ATTR_JINROU,
    "灵巧": ATTR_LINGQIAO, "灵": ATTR_LINGQIAO, "ling": ATTR_LINGQIAO, "lin": ATTR_LINGQIAO,
    "坚毅": ATTR_JIANYI, "坚": ATTR_JIANYI, "jian": ATTR_JIANYI,
    "悟性": ATTR_WUXING, "悟": ATTR_WUXING, "wu": ATTR_WUXING,
    "六识": ATTR_LIUSHI, "六": ATTR_LIUSHI, "识": ATTR_LIUSHI, "liu": ATTR_LIUSHI, "shi": ATTR_LIUSHI,
    "运气": ATTR_YUNQI, "运": ATTR_YUNQI, "yun": ATTR_YUNQI,
    "气质": ATTR_QIZHI, "气": ATTR_QIZHI, "qi": ATTR_QIZHI,
    "根骨等级": ATTR_GENGU, "根骨": ATTR_GENGU, "gengu": ATTR_GENGU,
};

// 默认风味文字配置
// 值中的 {xxx} 是占位符，会被 formatText 替换为实际变量。
// 用户可通过 .ujflavor set <键名> <文字> 覆盖这些默认值。
const DEFAULT_FLAVOR: Record<string, string> = {
    // 属性风味文字
    [ATTR_JINROU]:  "筋骨如铁，力可扛鼎。",
    [ATTR_LINGQIAO]: "身如飞燕，动若脱兔。",
    [ATTR_JIANYI]:  "心如磐石，百折不挠。",
    [ATTR_WUXING]:  "一点即通，触类旁通。",
    [ATTR_LIUSHI]:  "耳聪目明，洞察秋毫。",
    [ATTR_YUNQI]:   "时来运转，天助我也。",
    [ATTR_QIZHI]:   "气宇轩昂，卓尔不群。",

    // 投掷输出模板
    // 模版A: 普通投掷 - 成功
    "roll_normal_success": "{player}\n『 运功 · {diceCount}重 · 成功{successes} 』\n{rolls}\n{flavor}",
    // 模版B: 普通投掷 - 失败
    "roll_normal_fail":    "{player}\n『 运功 · {diceCount}重 · 失败 』\n{rolls}\n{flavor}",
    // 模版C: 属性投掷 - 成功
    "roll_attr_success":   "{player}\n『 {attr} · 成功{successes} 』\n{rolls}\n{flavor}",
    // 模版D: 属性投掷 - 失败
    "roll_attr_fail":      "{player}\n『 {attr} · 失败 』\n{rolls}\n{flavor}",

    // 投掷风味文字
    "flavor_normal_success": "无剑胜有剑。",
    "flavor_normal_fail":    "清风拂山岗。",
    "flavor_attr_fail":      "强极则辱，情深不寿。",

    // 助力投掷模板（.uj 数量+N 或 .uj 属性+N）
    // 占位符：{attr} 属性名, {diceCount} 骰池, {bonus} 助力数, {successes} 总成功数, {rolls} 骰子序列, {flavor} 风味
    "roll_normal_bonus": "{player}\n『 运功 · {diceCount}重 · 助力+{bonus} · 成功{successes} 』\n{rolls}\n{flavor}",
    "roll_attr_bonus":   "{player}\n『 {attr} · 助力+{bonus} · 成功{successes} 』\n{rolls}\n{flavor}",

    // 助力风味文字
    "flavor_bonus": "得道多助，顺势而为。",

    // 骰子结果渲染
    "roll_details_success": "{val}√",
    "roll_details_fail":    "{val}×",

    // 角色卡模板
    "card_header": "┏━━━大庆名帖━━━┓\n┃ 武夫：{name}",
    "card_footer": "┗━━━━━━━━━━┛\n欲改属性，请\n.st 属性 数值",

    // 帮助信息模板
    "help_header": "┏━━━武经v{version}━━━┓",
    "help_body":   "呈递名帖 .ujs\n运功检定 .uj 属性\n风味批注 .ujflavor\n\n提示：支持\n.uj @某人 <属性>",
    "help_footer": "┗━━━━━━━━━━┛",

    // 错误与提示信息
    "err_no_attr":       "[ 错误 ] 未知属性或参数: {arg}",
    "err_unknown_key":   "[ 错误 ] 未知键名：{key}。请使用 list 查看可用键名。",
    "err_zero_dice":     "[ 错误 ] 功力不足，骰数必须大于0",
    "err_proxy_need_arg":"[ 提示 ] 代投请指定属性或数量",
    "err_root_roll":     "[ 提示 ] 根骨等级不可直接用于检定",

    // 风味管理提示
    "flavor_list_header": "当前批注配置 (风味文字)：\n",
    "flavor_updated":     "[ 系统 ] 已将 {key} 的批注修订为: \"{text}\"",
    "flavor_reset":       "[ 系统 ] 已重置 {key} 的批注",
    "flavor_reset_all":   "[ 系统 ] 已重置全部批注为默认值",
    "flavor_missing_val": "> 请输入内容。范例: .ujflavor set 筋肉 力拔山兮",
};


// 获取或注册扩展
let ext = seal.ext.find(EXT_NAME);
if (!ext) {
    ext = seal.ext.new(EXT_NAME, EXT_AUTHOR, EXT_VERSION);
    seal.ext.register(ext);

    // 注册风味文字配置（支持 UI 修改）
    for (const key in DEFAULT_FLAVOR) {
        seal.ext.registerStringConfig(ext, `flavor_${key}`, DEFAULT_FLAVOR[key], `风味文字: ${key}`);
    }
}
console.log(`武经规则插件加载完成 (v${EXT_VERSION})`);


// 注册规则模板（用于 .set wujing）
try {
    const template = {
        name: "WuJing",
        fullName: "武经",
        authors: [EXT_AUTHOR],
        version: EXT_VERSION,
        updatedTime: "20260326",
        templateVer: "1.0",
        attrSettings: {
            top: ALL_ATTRIBUTES,
            sortBy: "name",
            showAs: {}
        },
        setConfig: {
            diceSides: DICE_SIDES,
            keys: ["uj", "WuJing"],
            enableTip: `已切换至武经规则，默认骰子D${DICE_SIDES}`,
            relatedExt: ["WuJing"]
        },
        alias: {
            "筋肉":   ["筋", "jin"],
            "灵巧":   ["灵", "ling", "lin"],
            "坚毅":   ["坚", "jian"],
            "悟性":   ["悟", "wu"],
            "六识":   ["六", "识", "liu", "shi"],
            "运气":   ["运", "yun"],
            "气质":   ["气", "qi"],
            "根骨等级": ["根骨", "gengu"],
        },
        defaults: ALL_ATTRIBUTES.reduce((acc: Record<string, number>, attr) => {
            acc[attr] = 0;
            return acc;
        }, {})
    };
    seal.gameSystem.newTemplate(JSON.stringify(template));
} catch (e) {
    console.error(`无法装载武经规则: ${e}`);
}


// ============================================================================
// 指令：.ujs (角色卡/名帖)
// ============================================================================

const cmdUjs = seal.ext.newCmdItemInfo();
cmdUjs.name = 'ujs';
cmdUjs.allowDelegate = true;
cmdUjs.help = '查看名帖：\n.ujs - 查看自己的名帖\n.ujs @某人 - 查看他人的名帖';
cmdUjs.solve = (ctx, msg, cmdArgs) => {
    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    const targetCtx = mctx ? mctx : ctx;
    const name = targetCtx.player.name;

    // 头部
    let output = formatText(getFlavor(ctx, "card_header"), { name }) + "\n";
    output += "┠──────────┨\n";

    // 7个核心属性，每行3个
    ATTRIBUTES.forEach((attr, index) => {
        const val = seal.vars.intGet(targetCtx, attr)[0];
        output += `${attr}: ${val}`;
        if ((index + 1) % 3 === 0) output += "\n";
        else output += "  ";
    });
    if (ATTRIBUTES.length % 3 !== 0) output += "\n";

    // 根骨等级单独展示
    output += "┠──────────┨\n";
    const genguVal = seal.vars.intGet(targetCtx, ATTR_GENGU)[0];
    output += `${ATTR_GENGU}: ${genguVal}\n`;

    // 尾部
    output += getFlavor(ctx, "card_footer");

    seal.replyToSender(ctx, msg, output);
    return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['ujs'] = cmdUjs;


// ============================================================================
// 指令：.uj (投掷/运功)
// ============================================================================

const cmdUj = seal.ext.newCmdItemInfo();
cmdUj.name = 'uj';
cmdUj.allowDelegate = true;
cmdUj.help = '运功检定:\n.uj <属性> - 使用属性投掷\n.uj <数量> - 指定骰池大小\n.uj <属性|数量>+<助力> - 额外加算成功数 (如 .uj jin+3)\n.uj @某人 <属性> - 代投';
cmdUj.solve = (ctx, msg, cmdArgs) => {
    const ret = seal.ext.newCmdExecuteResult(true);

    // 解析目标用户
    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    const targetCtx = mctx ? mctx : ctx;
    const isProxy = targetCtx !== ctx;

    // 智能参数解析：跳过 @ 提及，找第一个有效参数，记录其位置
    let arg = "";
    let argIdx = -1;
    for (let i = 1; i <= cmdArgs.args.length; i++) {
        const candidate = cmdArgs.getArgN(i);
        if (!candidate) break;
        if (candidate.startsWith("<@") || candidate.startsWith("[CQ:at") || candidate.startsWith("@")) continue;
        arg = candidate;
        argIdx = i;
        break;
    }

    if (!arg) {
        if (isProxy) {
            seal.replyToSender(ctx, msg, getFlavor(ctx, "err_proxy_need_arg"));
            return ret;
        }
        ret.showHelp = true;
        return ret;
    }

    // 解析助力加成，支持三种写法：
    //   紧凑：.uj jin+3  → arg = "jin+3"
    //   分离：.uj jin + 3 → arg = "jin", next = "+", next2 = "3"
    //   半分：.uj jin +3  → arg = "jin", next = "+3"
    let bonus = 0;
    const plusIdx = arg.indexOf('+');
    if (plusIdx !== -1) {
        // 紧凑写法
        const parsedBonus = parseInt(arg.slice(plusIdx + 1));
        if (!isNaN(parsedBonus) && parsedBonus > 0) {
            bonus = parsedBonus;
            arg = arg.slice(0, plusIdx);
        }
    } else {
        // 分离/半分写法：检查紧跟的下一个参数
        const next1 = cmdArgs.getArgN(argIdx + 1);
        if (next1 === "+") {
            // .uj jin + 3
            const parsedBonus = parseInt(cmdArgs.getArgN(argIdx + 2));
            if (!isNaN(parsedBonus) && parsedBonus > 0) bonus = parsedBonus;
        } else if (next1 && next1.startsWith("+")) {
            // .uj jin +3
            const parsedBonus = parseInt(next1.slice(1));
            if (!isNaN(parsedBonus) && parsedBonus > 0) bonus = parsedBonus;
        }
    }

    // 确定骰池与风味文字
    let diceCount = 0;
    let flavorText = "";
    let isAttribute = false;
    let targetAttr = "";

    const parsedCount = parseInt(arg);
    if (!isNaN(parsedCount)) {
        // 数字投掷
        diceCount = parsedCount;
    } else {
        // 属性投掷
        const realAttr = resolveAttribute(arg);
        if (!realAttr) {
            seal.replyToSender(ctx, msg, formatText(getFlavor(ctx, "err_no_attr"), { arg }));
            return ret;
        }
        if (realAttr === ATTR_GENGU) {
            seal.replyToSender(ctx, msg, getFlavor(ctx, "err_root_roll"));
            return ret;
        }
        isAttribute = true;
        targetAttr = realAttr;
        diceCount = seal.vars.intGet(targetCtx, realAttr)[0];
        flavorText = getFlavor(ctx, realAttr);
    }

    if (diceCount <= 0) {
        seal.replyToSender(ctx, msg, getFlavor(ctx, "err_zero_dice"));
        return ret;
    }

    // 核心投掷逻辑
    const rolls: number[] = [];
    let successes = 0;
    for (let i = 0; i < diceCount; i++) {
        const roll = Math.floor(Math.random() * DICE_SIDES) + 1;
        rolls.push(roll);
        if (roll >= SUCCESS_THRESHOLD) successes++;
    }

    // 渲染骰子序列
    const rollsStr = rolls.map(r => {
        const key = r >= SUCCESS_THRESHOLD ? "roll_details_success" : "roll_details_fail";
        return formatText(getFlavor(ctx, key), { val: r });
    }).join(",");

    // 加算助力并确定最终成功数
    successes += bonus;
    const isSuccess = successes > 0;

    // 确定输出模板与风味文字
    let outputKey = "";

    if (bonus > 0) {
        // 助力投掷：使用助力模板，固定显示 flavor_bonus 风味
        outputKey = isAttribute ? "roll_attr_bonus" : "roll_normal_bonus";
        flavorText = getFlavor(ctx, "flavor_bonus");
    } else if (isAttribute) {
        outputKey = isSuccess ? "roll_attr_success" : "roll_attr_fail";
        if (!isSuccess) flavorText = getFlavor(ctx, "flavor_attr_fail");
    } else {
        outputKey = isSuccess ? "roll_normal_success" : "roll_normal_fail";
        flavorText = getFlavor(ctx, isSuccess ? "flavor_normal_success" : "flavor_normal_fail");
    }

    const output = formatText(getFlavor(ctx, outputKey), {
        player: targetCtx.player.name,
        attr: targetAttr,
        diceCount,
        rolls: rollsStr,
        successes,
        bonus,
        flavor: flavorText,
    });

    seal.replyToSender(ctx, msg, output);
    return ret;
};
ext.cmdMap['uj'] = cmdUj;


// ============================================================================
// 指令：.ujflavor (风味/批注管理)
// ============================================================================

const cmdFlavor = seal.ext.newCmdItemInfo();
cmdFlavor.name = 'ujflavor';
cmdFlavor.help = '批注修订 (风味管理)：\n' +
    '.ujflavor list              // 查看所有批注\n' +
    '.ujflavor set <键名> <文字>   // 修订指定批注 (群内有效)\n' +
    '.ujflavor reset <键名>      // 重置指定键为默认\n' +
    '.ujflavor reset all        // 重置全部为默认';
cmdFlavor.solve = (ctx, msg, cmdArgs) => {
    const ret = seal.ext.newCmdExecuteResult(true);
    const op = cmdArgs.getArgN(1);

    if (op === "list" || !op) {
        let output = getFlavor(ctx, "flavor_list_header");
        for (const key in DEFAULT_FLAVOR) {
            output += `${key}: "${getFlavor(ctx, key)}"\n`;
        }
        output += "\n使用 .ujflavor set <键名> <文字> 进行修订";
        seal.replyToSender(ctx, msg, output);

    } else if (op === "set") {
        const key = cmdArgs.getArgN(2);

        if (!DEFAULT_FLAVOR.hasOwnProperty(key)) {
            seal.replyToSender(ctx, msg, formatText(getFlavor(ctx, "err_unknown_key"), { key }));
            return ret;
        }

        // 拼接后续参数，支持带空格的文字
        const parts: string[] = [];
        for (let i = 3; i <= 20; i++) {
            const p = cmdArgs.getArgN(i);
            if (!p) break;
            parts.push(p);
        }
        const val = parts.join(" ");
        if (!val) {
            seal.replyToSender(ctx, msg, getFlavor(ctx, "flavor_missing_val"));
            return ret;
        }

        seal.vars.strSet(ctx, `$gWuJing:Flavor:${key}`, val);
        seal.replyToSender(ctx, msg, formatText(getFlavor(ctx, "flavor_updated"), { key, text: val }));

    } else if (op === "reset") {
        const key = cmdArgs.getArgN(2);
        if (!key) {
            seal.replyToSender(ctx, msg, "请给出有效参数。用法: .ujflavor reset <键名> / .ujflavor reset all");
            return ret;
        }
        if (key === "all") {
            for (const k in DEFAULT_FLAVOR) {
                seal.vars.strSet(ctx, `$gWuJing:Flavor:${k}`, "");
            }
            seal.replyToSender(ctx, msg, getFlavor(ctx, "flavor_reset_all"));
        } else if (DEFAULT_FLAVOR.hasOwnProperty(key)) {
            seal.vars.strSet(ctx, `$gWuJing:Flavor:${key}`, "");
            seal.replyToSender(ctx, msg, formatText(getFlavor(ctx, "flavor_reset"), { key }));
        } else {
            seal.replyToSender(ctx, msg, formatText(getFlavor(ctx, "err_unknown_key"), { key }));
        }
    } else {
        ret.showHelp = true;
    }
    return ret;
};
ext.cmdMap['ujflavor'] = cmdFlavor;


// ============================================================================
// 指令：.ujhelp (帮助)
// ============================================================================

const cmdHelp = seal.ext.newCmdItemInfo();
cmdHelp.name = 'ujhelp';
cmdHelp.help = '查阅武经插件帮助';
cmdHelp.solve = (ctx, msg, cmdArgs) => {
    const output =
        formatText(getFlavor(ctx, "help_header"), { version: EXT_VERSION }) + "\n" +
        getFlavor(ctx, "help_body") + "\n" +
        getFlavor(ctx, "help_footer");
    seal.replyToSender(ctx, msg, output);
    return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['ujhelp'] = cmdHelp;

console.log(`武经指令注册完成: ${Object.keys(ext.cmdMap).join(', ')}`);


// ============================================================================
// 工具函数 (Tools)
// ============================================================================

/**
 * 获取风味文字
 * 优先级: 群内自定义 > 插件配置 > 默认值
 */
function getFlavor(ctx: seal.MsgContext, key: string): string {
    // 1. 群内自定义（.ujflavor set 写入）
    const [custom] = seal.vars.strGet(ctx, `$gWuJing:Flavor:${key}`);
    if (custom) return custom;

    // 2. 插件全局配置（支持 UI 修改）
    const config = seal.ext.getStringConfig(ext, `flavor_${key}`);
    if (config) return config;

    // 3. 代码默认值
    return DEFAULT_FLAVOR[key] ?? key;
}

/**
 * 格式化文本模板
 * 将 {key} 替换为 params[key] 的值，防止 $ 字符引发意外替换
 */
function formatText(template: string, params: Record<string, any>): string {
    if (!template) return "";
    return template.replace(/\{([^}]+)\}/g, (match, key) => {
        return params[key] !== undefined ? String(params[key]) : match;
    });
}

/**
 * 解析属性别名，返回标准属性名；未匹配返回 null
 */
function resolveAttribute(alias: string): string | null {
    if (!alias) return null;
    return ALIAS_MAP[alias] || (ALL_ATTRIBUTES.includes(alias) ? alias : null);
}
