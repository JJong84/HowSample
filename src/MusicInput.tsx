import { useRef } from 'react';
import { SampleData, UploadedMusic, UploadedMusicType } from './Type';
import { useAudioContext } from './useAudioContext';
import { makeSampleData } from './Helpers';

interface MusicInputProps {
    multiple?: boolean;
    selectedFiles: UploadedMusic[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<UploadedMusic[]>>;
    type: UploadedMusicType;
    setSources: React.Dispatch<React.SetStateAction<SampleData[]>>;
}

const MusicInput = ({ multiple, setSelectedFiles, type, setSources }: MusicInputProps) => {
    const { audioContext } = useAudioContext();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) {
            return;
        }

        if (multiple) {
            const musics: UploadedMusic[] = Array.from(files).map((f) => ({
                file: f,
                type,
            }));
            setSelectedFiles((prev) => {
                return [...prev, ...musics];
            });

            Promise.all(Array.from(files).map((f) => makeSampleData(f, audioContext, type)))
                .then((sources) => {
                    setSources((prev) => [...prev, ...sources]);
                })
                .catch((error) => console.error('Error processing files:', error));
        } else {
            const file = files[0];
            setSelectedFiles([
                {
                    file,
                    type,
                },
            ]);

            makeSampleData(file, audioContext, type).then((source) => {
                setSources((prev) => [...prev, source]);
            });
        }
    };

    const handleButtonClick = () => {
        inputRef.current?.click();
    };

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
            <button onClick={handleButtonClick} id="uploadBtn">
                Select Audio File
            </button>
        </>
    );
};

export default MusicInput;
