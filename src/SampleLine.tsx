// interface SamplingModeProps {

import { Line, SampleData } from './Type';
import { useMemo, useRef } from 'react';
import WaveForm from './Waveform_Line';
import { UUIDTypes } from 'uuid';

interface SampleLineProps {
    id: UUIDTypes;
    sources: SampleData[];
    line: Line;
    onDragOver: React.DragEventHandler<HTMLDivElement>;
    onDrop: (droppedPosition: number, id: UUIDTypes) => void;
    totalTime: number;
    pixelPerSecond: number;
}

// 1분 정도로 잡기
const SamplingLine = ({ id, sources, line, onDragOver, onDrop, totalTime, pixelPerSecond }: SampleLineProps) => {
    const lineRef = useRef<HTMLDivElement>(null);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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

    return (
        <>
            <div style={{ width: pixelPerSecond * totalTime }} className="line" ref={lineRef} onDragOver={onDragOver} onDrop={(e) => handleDrop(e)}>
                {samples.map(
                    ({ source, startTime }) =>
                        source && (
                            <div key={source.id as string} className="waveform-container" style={{ left: startTime * pixelPerSecond }}>
                                <WaveForm data={source} pixelPerSecond={pixelPerSecond} />
                            </div>
                        ),
                )}
            </div>
        </>
    );
};

export default SamplingLine;
