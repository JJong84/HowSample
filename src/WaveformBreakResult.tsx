import { useEffect, useRef, useState } from 'react';
import { SampleData, SampleRange } from './Type';
import { useAudioContext } from './useAudioContext';

interface Props {
    data: SampleData;
    pixelPerSecond: number;
    id: string;
    currentRange: SampleRange;
    speed: number;
    pitch: number;
    soundSource: AudioBufferSourceNode | null;
    setSoundSource: React.Dispatch<React.SetStateAction<AudioBufferSourceNode | null>>;
    startedTime: number | null;
    setStartedTime: React.Dispatch<React.SetStateAction<number | null>>;
    playingId: string;
    setPlayingId: React.Dispatch<React.SetStateAction<string>>;
    color?: string;
}

const WaveformBreakResult = ({
    playingId,
    setPlayingId,
    id,
    soundSource,
    setSoundSource,
    data,
    pixelPerSecond,
    currentRange,
    speed,
    pitch,
    startedTime,
    setStartedTime,
    color = 'rgba(0, 0, 0, 0.8)',
}: Props) => {
    const { start: startPoint, end: endPoint } = currentRange;

    const { audioContext, createPitchShiftNode } = useAudioContext();
    const { audioBuffer } = data;
    const waveformRef = useRef<HTMLCanvasElement>(null);
    const progressLineRef = useRef<HTMLDivElement>(null);

    const [pitchShiftNode, setPitchShiftNode] = useState<AudioWorkletNode | null>();

    useEffect(() => {
        setPitchAndSpeed();
    }, [speed, pitch]);

    useEffect(() => {
        let animationFrameId: number;

        if (playingId == id && startedTime != null && progressLineRef.current) {
            progressLineRef.current.style.visibility = 'visible';
        } else if (progressLineRef.current) {
            progressLineRef.current.style.visibility = 'hidden';
        }

        const updateAnimation = () => {
            if (playingId == id && startedTime != null && progressLineRef.current) {
                // Calculate translateX based on AudioContext's currentTime
                const translateX =
                    (audioContext.currentTime - startedTime) * pixelPerSecond * speed;
                progressLineRef.current.style.transform = `translateX(${translateX}px)`;
            }

            animationFrameId = requestAnimationFrame(updateAnimation);
        };

        // Start the animation
        updateAnimation();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [startedTime, audioContext, speed, playingId, id]);

    useEffect(() => {
        const canvas = waveformRef.current;
        if (!canvas) return;

        const canvasWidth = Math.ceil(((endPoint - startPoint) * pixelPerSecond) / speed);
        canvas.width = canvasWidth;
        canvas.style.width = `${canvasWidth}px`;

        draw();
    }, [pixelPerSecond]);

    useEffect(() => {
        if (progressLineRef.current) {
            progressLineRef.current.style.transform = '';
        }
    }, [data, pixelPerSecond]);

    const draw = () => {
        if (!waveformRef.current) {
            return;
        }
        const canvasContext = waveformRef.current.getContext('2d');
        if (!canvasContext) {
            return;
        }

        const channelData = audioBuffer.getChannelData(0);
        const startSample = Math.floor(startPoint * audioBuffer.sampleRate);
        const endSample = Math.floor(endPoint * audioBuffer.sampleRate);
        const samplesToDraw = channelData.slice(startSample, endSample);

        const WIDTH = waveformRef.current?.width;
        const HEIGHT = waveformRef.current?.height;

        const samplesPerPixel = Math.floor(samplesToDraw.length / WIDTH);

        const waveform = Array.from({ length: WIDTH }, (_, i) => {
            const start = i * samplesPerPixel;
            const end = Math.min(start + samplesPerPixel, samplesToDraw.length);

            // Calculate min and max values for the current pixel range
            const segment = samplesToDraw.slice(start, end);
            const min = Math.min(...segment);
            const max = Math.max(...segment);
            return { min, max };
        });

        canvasContext.clearRect(0, 0, WIDTH, HEIGHT);

        // Clear
        canvasContext.fillStyle = 'rgba(0, 0, 0, 0.0)';
        canvasContext.fillRect(0, 0, WIDTH, HEIGHT);

        // Draw waveform
        canvasContext.strokeStyle = color;
        waveform.forEach((point, i) => {
            const x = i;
            const yMin = ((1 + point.min) / 2) * HEIGHT;
            const yMax = ((1 + point.max) / 2) * HEIGHT;

            canvasContext.beginPath();
            canvasContext.moveTo(x, yMin);
            canvasContext.lineTo(x, yMax);
            canvasContext.stroke();
        });
    };

    const handleStop = (isEndByTime: boolean) => {
        if (isEndByTime) {
            setSoundSource(null);
            setStartedTime(null);
            setPlayingId('');
        }
        soundSource?.disconnect();
    };

    const start = () => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        const node = createPitchShiftNode(speed, pitch);
        setPitchShiftNode(node);
        source.connect(node).connect(audioContext.destination);

        const pitchFactorParam = node?.parameters.get('pitchFactor');
        if (!pitchFactorParam) {
            console.log('no pitch factor or soudsource');
            return source;
        }

        pitchFactorParam.value = Math.pow(2, pitch / 12) / speed;
        source.playbackRate.value = speed;

        source.start(0, startPoint, endPoint - startPoint);

        source.addEventListener('ended', () => {
            let isEndByTime = false;
            console.log(startedTime, source.buffer, audioContext.currentTime);
            if (startedTime && source.buffer) {
                const elapsedTime = audioContext.currentTime - startedTime;
                isEndByTime = elapsedTime >= source.buffer.duration;
            }
            handleStop(isEndByTime);
        });

        setStartedTime(audioContext.currentTime);
        setSoundSource(source);
        setPlayingId(id);

        return source;
    };

    // Function for message to node
    const setPitchAndSpeed = () => {
        const pitchFactorParam = pitchShiftNode?.parameters.get('pitchFactor');
        if (!pitchFactorParam || !soundSource) {
            // console.log('no pitch factor or soudsource');
            return;
        }
        pitchFactorParam.value = Math.pow(2, pitch / 12) / speed;
        soundSource.playbackRate.value = speed;
    };

    const handleCanvasClick = () => {
        if (!playingId) {
            start();
        } else if (playingId == id) {
            soundSource?.stop();
            setSoundSource(null);
            setStartedTime(null);
            setPlayingId('');
        } else {
            soundSource?.stop();
            start();
        }
    };

    return (
        <div className="waveform-container">
            <div ref={progressLineRef} className="progress-line" />
            <canvas onClick={handleCanvasClick} className="waveform" ref={waveformRef} />
        </div>
    );
};

export default WaveformBreakResult;
