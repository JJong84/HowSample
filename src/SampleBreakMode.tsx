import { Line, SampleData, SampleLine, UploadedMusic } from "./Type";
import MusicInput from "./MusicInput";
import WaveForm from "./Waveform";
import SampleBreakResult from "./SampleBreakResult";
import "./style/sample-break.css";
import { Button } from "@mui/material";
import { KanYe } from "./MockData";
import { v4 } from "uuid";

interface SampleBreakModeProps {
    targetMusic: UploadedMusic[];
    setTargetMusic: React.Dispatch<React.SetStateAction<UploadedMusic[]>>;
    sampledMusic: UploadedMusic[];
    setSampledMusic: React.Dispatch<React.SetStateAction<UploadedMusic[]>>;
    sources: SampleData[];
    setSources: React.Dispatch<React.SetStateAction<SampleData[]>>;
    setLines: React.Dispatch<React.SetStateAction<Line[]>>;
}

const SampleBreakMode = ({setLines, sources, setSources, targetMusic, setTargetMusic, sampledMusic, setSampledMusic}: SampleBreakModeProps) => {
    const targetSource = sources.filter(({type}) => type == 'target');
    const sampledSources = sources.filter(({type}) => type == 'sampled');

    const handlePreviewClick = () => {
      const ts = sampledSources[0]; //TODO: Move to Kanye
      const breakSources: SampleData[] = KanYe.data.map(({speed, pitch, original, target}) => ({
        ...ts,
        id: v4(),
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

      setSources((prev) => [...prev, ...breakSources]);
      setLines((prev) => [...prev, {
        sampleLines: breakLines,
        id: v4()
      }]);
    }
    
    return <>
      <Button
        variant="outlined"
        sx={{ marginRight: "20px" }}
        onClick={handlePreviewClick}
      >
        Load preview
      </Button>
      {/* {
        breakResultSources.length > 0 && <SampleBreakResult sources={sources}/>
      } */}
      <div>
        Select Target
      </div>
      <MusicInput setSources={setSources} selectedFiles={targetMusic} setSelectedFiles={setTargetMusic} type='target'/>
      {
        targetSource.length > 0 && <WaveForm data={targetSource[0]} pixelPerSecond={10} />
      }
      <div>
        Select Original
      </div>
      <MusicInput setSources={setSources} multiple selectedFiles={sampledMusic} setSelectedFiles={setSampledMusic} type='sampled' />
      {
        sampledSources.map((s) => <WaveForm id={s.id} data={s} pixelPerSecond={10}/>)
      }
    </>
}

export default SampleBreakMode;