// interface SamplingModeProps {

import { Line, SampleData, UploadedMusic } from './Type';
import MusicInput from './MusicInput';
import { useAudioContext } from './useAudioContext';
import { useEffect, useRef, useState } from 'react';
import { useAddSourceModal } from './useAddSourceModal';
import SamplingLine from './SampleLine';
import { UUIDTypes, v4 } from 'uuid';
import {
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import './style/sampling.css';
import { OneMoreTime } from './MockData';
import { makeSampleDataFromPublicFile } from './Helpers';

interface SamplingModeProps {
    selectedFiles: UploadedMusic[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<UploadedMusic[]>>;
    sources: SampleData[];
    setSources: React.Dispatch<React.SetStateAction<SampleData[]>>;
    lines: Line[];
    setLines: React.Dispatch<React.SetStateAction<Line[]>>;
}

const SamplingMode = ({
    selectedFiles,
    setSelectedFiles,
    sources,
    setSources,
    lines,
    setLines,
}: SamplingModeProps) => {
    const { audioContext, createPitchShiftNode } = useAudioContext();
    const { isModalOpen } = useAddSourceModal();

    const { openModal } = useAddSourceModal();
    const [draggedAudioSource, setDraggedAudioSource] = useState<SampleData | null>(null);
    const [startedTime, setStartedTime] = useState<number | null>(null);

    const [, setPlayingNodes] = useState<AudioBufferSourceNode[]>([]);

    useEffect(() => {
        if (isModalOpen) {
            intialize();
        }
    }, [isModalOpen]);

    const handleAddLineClick = () => {
        setLines((prev) => [
            ...prev,
            {
                id: v4(),
                sampleLines: [],
            },
        ]);
    };

    const handleSourceClick = (source: SampleData) => {
        openModal(source, false);
    };

    const handleDragStart = (source: SampleData) => {
        setDraggedAudioSource(source);
    };

    const handleDrop = (droppedPosition: number, id: UUIDTypes) => {
        if (!draggedAudioSource) {
            return;
        }

        const startTime = droppedPosition;

        setLines((prev) =>
            prev.map((li) => {
                if (li.id == id) {
                    return {
                        id,
                        sampleLines: [
                            ...li.sampleLines,
                            {
                                startTime,
                                sampleDataId: draggedAudioSource.id,
                            },
                        ],
                    };
                }
                return li;
            }),
        );

        setDraggedAudioSource(null);
    };

    const intialize = () => {
        setStartedTime(null);
        setPlayingNodes((prev) => {
            prev.forEach((node) => {
                node.disconnect();
            });
            return [];
        });
    };

    const handlePlayClick = () => {
        if (startedTime != null) {
            intialize();
        } else {
            let lastSourceNode: AudioBufferSourceNode | null = null;
            let lastSourceNodeEndTime = 0;

            lines.forEach((line) => {
                line.sampleLines.forEach((sl) => {
                    const sourceNode = audioContext.createBufferSource();
                    const targetSource = sources.find((s) => s.id == sl.sampleDataId);
                    if (!targetSource) {
                        return;
                    }
                    const { audioBuffer, pitch, speed, startPoint, endPoint } = targetSource;
                    sourceNode.buffer = audioBuffer;

                    const startTime = sl.startTime + audioContext.currentTime;

                    const node = createPitchShiftNode(speed, pitch);

                    const pitchFactorParam = node?.parameters.get('pitchFactor');
                    if (!pitchFactorParam) {
                        console.log('no pitch factor or soudsource in source node');
                    } else {
                        pitchFactorParam.value = Math.pow(2, pitch / 12) / speed;
                    }

                    sourceNode.playbackRate.value = speed;
                    sourceNode.connect(node).connect(audioContext.destination);
                    sourceNode.start(startTime, startPoint, endPoint - startPoint);

                    const endTime = startTime + endPoint - startPoint;
                    if (!lastSourceNode || lastSourceNodeEndTime < endTime) {
                        lastSourceNode = sourceNode;
                        lastSourceNodeEndTime = endTime;
                    }

                    setPlayingNodes((prev) => [...prev, sourceNode]);
                });
            });
            setStartedTime(audioContext.currentTime);

            if (lastSourceNode) {
                (lastSourceNode as AudioBufferSourceNode).addEventListener('ended', () => {
                    intialize();
                });
            }
        }
    };

    const progressLineRef = useRef<HTMLDivElement>(null);

    const TOTAL_TIME = 60; //seconds
    const PIXEL_PER_SECOND = 28;

    useEffect(() => {
        let animationFrameId: number;

        const updateAnimation = () => {
            if (startedTime != null && progressLineRef.current) {
                // Calculate translateX based on AudioContext's currentTime
                const translateX = (audioContext.currentTime - startedTime) * PIXEL_PER_SECOND;
                progressLineRef.current.style.transform = `translateX(${translateX}px)`;
            }

            animationFrameId = requestAnimationFrame(updateAnimation);
        };

        // Start the animation
        updateAnimation();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [startedTime, audioContext]);

    const handleResetClick = () => {
        intialize();
        setLines([{ id: v4(), sampleLines: [] }]);
    };

    const handleLoadDemoClick = async () => {
        const demoSources: SampleData[] = [];
        await makeSampleDataFromPublicFile('More Spell On You.mp3', audioContext, 'user').then(
            (source) => {
                demoSources.push(source);
            },
        );

        if (!demoSources.length) {
            return;
        }

        const sampleDatas: SampleData[] = OneMoreTime.map((s) => ({
            ...demoSources[0],
            ...s,
            id: v4(),
        }));

        setSources((prev) => [...prev, ...demoSources, ...sampleDatas]);
        setLines([
            {
                id: v4(),
                sampleLines: [
                    { startTime: 2.766, sampleDataId: sampleDatas[0].id },
                    { startTime: 6.454, sampleDataId: sampleDatas[0].id },
                    { startTime: 10.14, sampleDataId: sampleDatas[0].id },
                    { startTime: 13.932, sampleDataId: sampleDatas[0].id },
                ],
            },
            {
                id: v4(),
                sampleLines: [
                    { startTime: 0, sampleDataId: sampleDatas[1].id },
                    { startTime: 0.922, sampleDataId: sampleDatas[1].id },
                    { startTime: 1.844, sampleDataId: sampleDatas[1].id },
                    { startTime: 3.688, sampleDataId: sampleDatas[1].id },
                    { startTime: 4.61, sampleDataId: sampleDatas[1].id },
                    { startTime: 5.532, sampleDataId: sampleDatas[1].id },
                    { startTime: 7.376, sampleDataId: sampleDatas[1].id },
                    { startTime: 8.298, sampleDataId: sampleDatas[1].id },
                    { startTime: 9.22, sampleDataId: sampleDatas[1].id },
                ],
            },
            {
                id: v4(),
                sampleLines: [
                    { startTime: 11.064, sampleDataId: sampleDatas[2].id },
                    { startTime: 11.542, sampleDataId: sampleDatas[2].id },
                    { startTime: 12.02, sampleDataId: sampleDatas[2].id },
                    { startTime: 12.498, sampleDataId: sampleDatas[2].id },
                    { startTime: 12.976, sampleDataId: sampleDatas[2].id },
                    { startTime: 13.454, sampleDataId: sampleDatas[2].id },
                ],
            },
        ]);
    };

    return (
        <>
            <Button onClick={handleLoadDemoClick}>Load Demo</Button>
            <Button onClick={handleResetClick}>Reset</Button>
            <Button onClick={handlePlayClick}>Play</Button>
            <div className="lines-container">
                <div className="progress-line" ref={progressLineRef} />
                {lines.map((li) => (
                    <SamplingLine
                        key={v4()}
                        id={li.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        line={li}
                        pixelPerSecond={PIXEL_PER_SECOND}
                        totalTime={TOTAL_TIME}
                        sources={sources}
                    />
                ))}
            </div>
            <Button onClick={handleAddLineClick}>ADD Line</Button>
            <MusicInput
                setSources={setSources}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                type="user"
                buttonText="Select Audio File"
            />
            <div>
                <Typography variant="h6" sx={{ marginBottom: 2 }}>
                    Added Tracks
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell></TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Speed</TableCell>
                                <TableCell>Pitch</TableCell>
                                <TableCell>Start Point</TableCell>
                                <TableCell>End Point</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sources.map((source) => (
                                <TableRow
                                    key={`${source.id.toString()}${source.startPoint}${source.endPoint}`}
                                    onClick={() => handleSourceClick(source)}
                                >
                                    <TableCell>
                                        <div
                                            draggable
                                            onDragStart={() => handleDragStart(source)}
                                            style={{
                                                cursor: 'grab',
                                                color: 'blue',
                                                textDecoration: 'underline',
                                            }}
                                        >
                                            Drag Here
                                        </div>
                                    </TableCell>
                                    <TableCell>{source.name}</TableCell>
                                    <TableCell>{source.speed.toFixed(1)}x</TableCell>
                                    <TableCell>{source.pitch} semitones</TableCell>
                                    <TableCell>{source.startPoint.toFixed(3)} s</TableCell>
                                    <TableCell>{source.endPoint.toFixed(3)} s</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </>
    );
};

export default SamplingMode;
