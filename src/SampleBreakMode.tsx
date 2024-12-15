import { Line, SampleData, SampleLine, BreakResponse, UploadedMusic, SampleRange } from './Type';
import MusicInput from './MusicInput';
import Waveform from './Waveform';
import './style/sample-break.css';
import { Box, Button, Typography, Grid2 as Grid } from '@mui/material';
import { KanYe } from './MockData';
import { v4 } from 'uuid';
import { Fragment, useMemo, useState } from 'react';
import WaveformBreakResult from './WaveformBreakResult';
import { makeSampleDataFromPublicFile } from './Helpers';
import { useAudioContext } from './useAudioContext';

interface SampleBreakModeProps {
    targetMusic: UploadedMusic[];
    setTargetMusic: React.Dispatch<React.SetStateAction<UploadedMusic[]>>;
    sampledMusic: UploadedMusic[];
    setSampledMusic: React.Dispatch<React.SetStateAction<UploadedMusic[]>>;
    sources: SampleData[];
    setSources: React.Dispatch<React.SetStateAction<SampleData[]>>;
    setLines: React.Dispatch<React.SetStateAction<Line[]>>;
}

//TODO: sampledSources => 1개로 고정해야함 (현재는 1개라는 가정)
const SampleBreakMode = ({
    setLines,
    sources,
    setSources,
    targetMusic,
    setTargetMusic,
    sampledMusic,
    setSampledMusic,
}: SampleBreakModeProps) => {
    const targetSource = sources.filter(({ type }) => type == 'target');
    const sampledSources = sources.filter(({ type }) => type == 'sampled');
    const [breakResult, setBreakResult] = useState<BreakResponse>([]);

    // Global Sound Buffer Node
    const [soundSource, setSoundSource] = useState<AudioBufferSourceNode | null>(null);
    const [startedTime, setStartedTime] = useState<number | null>(null);
    const [playingId, setPlayingId] = useState<string>('');

    const { audioContext } = useAudioContext();

    const handleLoadDemoClick = async () => {
        const demoSources: SampleData[] = [];
        await makeSampleDataFromPublicFile('Through the Fire.mp3', audioContext, 'sampled').then(
            (source) => {
                demoSources.push(source);
            },
        );

        await makeSampleDataFromPublicFile(
            'Through the Wire (Inst).mp3',
            audioContext,
            'target',
        ).then((source) => {
            demoSources.push(source);
        });

        const mockupData = KanYe;

        const ids = mockupData.map(() => v4());
        const breakSources: SampleData[] = mockupData.map(
            ({ speed, pitch, original, target }, i) => ({
                ...demoSources[0], // sampled song
                id: ids[i],
                type: 'break_result',
                speed,
                pitch,
                startPoint: original.start,
                endPoint: original.end,
                offset: target.start,
            }),
        );

        const breakLines: SampleLine[] = breakSources.map((bs) => ({
            sampleDataId: bs.id,
            startTime: bs.offset || 0,
        }));

        setBreakResult(
            mockupData.map((data, i) => ({
                ...data,
                sampleId: ids[i],
            })),
        );
        setSources((prev) => [...prev, ...demoSources, ...breakSources]);
        setLines((prev) => [
            ...prev,
            {
                sampleLines: breakLines,
                id: v4(),
            },
        ]);
    };

    const handleAnalyzeClick = () => {};

    const targetRanges: SampleRange[] = useMemo(
        () =>
            breakResult.map(({ target, sampleId }) => ({
                ...target,
                sampleId,
            })),
        [breakResult],
    );

    const pixelPerSeconds = useMemo(
        () =>
            breakResult.map(({ original, target, speed }) => {
                const targetDuration = target.end - target.start;
                const originalDuration = original.end - original.start;
                const totalDuration = targetDuration + originalDuration * (1 + 1 / speed);

                const gap = 16;
                const containerWidth =
                    document.querySelector('.wave-results-container')?.clientWidth || 800;

                const calculatedPixelPerSecond = (containerWidth - gap * 2) / totalDuration;

                return Math.max(calculatedPixelPerSecond, 0.5);
            }),
        [breakResult],
    );

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const formatRange = (currentRange: SampleRange): string => {
        return `${formatTime(currentRange.start)} - ${formatTime(currentRange.end)}`;
    };

    return (
        <>
            {targetSource.length > 0 && (
                <>
                    <Typography variant="h4" sx={{ marginBottom: 2 }}>
                        Break Result
                    </Typography>
                    <div className="waveform-container-total-target">
                        <Waveform
                            playingId={playingId}
                            setPlayingId={setPlayingId}
                            startedTime={startedTime}
                            setStartedTime={setStartedTime}
                            soundSource={soundSource}
                            setSoundSource={setSoundSource}
                            id={targetSource[0].id as string}
                            data={targetSource[0]}
                            ranges={targetRanges}
                            color="#BFBFBF"
                        />
                    </div>
                </>
            )}
            {targetSource.length > 0 && (
                <>
                    <Typography variant="h4" sx={{ marginTop: 4, marginBottom: 2 }}>
                        Matches
                    </Typography>
                    <Grid
                        container
                        spacing={2}
                        sx={{ alignItems: 'stretch', paddingBottom: 6 }}
                        columns={10}
                    >
                        {/* 헤더 (제목) */}
                        <Grid size={3}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Target
                            </Typography>
                        </Grid>
                        <Grid size={3}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Original Song
                            </Typography>
                        </Grid>
                        <Grid size={4}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Processed
                            </Typography>
                        </Grid>

                        {/* 본 내용 */}
                        {sampledSources.map((sm, i) =>
                            breakResult.map(({ sampleId, original, target, speed, pitch }) => (
                                <Fragment key={sampleId as string}>
                                    {/* Target */}
                                    <Grid size={3}>
                                        <Box
                                            sx={{
                                                paddingTop: 2,
                                            }}
                                        >
                                            <WaveformBreakResult
                                                playingId={playingId}
                                                setPlayingId={setPlayingId}
                                                startedTime={startedTime}
                                                setStartedTime={setStartedTime}
                                                soundSource={soundSource}
                                                setSoundSource={setSoundSource}
                                                id={`${sampleId}-target`}
                                                data={targetSource[0]}
                                                pixelPerSecond={pixelPerSeconds[i]}
                                                currentRange={target}
                                                speed={1.0}
                                                pitch={0}
                                                color="#E57373"
                                            />
                                        </Box>
                                    </Grid>

                                    {/* Original Song */}
                                    <Grid size={3}>
                                        <Box
                                            sx={{
                                                paddingTop: 2,
                                            }}
                                        >
                                            <WaveformBreakResult
                                                playingId={playingId}
                                                setPlayingId={setPlayingId}
                                                startedTime={startedTime}
                                                setStartedTime={setStartedTime}
                                                soundSource={soundSource}
                                                setSoundSource={setSoundSource}
                                                id={`${sampleId}-original`}
                                                data={sm}
                                                pixelPerSecond={pixelPerSeconds[i]}
                                                currentRange={original}
                                                speed={1.0}
                                                pitch={0}
                                                color="#81C784"
                                            />
                                        </Box>
                                    </Grid>

                                    {/* Processed */}
                                    <Grid size="auto">
                                        <Box
                                            sx={{
                                                paddingTop: 2,
                                            }}
                                        >
                                            <WaveformBreakResult
                                                playingId={playingId}
                                                setPlayingId={setPlayingId}
                                                startedTime={startedTime}
                                                setStartedTime={setStartedTime}
                                                soundSource={soundSource}
                                                setSoundSource={setSoundSource}
                                                id={`${sampleId}-original-modified`}
                                                data={sm}
                                                pixelPerSecond={pixelPerSeconds[i]}
                                                currentRange={original}
                                                speed={speed}
                                                pitch={pitch}
                                                color="#64B5F6"
                                            />
                                        </Box>
                                    </Grid>

                                    {/* Information */}
                                    <Grid size="auto">
                                        <Box
                                            sx={{
                                                paddingTop: 2,
                                                paddingLeft: 3,
                                            }}
                                        >
                                            <Typography variant="body2">
                                                {formatRange(original)}
                                            </Typography>
                                            <Typography variant="body2">{`speed: ${speed.toFixed(
                                                2,
                                            )}x`}</Typography>
                                            <Typography variant="body2">{`pitch: ${pitch} semitones`}</Typography>
                                        </Box>
                                    </Grid>
                                </Fragment>
                            )),
                        )}
                    </Grid>
                </>
            )}
            <MusicInput
                setSources={setSources}
                selectedFiles={targetMusic}
                setSelectedFiles={setTargetMusic}
                type="target"
                buttonText="Select Target Audio File"
            />
            <MusicInput
                setSources={setSources}
                multiple
                selectedFiles={sampledMusic}
                setSelectedFiles={setSampledMusic}
                type="sampled"
                buttonText="Select Original Audio File"
            />
            <div>
                <Button
                    variant="outlined"
                    sx={{ marginRight: '20px' }}
                    onClick={handleLoadDemoClick}
                >
                    Load Demo
                </Button>
                <Button
                    variant="outlined"
                    sx={{ marginRight: '20px' }}
                    onClick={handleAnalyzeClick}
                >
                    Analyze
                </Button>
            </div>
        </>
    );
};

export default SampleBreakMode;
