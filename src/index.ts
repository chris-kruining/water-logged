import { build, BuildOptions, BuildResult, Format, PluginBuild } from 'esbuild';

export type Build = { format: Format, start: number, end: number, result: BuildResult };
type BuildReportFunction = (value: (Build | PromiseLike<Build>)) => void;

const toExtension = (format: Format) => ({ esm: 'mjs', cjs: 'cjs', iife: 'js' }[format]);

const reset = '\x1b[0m';
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const red = '\x1b[31m';

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
                const color = isSuccessful ? green : red;
                const icon = isSuccessful ? '✓' : '⚠';

                return `${color}${icon} '${format}'(${Math.round(end - start)}ms)${reset}`;
            })
            .join('\n');

        console.log(`${cyan}🌊 Finished build (${Math.round(end - start)}ms total)\n${results}${reset}\n`);
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