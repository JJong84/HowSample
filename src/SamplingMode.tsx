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
import WaveformPreview from './WaveformPreview';

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
    const {
        offlineAudioContext,
        audioContext,
        createPitchShiftNode,
        createPitchShiftNodeForOffline,
    } = useAudioContext();
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

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, source: SampleData) => {
        setDraggedAudioSource(source);

        const transparentPixel = document.createElement('div');
        transparentPixel.style.width = '1px';
        transparentPixel.style.height = '1px';
        transparentPixel.style.backgroundColor = 'transparent';

        // ghost UI
        document.body.appendChild(transparentPixel);
        e.dataTransfer.setDragImage(transparentPixel, 0, 0);

        // Drag 종료 후 정리
        // e.dataTransfer.addEventListener("dragend", () => {
        //   document.body.removeChild(transparentPixel);
        // });
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

    const TOTAL_TIME = 120; //seconds
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

    const makeRange = () => {
        const multiples = [];
        for (let i = 5; i <= TOTAL_TIME; i += 5) {
            multiples.push(i);
        }
        return multiples;
    };

    const downloadSong = async () => {
        lines.forEach((line) => {
            line.sampleLines.forEach((sl) => {
                const sourceNode = offlineAudioContext.createBufferSource();
                const targetSource = sources.find((s) => s.id === sl.sampleDataId);
                if (!targetSource) {
                    return;
                }
                const { audioBuffer, speed, pitch, startPoint, endPoint } = targetSource;
                sourceNode.buffer = audioBuffer;

                const startTime = sl.startTime;

                const gainNode = offlineAudioContext.createGain();
                gainNode.gain.value = 1; // gain

                const pitchShiftNode = createPitchShiftNodeForOffline();

                const pitchFactorParam = pitchShiftNode?.parameters.get('pitchFactor');
                if (!pitchFactorParam || !targetSource) {
                    console.log('no pitch factor or soudsource');
                    return;
                }
                pitchFactorParam.value = Math.pow(2, pitch / 12) / speed;
                sourceNode.playbackRate.value = speed;

                sourceNode.playbackRate.value = speed;
                sourceNode
                    .connect(pitchShiftNode)
                    .connect(gainNode)
                    .connect(offlineAudioContext.destination);
                sourceNode.start(startTime, startPoint, endPoint - startPoint);
            });
        });

        // 렌더링 시작
        const renderedBuffer = await offlineAudioContext.startRendering();

        // WAV 포맷으로 변환
        const wavBlob = audioBufferToWav(renderedBuffer);

        // 다운로드
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'output.wav';
        a.click();
        URL.revokeObjectURL(url);
    };

    // AudioBuffer를 WAV 포맷으로 변환
    const audioBufferToWav = (buffer: AudioBuffer) => {
        const numberOfChannels = buffer.numberOfChannels;
        const length = buffer.length * numberOfChannels * 2 + 44;
        const wav = new ArrayBuffer(length);
        const view = new DataView(wav);

        // Write WAV header
        const writeString = (offset: number, str: string) => {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, length - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, buffer.sampleRate, true);
        view.setUint32(28, buffer.sampleRate * 4, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length - 44, true);

        // Write PCM samples
        let offset = 44;
        const interleaved = new Float32Array(buffer.length * numberOfChannels);
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                interleaved[i * numberOfChannels + channel] = buffer.getChannelData(channel)[i];
            }
        }
        for (let i = 0; i < interleaved.length; i++, offset += 2) {
            const sample = Math.max(-1, Math.min(1, interleaved[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        }

        return new Blob([view], { type: 'audio/wav' });
    };

    return (
        <>
            <div>
                <Button
                    style={{ marginBottom: 2 }}
                    variant="outlined"
                    onClick={handleLoadDemoClick}
                >
                    Load Demo
                </Button>
            </div>
            <Button onClick={handleResetClick}>Reset</Button>
            <Button onClick={handlePlayClick}>Play</Button>
            <Button onClick={downloadSong}>Download Song</Button>
            <div className="lines-container">
                <div className="progress-line-total" ref={progressLineRef} />
                <div className="time-line">
                    {makeRange().map((i) => (
                        <span className="time-line-number" style={{ left: i * PIXEL_PER_SECOND }}>
                            {i}
                        </span>
                    ))}
                </div>
                {lines.map((li) => (
                    <SamplingLine
                        key={v4()}
                        id={li.id}
                        onDrop={handleDrop}
                        line={li}
                        pixelPerSecond={PIXEL_PER_SECOND}
                        totalTime={TOTAL_TIME}
                        sources={sources}
                        draggedSource={draggedAudioSource}
                    />
                ))}
            </div>
            <Button onClick={handleAddLineClick}>ADD Line</Button>
            <div>
                <Typography
                    variant="h5"
                    sx={{
                        marginTop: 0.5,
                        marginBottom: 1,
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 4,
                    }}
                >
                    Added Tracks
                    <MusicInput
                        setSources={setSources}
                        selectedFiles={selectedFiles}
                        setSelectedFiles={setSelectedFiles}
                        type="user"
                        buttonText="Upload Audio File"
                    />
                </Typography>
                {sources.length > 0 && (
                    <>
                        <Typography variant="h6" sx={{ marginBottom: 1 }}>
                            Drag and drop samples to create your own track.
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Preview</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Speed</TableCell>
                                        <TableCell>Pitch</TableCell>
                                        <TableCell>Start Point</TableCell>
                                        <TableCell>End Point</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody sx={{ overflowY: 'auto' }}>
                                    {sources.map((source) => (
                                        <TableRow
                                            style={{ cursor: 'pointer' }}
                                            key={`${source.id.toString()}${source.startPoint}${source.endPoint}`}
                                            onClick={() => handleSourceClick(source)}
                                        >
                                            <TableCell width={30}>
                                                <div
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, source)}
                                                    style={{
                                                        cursor: 'grab',
                                                        color: 'black',
                                                    }}
                                                >
                                                    <WaveformPreview
                                                        data={source}
                                                        pixelPerSecond={PIXEL_PER_SECOND}
                                                    />
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
                    </>
                )}
            </div>
        </>
    );
};

export default SamplingMode;
