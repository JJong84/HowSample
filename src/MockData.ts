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
            start: 193.6099133268447,
            end: 237.60985289002036,
        },
    },
    {
        speed: 1.27241005081943,
        pitch: 4,
        target: {
            start: 178.5,
            end: 217.3,
        },
        original: {
            start: 202.7712656985844,
            end: 252.14077567037825,
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
        endPoint: 24.567,
    },
];

export { KanYe, OneMoreTime };
