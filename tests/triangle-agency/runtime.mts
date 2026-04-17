import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

type CommandResult = {
    solved: boolean;
    showHelp: boolean;
};

type FakeCmdInfo = {
    name: string;
    help: string;
    allowDelegate: boolean;
    disabledInPrivate: boolean;
    solve: (ctx: any, msg: any, cmdArgs: any) => CommandResult;
};

type FakeExtInfo = {
    name: string;
    author: string;
    version: string;
    cmdMap: Record<string, FakeCmdInfo>;
    isLoaded: boolean;
    storageSet: (key: string, value: string) => void;
    storageGet: (key: string) => string;
    onNotCommandReceived: (ctx: any, msg: any) => void;
    onCommandReceived: (ctx: any, msg: any, cmdArgs: any) => void;
    onMessageReceived: (ctx: any, msg: any) => void;
    onMessageSend: (ctx: any, msg: any) => void;
    getDescText: () => string;
    onLoad: (...args: any[]) => void;
    storageInit: () => void;
    storageGetRaw: (key: string) => string;
    storageSetRaw: (key: string, value: string) => void;
};

type CtxOptions = {
    groupId?: string;
    groupName?: string;
    userId?: string;
    playerName?: string;
};

type RunCommandOptions = {
    ctx?: any;
    rolls?: number[];
};

export class TriangleAgencyTestRuntime {
    private registeredExt: FakeExtInfo | null = null;
    private readonly configValues = new Map<string, string>();
    private readonly intValues = new Map<string, number>();
    private readonly strValues = new Map<string, string>();
    private loadCount = 0;

    readonly replies: string[] = [];

    readonly seal = {
        ext: {
            find: (name: string) => {
                if (this.registeredExt && this.registeredExt.name === name) {
                    return this.registeredExt;
                }
                return null;
            },
            new: (name: string, author: string, version: string) => {
                const ext = this.createExtInfo(name, author, version);
                this.registeredExt = ext;
                return ext;
            },
            register: (ext: FakeExtInfo) => {
                this.registeredExt = ext;
            },
            registerStringConfig: (_ext: FakeExtInfo, key: string, value: string) => {
                this.configValues.set(key, value);
            },
            getStringConfig: (_ext: FakeExtInfo, key: string) => {
                return this.configValues.get(key) ?? "";
            },
            newCmdItemInfo: (): FakeCmdInfo => {
                return {
                    name: "",
                    help: "",
                    allowDelegate: false,
                    disabledInPrivate: false,
                    solve: () => ({ solved: true, showHelp: false })
                };
            },
            newCmdExecuteResult: (solved: boolean): CommandResult => {
                return { solved, showHelp: false };
            }
        },
        gameSystem: {
            newTemplate: (_template: string) => {}
        },
        vars: {
            intGet: (ctx: any, key: string): [number, boolean] => {
                const scopeKey = this.makeVarKey(ctx, key);
                return [this.intValues.get(scopeKey) ?? 0, this.intValues.has(scopeKey)];
            },
            intSet: (ctx: any, key: string, value: number) => {
                const scopeKey = this.makeVarKey(ctx, key);
                this.intValues.set(scopeKey, value);
            },
            strGet: (ctx: any, key: string): [string, boolean] => {
                const scopeKey = this.makeVarKey(ctx, key);
                return [this.strValues.get(scopeKey) ?? "", this.strValues.has(scopeKey)];
            },
            strSet: (ctx: any, key: string, value: string) => {
                const scopeKey = this.makeVarKey(ctx, key);
                this.strValues.set(scopeKey, value);
            }
        },
        replyToSender: (_ctx: any, _msg: any, text: string) => {
            this.replies.push(text);
        },
        getCtxProxyFirst: (_ctx: any, _cmdArgs: any) => {
            return null;
        }
    };

    async loadPlugin() {
        (globalThis as any).seal = this.seal;
        const pluginSourceUrl = new URL("../../triangle-agency/triangle-agency.ts", import.meta.url);
        const source = await readFile(pluginSourceUrl, "utf8");
        const tempDir = await mkdtemp(join(tmpdir(), "triangle-agency-test-"));
        const tempFile = join(tempDir, `triangle-agency-${this.loadCount++}.ts`);
        await writeFile(tempFile, source, "utf8");
        const originalLog = console.log;
        const originalError = console.error;

        console.log = () => {};
        console.error = () => {};

        try {
            await import(pathToFileURL(tempFile).href);
        } finally {
            console.log = originalLog;
            console.error = originalError;
        }

        if (!this.registeredExt) {
            throw new Error("TriangleAgency plugin did not register successfully.");
        }

        return this.registeredExt;
    }

    createContext(options: CtxOptions = {}) {
        const groupId = options.groupId ?? "test-group";
        const groupName = options.groupName ?? "Test Group";
        const userId = options.userId ?? "test-user";
        const playerName = options.playerName ?? "Test Player";

        return {
            endPoint: {
                id: "endpoint-1",
                nickname: "Dice",
                state: 1,
                userId: "dice-user",
                cmdExecutedNum: 0,
                cmdExecutedLastTime: 0,
                platform: "test",
                enable: true
            },
            group: {
                active: true,
                groupId,
                groupName,
                cocRuleIndex: 0,
                logCurName: "",
                logOn: false,
                showGroupWelcome: false,
                groupWelcomeMessage: "",
                recentCommandTime: 0,
                enteredTime: 0,
                inviteUserId: ""
            },
            player: {
                name: playerName,
                userId,
                lastCommandTime: 0,
                autoSetNameTemplate: ""
            },
            isCurGroupBotOn: true,
            isPrivate: false,
            privilegeLevel: 100,
            delegateText: "",
            notice: (_text: string) => {}
        };
    }

    createMessage(ctx: any, text: string) {
        return {
            platform: "test",
            message: text,
            time: Date.now(),
            messageType: "group" as const,
            groupId: ctx.group.groupId,
            guildId: "",
            sender: {
                nickname: ctx.player.name,
                userId: ctx.player.userId
            },
            rawId: `raw-${Date.now()}`
        };
    }

    createCmdArgs(command: string, args: string[]) {
        return {
            command,
            args,
            kwargs: [],
            at: [],
            rawArgs: args.join(" "),
            amIBeMentioned: false,
            amIBeMentionedFirst: false,
            cleanArgs: args.join(" "),
            getKwarg: (_key: string) => ({
                name: "",
                valueExists: false,
                value: "",
                asBool: false
            }),
            getArgN: (n: number) => args[n - 1] ?? "",
            chopPrefixToArgsWith: (..._prefixes: string[]) => false,
            eatPrefixWith: (..._prefixes: string[]) => ["", false] as [string, boolean],
            getRestArgsFrom: (n: number) => args.slice(n - 1).join(" "),
            isArgEqual: (n: number, ...values: string[]) => values.includes(args[n - 1] ?? "")
        };
    }

    setInt(ctx: any, key: string, value: number) {
        this.seal.vars.intSet(ctx, key, value);
    }

    getInt(ctx: any, key: string) {
        return this.seal.vars.intGet(ctx, key)[0];
    }

    setString(ctx: any, key: string, value: string) {
        this.seal.vars.strSet(ctx, key, value);
    }

    getString(ctx: any, key: string) {
        return this.seal.vars.strGet(ctx, key)[0];
    }

    lastReply() {
        return this.replies.at(-1) ?? "";
    }

    replyCount() {
        return this.replies.length;
    }

    async runCommand(commandName: string, args: string[], options: RunCommandOptions = {}) {
        const ext = this.registeredExt ?? (await this.loadPlugin());
        const cmd = ext.cmdMap[commandName];
        if (!cmd) {
            throw new Error(`Command not found: ${commandName}`);
        }

        const ctx = options.ctx ?? this.createContext();
        const msg = this.createMessage(ctx, `.${commandName} ${args.join(" ")}`.trim());
        const cmdArgs = this.createCmdArgs(commandName, args);

        return this.withMockedD4Rolls(options.rolls, () => cmd.solve(ctx, msg, cmdArgs));
    }

    private createExtInfo(name: string, author: string, version: string): FakeExtInfo {
        const storage = new Map<string, string>();

        return {
            name,
            author,
            version,
            cmdMap: {},
            isLoaded: true,
            storageSet: (key: string, value: string) => {
                storage.set(key, value);
            },
            storageGet: (key: string) => {
                return storage.get(key) ?? "";
            },
            onNotCommandReceived: () => {},
            onCommandReceived: () => {},
            onMessageReceived: () => {},
            onMessageSend: () => {},
            getDescText: () => "",
            onLoad: () => {},
            storageInit: () => {},
            storageGetRaw: (key: string) => {
                return storage.get(key) ?? "";
            },
            storageSetRaw: (key: string, value: string) => {
                storage.set(key, value);
            }
        };
    }

    private withMockedD4Rolls<T>(rolls: number[] | undefined, fn: () => T): T {
        if (!rolls) {
            return fn();
        }

        const queue = [...rolls];
        const originalRandom = Math.random;

        Math.random = () => {
            const next = queue.shift();
            if (next === undefined) {
                throw new Error("No mocked d4 roll remaining.");
            }
            if (next < 1 || next > 4) {
                throw new Error(`Invalid d4 roll: ${next}`);
            }
            return ((next - 1) + 0.01) / 4;
        };

        try {
            const result = fn();
            if (queue.length > 0) {
                throw new Error(`Unused mocked d4 rolls: ${queue.join(",")}`);
            }
            return result;
        } finally {
            Math.random = originalRandom;
        }
    }

    private makeVarKey(ctx: any, key: string) {
        if (key.startsWith("$g")) {
            return `group:${ctx.group.groupId}:${key}`;
        }
        return `player:${ctx.group.groupId}:${ctx.player.userId}:${key}`;
    }
}
