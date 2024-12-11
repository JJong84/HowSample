import { Line, SampleData, SampleLine, BreakResponse, UploadedMusic, SampleRange } from "./Type";
import MusicInput from "./MusicInput";
import Waveform from "./Waveform";
import "./style/sample-break.css";
import { Button } from "@mui/material";
import { KanYe } from "./MockData";
import { v4 } from "uuid";
import { useMemo, useState } from "react";
import WaveformBreakResult from "./WaveformBreakResult";

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
const SampleBreakMode = ({setLines, sources, setSources, targetMusic, setTargetMusic, sampledMusic, setSampledMusic}: SampleBreakModeProps) => {
    const targetSource = sources.filter(({type}) => type == 'target');
    const sampledSources = sources.filter(({type}) => type == 'sampled');
    const [breakResult, setBreakResult] = useState<BreakResponse>([]);

    // Global Sound Buffer Node
    const [soundSource, setSoundSource] = useState<AudioBufferSourceNode | null>(null);
    const [startedTime, setStartedTime] = useState<number | null>(null);
    const [playingId, setPlayingId] = useState<string>("");

    //FIXME: Mock Data
    const handleAnalyzeClick = () => {
      const mockupData = KanYe;
      const ts = sampledSources[0]; //TODO: Move to Kanye

      const ids = mockupData.map(() => v4());
      const breakSources: SampleData[] = mockupData.map(({speed, pitch, original, target}, i) => ({
        ...ts,
        id: ids[i],
        type: 'break_result',
        speed,
        pitch,
        startPoint: original.start,
        endPoint: original.end,
        offset: target.start,
      }));

      const breakLines: SampleLine[] = breakSources.map((bs) => ({
        sampleDataId: bs.id,
        startTime: bs.offset || 0
      }));

      setBreakResult(mockupData.map((data, i) => ({
        ...data,
        sampleId: ids[i]
      })));
      setSources((prev) => [...prev, ...breakSources]);
      setLines((prev) => [...prev, {
        sampleLines: breakLines,
        id: v4()
      }]);
    }

    const targetRanges: SampleRange[] = useMemo(() => breakResult.map(({target, sampleId}) => ({
      ...target,
      sampleId
    })), [breakResult]);

    const pixelPerSeconds = useMemo(() => 
      breakResult.map(({ original, target, speed }) => {
        const targetDuration = target.end - target.start;
        const originalDuration = original.end - original.start;
        const totalDuration = targetDuration + originalDuration * (1 + 1/speed);

        const gap = 16;
        const containerWidth = document.querySelector(".wave-results-container")?.clientWidth || 800;

        const calculatedPixelPerSecond = (containerWidth - gap * 2) / totalDuration;

        return Math.max(calculatedPixelPerSecond, 0.5);
      }), [breakResult]);
    
    return <>
      {/* {
        breakResultSources.length > 0 && <SampleBreakResult sources={sources}/>
      } */}
      <div>Break Result</div>
      <div>Target</div>
      <div className="waveform-container-total-target">
        {
          targetSource.length > 0 && <Waveform id={targetSource[0].id} data={targetSource[0]} pixelPerSecond={10} ranges={targetRanges} />
        }
      </div>
      <div>Matches</div>
      {
        targetSource.length > 0 && sampledSources.map((sm, i) => breakResult.map(({sampleId, original, target, speed, pitch}) => 
          <div className="wave-results-container">
            <WaveformBreakResult playingId={playingId} setPlayingId={setPlayingId} startedTime={startedTime} setStartedTime={setStartedTime} soundSource={soundSource} setSoundSource={setSoundSource} id={`${sampleId}-target`} data={targetSource[0]} pixelPerSecond={pixelPerSeconds[i]} currentRange={target} speed={1.0} pitch={0} />
            <WaveformBreakResult playingId={playingId} setPlayingId={setPlayingId} startedTime={startedTime} setStartedTime={setStartedTime} soundSource={soundSource} setSoundSource={setSoundSource} id={`${sampleId}-original`} data={sm} pixelPerSecond={pixelPerSeconds[i]} currentRange={original} speed={1.0} pitch={0} />
            <WaveformBreakResult playingId={playingId} setPlayingId={setPlayingId} modified startedTime={startedTime} setStartedTime={setStartedTime} soundSource={soundSource} setSoundSource={setSoundSource} id={`${sampleId}-original-modified`} data={sm} pixelPerSecond={pixelPerSeconds[i]} currentRange={original} speed={speed} pitch={pitch}/>
          </div>
        ))
      }
      <div>
        Select Target
      </div>
      <MusicInput setSources={setSources} selectedFiles={targetMusic} setSelectedFiles={setTargetMusic} type='target'/>
      <div>
        Select Original
      </div>
      <MusicInput setSources={setSources} multiple selectedFiles={sampledMusic} setSelectedFiles={setSampledMusic} type='sampled' />
      <Button
        variant="outlined"
        sx={{ marginRight: "20px" }}
        onClick={handleAnalyzeClick}
      >
        Analyze
      </Button>
    </>
}

export default SampleBreakMode;