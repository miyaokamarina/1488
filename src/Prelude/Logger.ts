import { DevtoolsTransport, LevelFilter, Logger, PrefixPreprocessor } from '@ripreact/logger';

export const logger = Logger({
    plugins: [
        LevelFilter({
            level: 'flood',
        }),
        PrefixPreprocessor({
            prefix: ['fuck-anime', 'front'],
        }),
        DevtoolsTransport({
            filterSegments: ({ name }, i, [head]) => {
                switch (name) {
                    case 'fuck-anime':
                        return i > 0;
                    case 'front':
                        return i != 1 || head.name != 'fuck-anime';
                }

                return true;
            },
        }),
    ],
});
