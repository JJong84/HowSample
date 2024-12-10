import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { SampleData, WaveformHandle } from "./Type";
import { useAudioContext } from "./useAudioContext";
import { UUIDTypes } from "uuid";

interface Props {
    data: SampleData,
    isMovable?: boolean,
    isExpandable?: boolean, // 좌우 속도 조절 기능
    isCuttable?: boolean, // 자를 수 있는지
    pixelPerSecond: number,
    id?: UUIDTypes
}  

const MIN_SPEED = 0.2;
const MAX_SPEED = 2.0;

const WaveForm = forwardRef<WaveformHandle, Props>(({data, isExpandable, pixelPerSecond}: Props, ref) => {
    const {audioContext, createPitchShiftNode} = useAudioContext();
    const {audioBuffer, pitch: initialPitch, speed: initialSpeed, startPoint} = data;
    const waveformRef = useRef<HTMLCanvasElement>(null);

    const [dragging, setDragging] = useState<"left" | "right" | null>(null);
    const [speed, setSpeed] = useState(initialSpeed);
    const [pitch, setPitch] = useState(initialPitch);

    const [soundSource, setSoundSource] = useState<AudioBufferSourceNode | null>();
    const [pitchShiftNode, setPitchShiftNode] = useState<AudioWorkletNode | null>();

    const handleWidth = 10; 
    const duration = audioBuffer.duration; // FIXME: !

    useImperativeHandle(ref, () => ({
        start: start,
        stop,
        getNode: () => soundSource,
        changeSpeed,
        changePitch,
        playStop,
    }));

    useEffect(() => {
        setPitchAndSpeed();
    }, [speed, pitch]);

    useEffect(() => {
        const canvas = waveformRef.current;
        if (!canvas) return;

        const adjustedPixelsPerSecond = pixelPerSecond * speed;
        const canvasWidth = Math.ceil(duration * adjustedPixelsPerSecond);
        canvas.width = canvasWidth;

        draw();
    }, [data]);

    const playStop = () => {
        if (soundSource) {
            stop();
            setSoundSource(null);
        } else {
            const source = start();
            setSoundSource(source);
        }
    }

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

        const pitchFactor = Math.pow(2, pitch / 12); // pitch를 반음 기준으로 변환
        const scaledSamples = totalSamples / pitchFactor;

        const WIDTH = waveformRef.current?.width;
        const HEIGHT = waveformRef.current?.height;

        const samplesPerPixel = Math.floor(scaledSamples / WIDTH);
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
        canvasContext.fillStyle = "rgb(256 256 256)";
        canvasContext.fillRect(0, 0, WIDTH, HEIGHT);

        // Draw waveform
        canvasContext.strokeStyle = "black";
        waveform.forEach((point, i) => {
            const x = i;
            const yMin = ((1 + point.min) / 2) * HEIGHT;
            const yMax = ((1 + point.max) / 2) * HEIGHT;

            canvasContext.beginPath();
            canvasContext.moveTo(x, yMin);
            canvasContext.lineTo(x, yMax);
            canvasContext.stroke();
        });

        if (isExpandable) {
            // 핸들 그리기
            canvasContext.fillStyle = "red";
            canvasContext.fillRect(0 - handleWidth / 2, 0, handleWidth, HEIGHT); // 왼쪽 핸들
            canvasContext.fillRect(WIDTH - handleWidth / 2, 0, handleWidth, HEIGHT); // 오른쪽 핸들
        }
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isExpandable) {
            return;
        }
        const canvas = waveformRef.current;
        if (!canvas) return;
    
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
    
        const WIDTH = canvas.width;
    
        // Determine which handle is being dragged
        if (x >= 0 - handleWidth && x <= handleWidth) {
          setDragging("left");
        } else if (x >= WIDTH - handleWidth && x <= WIDTH + handleWidth) {
          setDragging("right");
        }
      };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragging) return;
    
        const canvas = waveformRef.current;
        if (!canvas) return;
    
        const rect = canvas.getBoundingClientRect();
        let new_width = 0;
        const original_width = duration * pixelPerSecond; 

        if (dragging === "left") {
            new_width = rect.right - e.clientX;
        } else if (dragging === "right") {
            new_width = e.clientX - rect.left;
        }

        if (new_width < original_width * MIN_SPEED) {
            new_width = original_width * MIN_SPEED;
        } else if (new_width > original_width * MAX_SPEED) {
            new_width = original_width * MAX_SPEED;
        }
        canvas.width = new_width;

        const newSpeed = original_width / new_width;
        setSpeed(newSpeed);
      };
    
      const handleMouseUp = () => {
        setDragging(null);
      };

      useEffect(() => {
        if (isExpandable) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            return () => {
              window.removeEventListener("mousemove", handleMouseMove);
              window.removeEventListener("mouseup", handleMouseUp);
            };
        }
      }, [dragging, speed, isExpandable]);

    const stop = () => {
        soundSource?.stop();
        soundSource?.disconnect();
    }

    const start = () => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        const node = createPitchShiftNode(speed, pitch);
        setPitchShiftNode(node);
        source.connect(node).connect(audioContext.destination);
        source.playbackRate.value = speed;
        source?.start(startPoint);
        return source;
    }

    // Function for message to node
    const setPitchAndSpeed = () => {
        const pitchFactorParam = pitchShiftNode?.parameters.get('pitchFactor');
        if (!pitchFactorParam || !soundSource) {
            return;
        }
        pitchFactorParam.value = Math.pow(2, pitch / 12) / speed;
        soundSource.playbackRate.value = speed;
    }

    // const start = () => {
    //     const source = audioContext.createBufferSource();
    //     source.buffer = audioBuffer;
    //     source.connect(audioContext.destination);
    //     source.playbackRate.value = speed;
    //     // // 보정
    //     // const detuneValue = -1200 * Math.log2(speed);
    //     // source.detune.value = -100;
    //     source?.start(startPoint);
    //     return source;
    // }

    const changeSpeed = (value: number) => {
        setSpeed(value);
    }

    const changePitch = (value: number) => {
        setPitch(value);
    }

    const handleClickPlay = () => {
        if (soundSource) {
            stop();
            setSoundSource(null);
        } else {
            const source = start();
            setSoundSource(source);
        }
    };

    return <>
        <button onClick={handleClickPlay}>Play Music</button>
        <canvas ref={waveformRef} onMouseDown={handleMouseDown} />
    </>
});

export default WaveForm;