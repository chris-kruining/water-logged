import { build, BuildOptions, BuildResult, Format, PluginBuild } from 'esbuild';

export type Build = { format: Format, start: number, end: number, result: BuildResult };
type BuildReportFunction = (value: (Build | PromiseLike<Build>)) => void;

const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    red: '\x1b[31m',
};
let _call!: (keyof typeof colors);

type Color = { (strings: TemplateStringsArray, ...args: any[]): string  }&{ [K in keyof typeof colors]: Color };

const c: Color = new Proxy(() => {}, {
    get: (target: any, property: string) => {
        if(Object.keys(colors).includes(property) === false)
        {
            throw new Error(c.red`'${property}' is not a valid color!`);
        }

        _call = property as keyof typeof colors;

        return c;
    },
    apply: (target: any, thisArg: any, [ strings, ...args ]: [ strings: TemplateStringsArray, ...args: any[] ]): string => {
        return `${colors[_call]}${strings.flatMap((s, i) => [ s, args[i] ?? '' ]).join('')}${colors.reset}`;
    },
});
const toExtension = (format: Format) => ({ esm: 'mjs', cjs: 'cjs', iife: 'js' }[format]);

export async function compile(formats: Format[], options: Omit<BuildOptions, 'format'>)
{
    let builds: Promise<Build>[] = [];

    const add = (): BuildReportFunction => {
        let done!: BuildReportFunction;

        builds.push(new Promise<Build>(r => done = r));

        if(builds.length === formats.length)
        {
            Promise.all(builds).then(results => {
                builds = [];

                log(results);
            });
        }

        return done;
    };
    const log = (builds: Build[]) => {
        const [ start, end ] = builds
            .reduce(([s, e], { start, end }) => [ Math.min(s, start), Math.max(e, end) ], [ Infinity, 0 ]);
        const results = builds
            .map(({ format, start, end, result }) => {
                const isSuccessful = result.errors.length === 0;
                const color = isSuccessful ? c.green : c.red;
                const icon = isSuccessful ? '✓' : '⚠';

                return color`${icon} '${format}'(${Math.round(end - start)}ms)`;
            })
            .join('\n');

        console.log(c.cyan`🌊 Finished build (${Math.round(end - start)}ms total)\n${results}\n`);
    };

    return Promise.all(formats.map(format => {
        return build({
            ...options,
            format,
            outfile: options.outfile
                ?.replaceAll(/\$formatExtension/g, toExtension(format)).replaceAll(/\$format/g, format),
            outdir: options.outdir
                ?.replaceAll(/\$formatExtension/g, toExtension(format)).replaceAll(/\$format/g, format),

            plugins: [
                ...(options.plugins ?? []),
                {
                    name: 'Logger',

                    setup(build: PluginBuild)
                    {
                        let start: number = 0;
                        let done!: BuildReportFunction;

                        build.onStart(() =>
                        {
                            start = performance.now();

                            done = add();
                        });
                        build.onEnd(result =>
                        {
                            const end = performance.now();

                            done({ format, start, end, result });
                        });
                    },
                },
            ]
        });
    }));
}