import { useEffect, useMemo, useRef } from 'react';
import { SampleData } from './Type';
import { UUIDTypes } from 'uuid';
import { stringToColor } from './Helpers';

interface Props {
    data: SampleData;
    isMovable?: boolean;
    isCuttable?: boolean; // 자를 수 있는지
    pixelPerSecond: number;
    id?: UUIDTypes;
}

const WaveformPreview = ({ data, pixelPerSecond }: Props) => {
    // Max Width: 20s
    const PREVIEW_MAX_DURATION = 2;
    const { audioBuffer, speed, startPoint, endPoint } = data;
    const waveformRef = useRef<HTMLCanvasElement>(null);

    const color = useMemo(() => {
        console.log(stringToColor(data.id as string));
        return stringToColor(data.id as string);
    }, [data.id]);

    const newEndPoint = useMemo(
        () =>
            (endPoint - startPoint) / speed > PREVIEW_MAX_DURATION
                ? startPoint + PREVIEW_MAX_DURATION / speed
                : endPoint,
        [startPoint, endPoint, speed, PREVIEW_MAX_DURATION],
    );

    useEffect(() => {
        const canvas = waveformRef.current;
        if (!canvas) return;

        const canvasWidth = Math.ceil(((newEndPoint - startPoint) * pixelPerSecond) / speed);
        canvas.width = canvasWidth;
        canvas.style.width = `${canvasWidth}px`;

        draw();
    }, [data, newEndPoint]);

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

        const endSample = Math.floor(newEndPoint * audioBuffer.sampleRate);
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

    return <canvas className="waveform-preview" ref={waveformRef} />;
};

export default WaveformPreview;
