import { useEffect, useMemo, useRef, useState } from 'react';
import { SampleData, SampleRange } from './Type';
import { useAudioContext } from './useAudioContext';

interface Props {
    data: SampleData;
    id: string;
    ranges: SampleRange[];
    soundSource: AudioBufferSourceNode | null;
    setSoundSource: React.Dispatch<React.SetStateAction<AudioBufferSourceNode | null>>;
    startedTime: number | null;
    setStartedTime: React.Dispatch<React.SetStateAction<number | null>>;
    playingId: string;
    setPlayingId: React.Dispatch<React.SetStateAction<string>>;
    color?: string;
}

const Waveform = ({
    id,
    data,
    ranges,
    playingId,
    setPlayingId,
    startedTime,
    setStartedTime,
    soundSource,
    setSoundSource,
    color = 'rgba(0, 0, 0, 0.8)',
}: Props) => {
    //TODO: Remove speed pitch
    const [speed] = useState(1.0);
    const [pitch] = useState(0);

    const { audioContext, createPitchShiftNode } = useAudioContext();
    const { audioBuffer } = data;
    const waveformRef = useRef<HTMLCanvasElement>(null);
    const progressLineRef = useRef<HTMLDivElement>(null);

    const [pitchShiftNode, setPitchShiftNode] = useState<AudioWorkletNode | null>();

    const pixelPerSecond = useMemo(() => {
        const containerWidth = document.querySelector('.main')?.clientWidth || 800;

        const calculatedPixelPerSecond = containerWidth / data.audioBuffer.duration;

        return Math.max(calculatedPixelPerSecond, 0.5);
    }, [data]);

    useEffect(() => {
        setPitchAndSpeed();
    }, [speed, pitch]);

    useEffect(() => {
        if (startedTime != null && progressLineRef.current) {
            const transformMatch =
                progressLineRef.current.style.transform.match(/translateX\(([-\d.]+)px\)/);
            const leftMatch = progressLineRef.current.style.left.match(/([-\d.]+)px/);

            const translateX = transformMatch ? parseFloat(transformMatch[1]) : 0;
            const left = leftMatch ? parseFloat(leftMatch[1]) : 0;

            progressLineRef.current.style.left = `${left + translateX}px`;
            progressLineRef.current.style.transform = '';
            setStartedTime(audioContext.currentTime);
        }
    }, [speed]);

    useEffect(() => {
        let animationFrameId: number;

        if (playingId == id && startedTime != null && progressLineRef.current) {
            progressLineRef.current.style.visibility = 'visible';
        } else if (progressLineRef.current) {
            progressLineRef.current.style.left = `${data.startPoint * pixelPerSecond}px`;
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
    }, [startedTime, audioContext, speed]);

    useEffect(() => {
        const canvas = waveformRef.current;
        if (!canvas) return;

        const canvasWidth = Math.ceil(audioBuffer.duration * pixelPerSecond);
        canvas.width = canvasWidth;
        canvas.style.width = `${canvasWidth}px`;

        draw();
    }, [pixelPerSecond]);

    useEffect(() => {
        if (progressLineRef.current) {
            progressLineRef.current.style.left = `${data.startPoint * pixelPerSecond}px`;
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

        // requestAnimationFrame(draw);

        const channelData = audioBuffer.getChannelData(0);
        const totalSamples = channelData.length;

        const WIDTH = waveformRef.current?.width;
        const HEIGHT = waveformRef.current?.height;

        const samplesPerPixel = Math.floor(totalSamples / WIDTH);

        const waveform = Array.from({ length: WIDTH }, (_, i) => {
            const start = i * samplesPerPixel;
            const end = Math.min(start + samplesPerPixel, totalSamples);

            // Calculate min and max values for the current pixel range
            const segment = channelData.slice(start, end);
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

    const handleStop = () => {
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

        source.start(0, data.startPoint, data.endPoint - data.startPoint);

        source.addEventListener('ended', () => {
            handleStop();
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

    const handleWaveClick = () => {
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
        <div onClick={handleWaveClick} className="waveform-container">
            <div ref={progressLineRef} className="progress-line" />
            {ranges.map(({ start, end }, i) => (
                <div className="drag" key={i}>
                    <div
                        className="dragged"
                        style={{
                            left: start * pixelPerSecond,
                            width: (end - start) * pixelPerSecond,
                        }}
                    />
                </div>
            ))}
            <canvas className="waveform" ref={waveformRef} />
        </div>
    );
};

export default Waveform;
