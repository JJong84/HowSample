import { useState } from 'react'
import { AudioContextProvider } from './useAudioContext';
import { SampleData, UploadedMusic } from './Type';
import SamplingMode from './SamplingMode';
import SampleBreakMode from './SampleBreakMode';
import { AddSourceModalProvider } from './useAddSourceModal';
import AddSourceModal from './AddSourceModal';
import { FormControlLabel, Switch } from '@mui/material';

function App() {
  const [targetMusic, setTargetMusic] = useState<UploadedMusic[]>([]);
  const [sampledMusic, setSampledMusic] = useState<UploadedMusic[]>([]);

  const [userMusic, setUserMusic] = useState<UploadedMusic[]>([]);
  const [sources, setSources] = useState<SampleData[]>([]);
  
  const [mode, setMode] = useState<'sampling' | 'break'>('sampling');

  const handleToggleClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setMode("break");
    } else {
      setMode("sampling");
    }
  }

  return (
    <AudioContextProvider>
      <AddSourceModalProvider>
        <header className='header'>
          <h1>
            How Sample?
          </h1>
          <FormControlLabel
            control={
              <Switch checked={mode == "break"} onChange={handleToggleClick} inputProps={{ 'aria-label': 'controlled' }} />
            }
            label={`${mode} mode`}
          />
        </header>
        <div className="main">
          {
            mode == "sampling" ? 
            <SamplingMode selectedFiles={userMusic} setSelectedFiles={setUserMusic} sources={sources} setSources={setSources} /> :
            <SampleBreakMode
              targetMusic={targetMusic}
              setTargetMusic={setTargetMusic}
              sampledMusic={sampledMusic}
              setSampledMusic={setSampledMusic}
              sources={sources}
              setSources={setSources}
            />
          }
        </div>
        <AddSourceModal sources={sources} setSources={setSources} />
      </AddSourceModalProvider>
    </AudioContextProvider>
  )
}

export default App