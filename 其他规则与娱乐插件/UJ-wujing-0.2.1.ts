// ==UserScript==
// @name         武经规则
// @author       理水叠山33
// @version      0.2.1
// @description  武经TRPG规则插件。支持属性投点、角色卡管理、风味文字等功能。
// @timestamp    1768288800
// @license      MIT
// @homepageURL  暂无
// ==/UserScript==

// 0.2.0:
// - 代码全面修缮：引入 seal.d.ts 类型定义，提升稳定性
// - 优化配置注册逻辑，修复热重载问题
// - 辅助函数与指令逻辑优化
// - 精简指令系统，移除 .ujgm，重构核心逻辑
// - 更新默认风味文字
// 0.1.1: 
// - 修正规则模板名称大小写
// - 风味文字系统增强
// - 投点指令优化

/// <reference path="./seal.d.ts" />

// ============================================================================
// 常量定义 (Constants)
// ============================================================================

// 扩展信息
const EXT_NAME = "WuJing";
const EXT_AUTHOR = "理水叠山33";
const EXT_VERSION = "0.2.1";

// 属性定义
const ATTR_MUSCLE = "筋肉";
const ATTR_DEX = "灵巧";
const ATTR_FORT = "坚毅";
const ATTR_INSIGHT = "悟性";
const ATTR_SENSES = "六识";
const ATTR_LUCK = "运气";
const ATTR_CHARISMA = "气质";

const ATTRIBUTES = [
  ATTR_MUSCLE,
  ATTR_DEX,
  ATTR_FORT,
  ATTR_INSIGHT,
  ATTR_SENSES,
  ATTR_LUCK,
  ATTR_CHARISMA
];

// 属性别名映射
const ALIAS_MAP: Record<string, string> = {
  "筋肉": ATTR_MUSCLE, "筋": ATTR_MUSCLE, "jin": ATTR_MUSCLE,
  "灵巧": ATTR_DEX, "灵": ATTR_DEX, "ling": ATTR_DEX, "lin": ATTR_DEX,
  "坚毅": ATTR_FORT, "坚": ATTR_FORT, "jian": ATTR_FORT,
  "悟性": ATTR_INSIGHT, "悟": ATTR_INSIGHT, "wu": ATTR_INSIGHT,
  "六识": ATTR_SENSES, "六": ATTR_SENSES, "识": ATTR_SENSES, "liu": ATTR_SENSES, "shi": ATTR_SENSES,
  "运气": ATTR_LUCK, "运": ATTR_LUCK, "yun": ATTR_LUCK,
  "气质": ATTR_CHARISMA, "气": ATTR_CHARISMA, "qi": ATTR_CHARISMA
};

// ============================================================================
// 风味文字配置 (Flavor Text)
// ============================================================================

// 这是一个键值对对象，存储了插件中所有可配置的文本模板。
// 用户可以通过 .ujflavor set <key> <value> 来覆盖这些默认值。
const DEFAULT_FLAVOR: Record<string, string> = {
  [ATTR_MUSCLE]: "“筋骨如铁，力可扛鼎”",
  [ATTR_DEX]: "“身如飞燕，动若脱兔”",
  [ATTR_FORT]: "“心如磐石，百折不挠”",
  [ATTR_INSIGHT]: "“一点即通，触类旁通”",
  [ATTR_SENSES]: "“耳聪目明，洞察秋毫”",
  [ATTR_LUCK]: "“时来运转，天助我也”",
  [ATTR_CHARISMA]: "“气宇轩昂，卓尔不群”",

  // 投掷输出模板 (武侠小说风格，适配13字窄屏)
  // 模版A: 普通投掷
  "roll_normal": "『 运功 · {diceCount}重 』\n{rolls}\n战果：成功 {successes}",

  // 模版B: 属性投掷
  "roll_attr": "『 {attr} · 成功{successes} 』\n{rolls}\n{flavor}",

  // 模版C: 代骰提示
  "roll_proxy_start": "正查阅 {name} 的卷宗...",

  // 角色卡模板 (窄屏古籍风格)
  "card_header": "┏━━ 大庆名帖 ━━┓\n┃ 武夫：{name}",
  "card_footer": "┗━━━━━━━━━━┛\n欲改属性，请\n.st 属性 数值",

  // 帮助信息模板
  "help_header": "┏━ 武经 v{version} ━┓",
  "help_footer": "┗━━━━━━━━━━┛",
  "help_body": "呈递名帖 .ujs\n运功检定 .uj 属性\n风味批注 .ujflavor\n\n提示：支持\n.uj @某人 <属性>",

  // 错误与提示信息
  "err_no_attr": "[ 错误 ] 未知属性或参数: {arg}",
  "err_zero_dice": "[ 错误 ] 功力不足，骰数必须大于0",
  "err_proxy_need_arg": "[ 提示 ] 代投请指定属性或数量",

  // 风味管理提示
  "flavor_list_header": "当前批注配置 (风味文字)：\n",
  "flavor_updated": "[ 系统 ] 已将 {attr} 的批注修订为: “{text}”",
  "flavor_reset": "[ 系统 ] 已重置 {attr} 的批注",
  "flavor_missing_val": "> 请输入内容。范例: .ujflavor set 筋肉 力拔山兮",

  // 通用组件
  "roll_details_success": "{val}√",
  "roll_details_fail": "{val}×"
};

// ============================================================================
// 扩展注册 (Registration)
// ============================================================================

// 游戏规则模板
const GAME_TEMPLATE = {
  name: "WuJing",
  fullName: "武经",
  authors: [EXT_AUTHOR],
  version: EXT_VERSION,
  updatedTime: "20260113",
  templateVer: "1.0",
  attrSettings: {
    top: ATTRIBUTES,
    sortBy: "name",
    showAs: {}
  },
  setConfig: {
    diceSides: 10,
    keys: ["uj", "WuJing"],
    enableTip: "已切换至武经规则，默认骰子D10",
    relatedExt: ["WuJing"]
  },
  alias: {
    "筋肉": ["肌", "jin"],
    "灵巧": ["灵", "ling", "lin"],
    "坚毅": ["坚", "jian"],
    "悟性": ["悟", "wu"],
    "六识": ["六", "识", "liu", "shi"],
    "运气": ["运", "yun"],
    "气质": ["气", "qi"]
  },
  default: {
    [ATTR_MUSCLE]: 0,
    [ATTR_DEX]: 0,
    [ATTR_FORT]: 0,
    [ATTR_INSIGHT]: 0,
    [ATTR_SENSES]: 0,
    [ATTR_LUCK]: 0,
    [ATTR_CHARISMA]: 0
  }
};

// 注册规则模板
try {
  seal.gameSystem.newTemplate(JSON.stringify(GAME_TEMPLATE));
} catch (e) {
  console.error(`无法装载武经规则: ${e}`);
}

// 获取或注册扩展
let ext = seal.ext.find(EXT_NAME);
if (!ext) {
  ext = seal.ext.new(EXT_NAME, EXT_AUTHOR, EXT_VERSION);
  seal.ext.register(ext);
} else {
  // 热重载支持
  ext.version = EXT_VERSION;
  ext.author = EXT_AUTHOR;
}

// 注册风味文字配置
for (const key in DEFAULT_FLAVOR) {
  let configKey = "";
  let desc = "";

  if (ATTRIBUTES.includes(key)) {
    configKey = `WuJing:Flavor:${key}`;
    desc = `${key}属性的批注`;
  } else if (key.startsWith("help_")) {
    configKey = `WuJing:Help:${key}`;
    desc = `帮助模板: ${key}`;
  } else {
    configKey = `WuJing:Template:${key}`;
    desc = `输出模板: ${key}`;
  }

  seal.ext.registerStringConfig(ext, configKey, DEFAULT_FLAVOR[key], desc);
}

console.log("武经规则插件加载完成 (v" + EXT_VERSION + ")");

// ============================================================================
// 指令：.ujs (角色卡/名帖)
// ============================================================================
const cmdUjs = seal.ext.newCmdItemInfo();
cmdUjs.name = "ujs";
cmdUjs.allowDelegate = true;
cmdUjs.help = "查看名帖：\n.ujs         // 查看自己的名帖\n.ujs @某人   // 查看他人的名帖";

cmdUjs.solve = (ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs) => {
  const ret = seal.ext.newCmdExecuteResult(true);
  const targetCtx = getTargetUser(ctx, cmdArgs);
  const name = targetCtx.player.name;

  // 1. 头部
  let output = formatText(getFlavor(ctx, "card_header"), { name }) + "\n";
  output += "┠────────┨\n";

  // 2. 属性列表 (紧凑双列排版，适配13字宽)
  // 每行两个属性，中间用空格隔开
  // 格式：属性 50  属性 50
  // 属性名(2) + 空格(1) + 数值(2-3) + 空格(2) + 属性名(2) + 空格(1) + 数值(2-3)
  // 约 13-14 字符，即 6.5-7 中文宽，完全没问题

  ATTRIBUTES.forEach((attr, index) => {
    const val = getAttribute(targetCtx, attr);
    // 补齐数值宽度，确保对齐
    const valStr = val.toString().padEnd(3, " ");

    // 构建单个属性块 "筋肉 50 "
    output += `${attr} ${valStr}`;

    // 偶数个换行，奇数个加间隔
    if ((index + 1) % 2 === 0) {
      output += "\n";
    } else {
      output += " "; // 中间空1格
    }
  });

  // 如果总数是奇数，最后补一个换行
  if (ATTRIBUTES.length % 2 !== 0) output += "\n";

  // 3. 尾部
  output += formatText(getFlavor(ctx, "card_footer"), {});

  seal.replyToSender(ctx, msg, output);
  return ret;
};
ext.cmdMap["ujs"] = cmdUjs;


// ============================================================================
// 指令：.uj (投掷/运功)
// ============================================================================
const cmdUj = seal.ext.newCmdItemInfo();
cmdUj.name = "uj";
cmdUj.help = "运功检定: .uj <数量> | .uj <属性> | .uj @某人 <属性>";
cmdUj.allowDelegate = true;

cmdUj.solve = (ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs) => {
  const ret = seal.ext.newCmdExecuteResult(true);

  // 1. 解析目标用户
  const targetCtx = getTargetUser(ctx, cmdArgs);
  const isProxy = targetCtx !== ctx;

  let diceCount = 0;
  let flavorText = "";
  let isAttribute = false;
  let targetAttr = "";

  // 2. 智能参数解析
  let arg = "";
  const argsCount = cmdArgs.args.length;

  for (let i = 0; i < argsCount; i++) {
    const candidate = cmdArgs.getArgN(i + 1);
    if (!candidate) continue;
    // 跳过 @提及
    if (candidate.startsWith("<@") || candidate.startsWith("[CQ:at") || candidate.startsWith("@")) continue;

    // 匹配数字或属性
    const num = parseInt(candidate);
    if (!isNaN(num)) {
      arg = candidate;
      break;
    }
    if (ATTRIBUTES.includes(candidate) || resolveAttribute(candidate)) {
      arg = candidate;
      break;
    }
  }

  // 3. 参数校验
  if (!arg) {
    if (isProxy) {
      seal.replyToSender(ctx, msg, getFlavor(ctx, "err_proxy_need_arg"));
      return ret;
    }
    ret.showHelp = true;
    return ret;
  }

  // 4. 确定骰池
  const parsedCount = parseInt(arg);
  if (!isNaN(parsedCount)) {
    diceCount = parsedCount;
  } else {
    const realAttr = resolveAttribute(arg);
    if (realAttr) {
      isAttribute = true;
      targetAttr = realAttr;
      diceCount = getAttribute(targetCtx, realAttr);
      flavorText = getFlavor(targetCtx, realAttr);
    } else {
      const errText = formatText(getFlavor(ctx, "err_no_attr"), { arg });
      seal.replyToSender(ctx, msg, errText);
      return ret;
    }
  }

  if (diceCount <= 0) {
    seal.replyToSender(ctx, msg, getFlavor(ctx, "err_zero_dice"));
    return ret;
  }

  // 5. 核心投掷逻辑 (D10)
  const rolls: number[] = [];
  let successes = 0;
  for (let i = 0; i < diceCount; i++) {
    const roll = Math.floor(Math.random() * 10) + 1;
    rolls.push(roll);
    if (roll >= 7) successes++;
  }

  // 6. 构建输出
  // 如果是代骰，先输出提示
  if (isProxy) {
    const proxyMsg = formatText(getFlavor(ctx, "roll_proxy_start"), { name: targetCtx.player.name });
    seal.replyToSender(ctx, msg, proxyMsg);
  }

  // 渲染骰子序列
  const rollsStr = rolls.map(r => {
    const key = r >= 7 ? "roll_details_success" : "roll_details_fail";
    return formatText(getFlavor(ctx, key), { val: r });
  }).join(",");

  let outputKey = isAttribute ? "roll_attr" : "roll_normal";
  let output = formatText(getFlavor(ctx, outputKey), {
    attr: targetAttr,
    diceCount: diceCount,
    rolls: rollsStr,
    successes: successes,
    flavor: flavorText
  });

  seal.replyToSender(ctx, msg, output);
  return ret;
};
ext.cmdMap["uj"] = cmdUj;


// ============================================================================
// 指令：.ujflavor (风味/批注管理)
// ============================================================================
const cmdFlavor = seal.ext.newCmdItemInfo();
cmdFlavor.name = "ujflavor";
cmdFlavor.help = `批注修订 (风味管理)：
.ujflavor list         // 查看所有批注
.ujflavor set <属性> <文字>  // 修订指定属性的批注
.ujflavor reset <属性|all> // 重置指定或所有批注`;

cmdFlavor.solve = (ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs) => {
  const ret = seal.ext.newCmdExecuteResult(true);
  const op = cmdArgs.getArgN(1);

  if (op === "list" || op === "") {
    let output = getFlavor(ctx, "flavor_list_header");
    for (const attr of ATTRIBUTES) {
      const flavor = getFlavor(ctx, attr);
      output += `> ${attr}: “${flavor}”\n`;
    }
    output += "\n使用 .ujflavor set <属性> <文字> 进行修订";
    seal.replyToSender(ctx, msg, output);

  } else if (op === "set") {
    const attr = cmdArgs.getArgN(2);

    if (!ATTRIBUTES.includes(attr)) {
      const errText = formatText(getFlavor(ctx, "err_no_attr"), { arg: attr });
      seal.replyToSender(ctx, msg, errText);
      return ret;
    }

    const val = cmdArgs.getRestArgsFrom(3);
    if (!val) {
      seal.replyToSender(ctx, msg, getFlavor(ctx, "flavor_missing_val"));
      return ret;
    }

    const key = `$gWuJing:Flavor:${attr}`;
    seal.vars.strSet(ctx, key, val);

    const output = formatText(getFlavor(ctx, "flavor_updated"), { attr, text: val });
    seal.replyToSender(ctx, msg, output);

  } else if (op === "reset") {
    const attr = cmdArgs.getArgN(2);
    
    if (attr === "all") {
        // 重置所有属性的风味文字
        for (const a of ATTRIBUTES) {
            const key = `$gWuJing:Flavor:${a}`;
            seal.vars.strSet(ctx, key, "");
        }
        seal.replyToSender(ctx, msg, "[ 系统 ] 已重置所有属性的批注");
        
    } else if (ATTRIBUTES.includes(attr)) {
      const key = `$gWuJing:Flavor:${attr}`;
      seal.vars.strSet(ctx, key, "");

      const output = formatText(getFlavor(ctx, "flavor_reset"), { attr });
      seal.replyToSender(ctx, msg, output);
    } else {
      const errText = formatText(getFlavor(ctx, "err_no_attr"), { arg: attr });
      seal.replyToSender(ctx, msg, errText);
    }
  } else {
    ret.showHelp = true;
  }
  return ret;
};
ext.cmdMap["ujflavor"] = cmdFlavor;


// ============================================================================
// 指令：.ujhelp (帮助)
// ============================================================================
const cmdHelp = seal.ext.newCmdItemInfo();
cmdHelp.name = "ujhelp";
cmdHelp.help = "查阅武经插件帮助";
cmdHelp.solve = (ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs) => {
  const ret = seal.ext.newCmdExecuteResult(true);
  let output = formatText(getFlavor(ctx, "help_header"), { version: EXT_VERSION }) + "\n";
  output += getFlavor(ctx, "help_body") + "\n";
  output += getFlavor(ctx, "help_footer");

  seal.replyToSender(ctx, msg, output);
  return ret;
};
ext.cmdMap["ujhelp"] = cmdHelp;


// ============================================================================
// 工具函数 (Tools)
// ============================================================================

/** 
 * 格式化文本模板 
 * 将 {key} 替换为 params[key] 的值
 */
function formatText(template: string, params: Record<string, any>): string {
  if (!template) return "";
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}

/** 
 * 获取风味文字
 * 优先级: 群内自定义 > 插件全局配置 > 默认值 
 */
function getFlavor(ctx: seal.MsgContext, key: string): string {
  // 1. 优先尝试群内自定义
  const customKey = `$gWuJing:${key}`;
  const [customValue, exists] = seal.vars.strGet(ctx, customKey);
  if (exists && customValue) return customValue;

  // 2. 尝试从插件全局配置获取
  let configKey = "";
  if (ATTRIBUTES.includes(key)) {
    configKey = `WuJing:Flavor:${key}`;
  } else if (key.startsWith("help_")) {
    configKey = `WuJing:Help:${key}`;
  } else {
    configKey = `WuJing:Template:${key}`;
  }

  const configValue = seal.ext.getStringConfig(ext, configKey);
  if (configValue) return configValue;

  // 3. 回退到默认值
  return DEFAULT_FLAVOR[key] || key;
}

/** 
 * 获取目标用户上下文
 * 支持 .uj @某人 的代骰情况
 */
function getTargetUser(context: seal.MsgContext, commandArguments: seal.CmdArgs): seal.MsgContext {
  const mctx = seal.getCtxProxyFirst(context, commandArguments);
  return mctx ? mctx : context;
}

/** 
 * 获取属性值 
 */
function getAttribute(context: seal.MsgContext, attribute: string): number {
  const [val, _] = seal.vars.intGet(context, attribute);
  return val;
}

/** 
 * 解析属性别名
 */
function resolveAttribute(alias: string): string | null {
  if (!alias) return null;
  return ALIAS_MAP[alias] || (ATTRIBUTES.includes(alias) ? alias : null);
}
