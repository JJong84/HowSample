import { useMemo } from "react";
import { SampleData } from "./Type";
import { useAudioContext } from "./useAudioContext";

interface SampleUnitProps {
    data: SampleData;
}

const SampleUnit = ({data}: SampleUnitProps) => {
    const {audioContext} = useAudioContext();
    const {audioBuffer, speed, pitch, startPoint, endPoint} = data;

    const source = useMemo(() => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        source.playbackRate.value = speed;
        
        if (source.detune !== undefined) {
            source.detune.value = pitch * 100;
        } else {
            console.warn("detune is not supported in this AudioBufferSourceNode.");
        }

        return source;
    }, [audioBuffer, speed, pitch]);

    const handlePlayClick = () => {
        source.start(audioContext.currentTime, startPoint, endPoint);
    }

    return (
        <>
            <button onClick={handlePlayClick} id="playbtn">Play File</button>
        </>
    )
};

export default SampleUnit;