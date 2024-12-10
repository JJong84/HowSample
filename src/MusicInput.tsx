import { useRef } from "react";
import { SampleData, UploadedMusic, UploadedMusicType } from "./Type";
import { useAudioContext } from "./useAudioContext";
import { v4 } from "uuid";

interface MusicInputProps {
    multiple?: boolean;
    selectedFiles: UploadedMusic[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<UploadedMusic[]>>;
    type: UploadedMusicType,
    setSources: React.Dispatch<React.SetStateAction<SampleData[]>>;
}

const MusicInput = ({multiple, setSelectedFiles, type, setSources}: MusicInputProps) => {
    const {audioContext} = useAudioContext();
    const inputRef = useRef<HTMLInputElement>(null);

    const fileToArrayBuffer = (file: File) => {
        return new Promise((resolve: (value: ArrayBuffer) => void, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer); // 결과를 ArrayBuffer로 반환
            reader.onerror = () => reject(reader.error); // 에러 처리
            reader.readAsArrayBuffer(file); // 파일을 ArrayBuffer로 읽기
        });
    }

    const makeSampleData = (f: File): Promise<SampleData> => {
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
                    id: v4()
                }
            });
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) {
            return;
        }
        
        if (multiple) {
            const musics: UploadedMusic[] = Array.from(files).map((f) => ({
                file: f,
                type
            }));
            setSelectedFiles((prev) => {
                return [...prev, ...musics];
            });

            Promise.all(Array.from(files).map((f) => makeSampleData(f)))
                .then((sources) => {
                    setSources((prev) => [...prev, ...sources]);
                })
                .catch((error) => console.error("Error processing files:", error));
        } else {
            const file = files[0]
            setSelectedFiles([{
                file,
                type
            }]);

            makeSampleData(file)
                .then((source) => {
                    setSources((prev) => [...prev, source]);
                })
        }
    }

    const handleButtonClick = () => {
        inputRef.current?.click();
    }

    return (
        <>
            <input
                ref={inputRef}
                onChange={handleFileChange}
                type="file"
                id="fileInput"
                accept="audio/*"
                hidden
                multiple={multiple}
            />
            <button onClick={handleButtonClick} id="uploadBtn">Select Audio File</button>
        </>
    )
};

export default MusicInput;