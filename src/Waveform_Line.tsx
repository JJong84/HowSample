import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { SampleData, WaveformHandle } from './Type';
import { useAudioContext } from './useAudioContext';
import { UUIDTypes } from 'uuid';
import { useAddSourceModal } from './useAddSourceModal';

interface Props {
    data: SampleData;
    isMovable?: boolean;
    isCuttable?: boolean; // 자를 수 있는지
    pixelPerSecond: number;
    id?: UUIDTypes;
}

const WaveForm = forwardRef<WaveformHandle, Props>(({ data, pixelPerSecond }: Props, ref) => {
    const { audioContext, createPitchShiftNode } = useAudioContext();
    const { audioBuffer, pitch: initialPitch, speed: initialSpeed, startPoint, endPoint } = data;
    const waveformRef = useRef<HTMLCanvasElement>(null);

    const [speed, setSpeed] = useState(initialSpeed);
    const [pitch, setPitch] = useState(initialPitch);

    const [soundSource, setSoundSource] = useState<AudioBufferSourceNode | null>();
    const [pitchShiftNode, setPitchShiftNode] = useState<AudioWorkletNode | null>();

    useImperativeHandle(ref, () => ({
        playStop,
        start,
        stop,
        getNode: () => soundSource,
        changeSpeed,
        changePitch,
    }));

    useEffect(() => {
        setPitchAndSpeed();
    }, [speed, pitch]);

    useEffect(() => {
        const canvas = waveformRef.current;
        if (!canvas) return;

        const canvasWidth = Math.ceil(((endPoint - startPoint) * pixelPerSecond) / speed);
        console.log(canvasWidth);
        canvas.width = canvasWidth;
        canvas.style.width = `${canvasWidth}px`;

        draw();
    }, [data]);

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
        canvasContext.fillStyle = 'rgba(256, 256, 256, 0.2)';
        canvasContext.fillRect(0, 0, WIDTH, HEIGHT);

        // Draw waveform
        canvasContext.strokeStyle = 'rgba(256, 256, 256, 0.8)';
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

    const stop = () => {
        soundSource?.stop();
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

        source.start(startPoint);

        return source;
    };

    const playStop = () => {
        if (soundSource) {
            stop();
            setSoundSource(null);
        } else {
            const source = start();
            setSoundSource(source);
        }
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

    const changeSpeed = (value: number) => {
        setSpeed(value);
    };

    const changePitch = (value: number) => {
        setPitch(value);
    };

    const { openModal } = useAddSourceModal();
    const handleCanvasClick = () => {
        openModal(data, false);
    };

    return <canvas onClick={handleCanvasClick} className="waveform" ref={waveformRef} />;
});

export default WaveForm;
