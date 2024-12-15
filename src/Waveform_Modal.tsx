import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { SampleData, WaveformHandle } from './Type';
import { useAudioContext } from './useAudioContext';
import { UUIDTypes } from 'uuid';
import { useAddSourceModal } from './useAddSourceModal';

interface Props {
    data: SampleData;
    pixelPerSecond: number;
    id?: UUIDTypes;
    speed: number;
    pitch: number;
}

const WaveForm = forwardRef<WaveformHandle, Props>(({ data, pixelPerSecond }: Props, ref) => {
    const { speed, pitch, setStartPoint, setEndPoint, startPoint, endPoint } = useAddSourceModal();

    const { audioContext, createPitchShiftNode } = useAudioContext();
    const { audioBuffer } = data;
    const waveformRef = useRef<HTMLCanvasElement>(null);
    const progressLineRef = useRef<HTMLDivElement>(null);

    const [soundSource, setSoundSource] = useState<AudioBufferSourceNode | null>();
    const [pitchShiftNode, setPitchShiftNode] = useState<AudioWorkletNode | null>();

    const [dragStartX, setDragStartX] = useState<number | null>(null);
    const [dragEndX, setDragEndX] = useState<number | null>(null);
    const [isFixed, setIsFixed] = useState<boolean>(false);
    const dragRef = useRef<HTMLDivElement>(null);

    const [startedTime, setStartedTime] = useState<number | null>(null);

    useImperativeHandle(ref, () => ({
        playStop,
        start,
        stop,
        getNode: () => soundSource,
    }));

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

        if (startedTime != null && progressLineRef.current) {
            progressLineRef.current.style.visibility = 'visible';
        } else if (progressLineRef.current) {
            progressLineRef.current.style.left = `${startPoint * pixelPerSecond}px`;
            progressLineRef.current.style.visibility = 'hidden';
        }

        const updateAnimation = () => {
            if (startedTime != null && progressLineRef.current) {
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

        if (dragRef.current) {
            dragRef.current.style.width = `${canvasWidth}px`;
        }
        draw();
    }, [pixelPerSecond]);

    useEffect(() => {
        if (startPoint && endPoint) {
            setDragStartX(startPoint * pixelPerSecond);
            setDragEndX(endPoint * pixelPerSecond);
            setIsFixed(true);

            if (!dragRef.current) {
                return;
            }

            const parentElement = dragRef.current.parentElement;
            if (parentElement) {
                const centerX = ((startPoint + endPoint) * pixelPerSecond) / 2;
                const visibleWidth = parentElement.clientWidth;
                const scrollLeft = Math.max(centerX - visibleWidth / 2, 0);
                parentElement.scrollLeft = scrollLeft;
            }
        }
    }, [pixelPerSecond]);

    useEffect(() => {
        if (isFixed) {
            if (progressLineRef.current) {
                progressLineRef.current.style.left = `${startPoint * pixelPerSecond}px`;
                progressLineRef.current.style.transform = '';
            }
        }
    }, [isFixed, startPoint, pixelPerSecond]);

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
        canvasContext.fillStyle = 'rgba(0, 0, 0, 0)';
        canvasContext.fillRect(0, 0, WIDTH, HEIGHT);

        // Draw waveform
        canvasContext.strokeStyle = 'rgba(0, 0, 0, 0.8)';
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
        setSoundSource(null);
        setStartedTime(null);
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
            stop();
        });

        setStartedTime(audioContext.currentTime);
        return source;
    };

    const playStop = () => {
        if (soundSource) {
            stop();
        } else {
            const source = start();
            setSoundSource(source);
        }
    };

    useEffect(() => {
        if (!dragStartX || !dragEndX || !isFixed) {
            return;
        }
        stop();
        const startTime = dragStartX / pixelPerSecond;
        const endTime = dragEndX / pixelPerSecond;
        setStartPoint(Math.min(startTime, endTime));
        setEndPoint(Math.max(startTime, endTime));
    }, [isFixed, dragStartX, dragEndX, pixelPerSecond]);

    // Function for message to node
    const setPitchAndSpeed = () => {
        const pitchFactorParam = pitchShiftNode?.parameters.get('pitchFactor');
        if (!pitchFactorParam || !soundSource) {
            console.log('no pitch factor or soudsource');
            return;
        }
        pitchFactorParam.value = Math.pow(2, pitch / 12) / speed;
        soundSource.playbackRate.value = speed;
    };

    const { openModal } = useAddSourceModal();
    const handleCanvasClick = () => {
        openModal(data, false);
    };

    const handleDragging = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (dragStartX !== null && !isFixed) {
            const currentX = event.nativeEvent.offsetX;
            setDragEndX(currentX);
        }
    };

    const handleDragEnd = () => {
        if (!isFixed && dragStartX !== null && dragEndX !== null) {
            setIsFixed(true);
        }
    };

    const handleDragClick = (event: React.MouseEvent) => {
        if (isFixed) {
            setDragStartX(event.nativeEvent.offsetX);
            setDragEndX(null);
            setIsFixed(false);
        } else if (dragStartX == null) {
            setDragStartX(event.nativeEvent.offsetX);
            setDragEndX(null);
        } else if (dragEndX !== null) {
            setIsFixed(true);
        }
    };

    const makeRange = () => {
        const multiples = [];
        for (let i = 5; i <= audioBuffer.duration; i += 5) {
            multiples.push(i);
        }
        return multiples;
    };

    return (
        <>
            <div ref={progressLineRef} className="progress-line" />
            <div className="time-line">
                {makeRange().map((i) => (
                    <span className="time-line-number" style={{ left: i * pixelPerSecond }}>
                        {i}
                    </span>
                ))}
            </div>
            <div
                ref={dragRef}
                className="drag"
                onClick={handleDragClick}
                onMouseMove={handleDragging}
                onMouseLeave={handleDragEnd}
            >
                {dragStartX !== null && dragEndX !== null && (
                    <div
                        className="dragged"
                        style={{
                            left: Math.min(dragStartX, dragEndX),
                            width: Math.abs(dragEndX - dragStartX),
                        }}
                    />
                )}
            </div>
            <canvas onClick={handleCanvasClick} className="waveform" ref={waveformRef} />
        </>
    );
});

export default WaveForm;
