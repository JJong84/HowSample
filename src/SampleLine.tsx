// interface SamplingModeProps {

import { Line, SampleData } from './Type';
import { useMemo, useRef, useState } from 'react';
import WaveForm from './Waveform_Line';
import { UUIDTypes, v4 } from 'uuid';

interface SampleLineProps {
    id: UUIDTypes;
    sources: SampleData[];
    line: Line;
    onDrop: (droppedPosition: number, id: UUIDTypes) => void;
    totalTime: number;
    pixelPerSecond: number;
    draggedSource: SampleData | null;
}

// 1분 정도로 잡기
const SamplingLine = ({
    id,
    sources,
    line,
    onDrop,
    totalTime,
    pixelPerSecond,
    draggedSource,
}: SampleLineProps) => {
    const lineRef = useRef<HTMLDivElement>(null);
    const [dragX, setDragX] = useState<number | null>(null);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        setDragX(null);

        if (!lineRef.current) return;

        const rect = lineRef.current.getBoundingClientRect();
        const dropX = e.clientX - rect.left;
        const divWidth = rect.width;
        const droppedPosition = (totalTime * dropX) / divWidth;

        onDrop(droppedPosition, id);
    };

    const samples = useMemo(() => {
        return line.sampleLines.map((sl) => {
            const source = sources.find((s) => s.id == sl.sampleDataId);
            return { startTime: sl.startTime, source };
        });
    }, [sources, line]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();

        if (!lineRef.current) return;

        const rect = lineRef.current.getBoundingClientRect();
        const dragX = e.clientX - rect.left;
        setDragX(dragX);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragX(null);
        }
    };
    return (
        <>
            <div
                style={{ width: pixelPerSecond * totalTime }}
                className="line"
                ref={lineRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e)}
            >
                {samples.map(
                    ({ source, startTime }) =>
                        source && (
                            <div
                                key={v4()}
                                className="waveform-container-sampling"
                                style={{ left: startTime * pixelPerSecond }}
                            >
                                <WaveForm data={source} pixelPerSecond={pixelPerSecond} />
                            </div>
                        ),
                )}
                {dragX && draggedSource && (
                    <div className="waveform-container-sampling" style={{ left: dragX }}>
                        <WaveForm data={draggedSource} pixelPerSecond={pixelPerSecond} />
                    </div>
                )}
            </div>
        </>
    );
};

export default SamplingLine;
