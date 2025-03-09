import { useState } from 'react';
import { AudioContextProvider } from './useAudioContext';
import { BreakResponse, Line, SampleData, UploadedMusic } from './Type';
import SamplingMode from './SamplingMode';
import SampleBreakMode from './SampleBreakMode';
import { AddSourceModalProvider } from './useAddSourceModal';
import AddSourceModal from './AddSourceModal';
import { FormControlLabel, Switch, Typography } from '@mui/material';
import { v4 } from 'uuid';

function App() {
    const [targetMusic, setTargetMusic] = useState<UploadedMusic[]>([]);
    const [sampledMusic, setSampledMusic] = useState<UploadedMusic[]>([]);

    const [userMusic, setUserMusic] = useState<UploadedMusic[]>([]);
    const [sources, setSources] = useState<SampleData[]>([]);
    const [lines, setLines] = useState<Line[]>([{ id: v4(), sampleLines: [] }]);
    const [breakResult, setBreakResult] = useState<BreakResponse>([]);

    const [mode, setMode] = useState<'sampler' | 'breakdown'>('sampler');

    const handleToggleClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setMode('breakdown');
        } else {
            setMode('sampler');
        }
    };

    return (
        <AudioContextProvider>
            <AddSourceModalProvider>
                <header className="header">
                    <Typography variant="h3" sx={{ marginBottom: 2 }}>
                        How Sample?
                    </Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={mode == 'breakdown'}
                                onChange={handleToggleClick}
                                inputProps={{ 'aria-label': 'controlled' }}
                            />
                        }
                        label={`${mode} mode`}
                        sx={{
                            '& .MuiFormControlLabel-label': {
                                textTransform: 'capitalize',
                                width: 130
                            },
                        }}
                    />
                </header>
                <div className="main">
                    {mode == 'sampler' ? (
                        <SamplingMode
                            selectedFiles={userMusic}
                            setSelectedFiles={setUserMusic}
                            sources={sources}
                            setSources={setSources}
                            lines={lines}
                            setLines={setLines}
                        />
                    ) : (
                        <SampleBreakMode
                            targetMusic={targetMusic}
                            setTargetMusic={setTargetMusic}
                            sampledMusic={sampledMusic}
                            setSampledMusic={setSampledMusic}
                            sources={sources}
                            setSources={setSources}
                            setLines={setLines}
                            breakResult={breakResult}
                            setBreakResult={setBreakResult}
                        />
                    )}
                </div>
                <AddSourceModal sources={sources} setSources={setSources} />
            </AddSourceModalProvider>
        </AudioContextProvider>
    );
}

export default App;
