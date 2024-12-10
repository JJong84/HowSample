import { BreakResult, SampleData, UploadedMusic } from "./Type";
import MusicInput from "./MusicInput";
import WaveForm from "./Waveform";
import SampleBreakResult from "./SampleBreakResult";
import "./style/sample-break.css";

interface SampleBreakModeProps {
    targetMusic: UploadedMusic[];
    setTargetMusic: React.Dispatch<React.SetStateAction<UploadedMusic[]>>;
    sampledMusic: UploadedMusic[];
    setSampledMusic: React.Dispatch<React.SetStateAction<UploadedMusic[]>>;
    sources: SampleData[];
    setSources: React.Dispatch<React.SetStateAction<SampleData[]>>;
}

const SampleBreakMode = ({sources, setSources, targetMusic, setTargetMusic, sampledMusic, setSampledMusic}: SampleBreakModeProps) => {
    const targetSource = sources.filter(({type}) => type == 'target');
    const sampledSources = sources.filter(({type}) => type == 'sampled');

    const makeMockup = () => {
      const result: BreakResult[] = [];
      for (let i = 0; i < 10; i ++) {
        result.push({
          source: {
            ...sampledSources[0],
            speed: 1.4,
            pitch: 2,
            startPoint: 3,
            endPoint: 4
          },
          offset: i * 2,
        })
      }
      return result;
    }
    
    return <>
      {
        sampledSources.length > 0 && <SampleBreakResult breakResults={makeMockup()}/>
      }
      <MusicInput setSources={setSources} selectedFiles={targetMusic} setSelectedFiles={setTargetMusic} type='target'/>
      {
        targetSource.length > 0 && <WaveForm data={targetSource[0]} pixelPerSecond={10} />
      }
      <MusicInput setSources={setSources} multiple selectedFiles={sampledMusic} setSelectedFiles={setSampledMusic} type='sampled' />
      {
        sampledSources.map((s) => <WaveForm id={s.id} data={s} pixelPerSecond={10}/>)
      }
    </>
}

export default SampleBreakMode;