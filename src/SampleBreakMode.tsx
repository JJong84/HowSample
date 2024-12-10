import { Line, SampleData, SampleLine, SampleRange, UploadedMusic } from "./Type";
import MusicInput from "./MusicInput";
import WaveForm from "./Waveform";
// import SampleBreakResult from "./SampleBreakResult";
import "./style/sample-break.css";
import { Button } from "@mui/material";
import { KanYe } from "./MockData";
import { v4 } from "uuid";
import { useState } from "react";

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
    const [targetRanges, setTargetRanges] = useState<SampleRange[]>([]);
    const [originalRanges, setOriginalRanges] = useState<SampleRange[]>([]);

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

      setOriginalRanges(mockupData.map(({original}, i) => ({
        ...original,
        sampleId: ids[i]
      })));
      setTargetRanges(mockupData.map(({target}, i) => ({
        ...target,
        sampleId: ids[i]
      })));
      setSources((prev) => [...prev, ...breakSources]);
      setLines((prev) => [...prev, {
        sampleLines: breakLines,
        id: v4()
      }]);
    }
    
    return <>
      {/* {
        breakResultSources.length > 0 && <SampleBreakResult sources={sources}/>
      } */}
      <div>Break Result</div>
      <div>Target</div>
      <div className="waveform-container">
        {
          targetRanges.length > 0 && <WaveForm data={targetSource[0]} pixelPerSecond={10} ranges={targetRanges} />
        }
      </div>
      
      <div>Original</div>
      <div className="waveform-container">
        {
          sampledSources.map((s) => <WaveForm id={s.id} data={s} pixelPerSecond={10} ranges={originalRanges}/>)
        }
      </div>
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