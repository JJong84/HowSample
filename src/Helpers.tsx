import { v4 } from 'uuid';
import { SampleData, UploadedMusicType } from './Type';

const fileToArrayBuffer = (file: File) => {
    return new Promise((resolve: (value: ArrayBuffer) => void, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer); // 결과를 ArrayBuffer로 반환
        reader.onerror = () => reject(reader.error); // 에러 처리
        reader.readAsArrayBuffer(file); // 파일을 ArrayBuffer로 읽기
    });
};

const makeSampleData = (
    f: File,
    audioContext: AudioContext,
    type: UploadedMusicType,
): Promise<SampleData> => {
    return fileToArrayBuffer(f)
        .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
        .then((audioBuffer) => {
            return {
                audioBuffer,
                pitch: 0,
                speed: 1.0,
                startPoint: 0,
                endPoint: audioBuffer.duration,
                edited: false,
                type,
                name: f.name,
                id: v4(),
            };
        });
};

const publicFileToArrayBuffer = (address: string) => {
    return new Promise((resolve: (value: ArrayBuffer) => void, reject) => {
        fetch(`${publicUrl}/demo_audios/${address}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Fail to load ${address}`);
                }
                return res.arrayBuffer();
            })
            .then((buffer) => resolve(buffer))
            .catch((e) => reject(e));
    });
};

const makeSampleDataFromPublicFile = (
    address: string,
    audioContext: AudioContext,
    type: UploadedMusicType,
): Promise<SampleData> => {
    return publicFileToArrayBuffer(address)
        .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
        .then((audioBuffer) => {
            return {
                audioBuffer,
                pitch: 0,
                speed: 1.0,
                startPoint: 0,
                endPoint: audioBuffer.duration,
                edited: false,
                type,
                name: address,
                id: v4(),
            };
        });
};

const publicUrl = import.meta.env.BASE_URL;

const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Hue 값 생성 (0 ~ 360)
    const h = Math.abs(hash % 360);

    // Saturation, Lightness 값을 조정하여 무채색 방지
    const s = 60 + (Math.abs(hash) % 40); // Saturation: 60% ~ 100%
    const l = 40 + (Math.abs(hash) % 30); // Lightness: 40% ~ 70%

    return `hsl(${h}, ${s}%, ${l}%)`;
};

export { makeSampleData, makeSampleDataFromPublicFile, publicUrl, stringToColor };
