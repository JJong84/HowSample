import { BreakResponse, MockUpSample } from './Type';

const KanYe: BreakResponse = [
    {
        speed: 1.27241005081943,
        pitch: 4,
        target: {
            start: 0.0,
            end: 34.58,
        },
        original: {
            start: 193.41833050417105,
            end: 237.42606032712425,
        },
    },
];

const OneMoreTime: MockUpSample[] = [
    {
        speed: 1,
        pitch: 1,
        startPoint: 20.0,
        endPoint: 20.8,
    },
    {
        speed: 1,
        pitch: 1,
        startPoint: 22.278,
        endPoint: 23.2,
    },
    {
        speed: 1,
        pitch: 1,
        startPoint: 24.089,
        endPoint: 24.5,
    },
];

export { KanYe, OneMoreTime };
