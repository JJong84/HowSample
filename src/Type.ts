import { UUIDTypes } from "uuid";

interface SampleData {
    name: string,
    audioBuffer: AudioBuffer,
    pitch: number,
    speed: number,
    startPoint: number, // cut start
    endPoint: number, // cut end,
    offset?: number, // position in the global buffer
    edited: boolean, // check if source is edited by user or not,
    type: UploadedMusicType,
    id: UUIDTypes
}

// sampled - sampled music to find
// target - music which used sampling
// user - user uploaded source to make music
type UploadedMusicType = "sampled" | "user" | "target"

interface UploadedMusic {
    file: File,
    type: UploadedMusicType
}

interface SampleLine {
    sampleDataId: UUIDTypes,
    startTime: number
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

interface BreakResult {
    source: SampleData;
    offset: number;
}

export type {BreakResult, SampleData, UploadedMusic, UploadedMusicType, SampleLine, Line, WaveformHandle}