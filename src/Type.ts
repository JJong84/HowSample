import { UUIDTypes } from 'uuid';

interface SampleData {
    name: string;
    audioBuffer: AudioBuffer;
    pitch: number;
    speed: number;
    startPoint: number; // cut start
    endPoint: number; // cut end,
    offset?: number; // position in the global buffer
    edited: boolean; // check if source is edited by user or not,
    type: UploadedMusicType;
    id: UUIDTypes;
}

type ColorMap = Record<string, string>; // sampleId, color

// sampled - sampled music to find
// target - music which used sampling
// user - user uploaded source to make music
type UploadedMusicType = 'sampled' | 'user' | 'target' | 'break_result';

interface UploadedMusic {
    file: File;
    type: UploadedMusicType;
}

interface SampleLine {
    sampleDataId: UUIDTypes;
    startTime: number;
}

interface Line {
    sampleLines: SampleLine[];
    id: UUIDTypes;
}

interface WaveformHandle {
    playStop: () => void;
    start: () => AudioBufferSourceNode;
    stop: () => void;
    getNode: () => AudioBufferSourceNode | null | undefined;
}

interface SampleRange {
    start: number;
    end: number;
    sampleId?: UUIDTypes;
}

type BreakResponse = {
    speed: number;
    pitch: number;
    target: SampleRange;
    original: SampleRange;
    sampleId?: UUIDTypes;
}[];

interface MockUpSample {
    pitch: number;
    speed: number;
    startPoint: number;
    endPoint: number;
}

export type {
    SampleRange,
    SampleData,
    UploadedMusic,
    UploadedMusicType,
    SampleLine,
    Line,
    WaveformHandle,
    BreakResponse,
    MockUpSample,
    ColorMap,
};
