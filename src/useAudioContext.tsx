import { createContext, useContext, useMemo } from 'react';
import { publicUrl } from './Helpers';

const AudioContextContext = createContext<{
    audioContext: AudioContext;
    createPitchShiftNode: (speed: number, pitch: number) => AudioWorkletNode;
    offlineAudioContext: OfflineAudioContext;
    createPitchShiftNodeForOffline: () => AudioWorkletNode; //FIXME: move
} | null>(null);

export const AudioContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const audioContext = useMemo(() => {
        const context = new AudioContext();
        // async function
        context.audioWorklet.addModule(`${publicUrl}/phase-vocoder.js`).then(() => {
            console.log('phase vocoder file load done');
        });
        return context;
    }, []);

    const offlineAudioContext = useMemo(() => {
        const offlineContext = new OfflineAudioContext(
            2,
            audioContext.sampleRate * 20, // 20s max
            audioContext.sampleRate, // sample rate
        );

        // async function
        offlineContext.audioWorklet.addModule(`${publicUrl}/phase-vocoder.js`).then(() => {
            console.log('offline context - phase vocoder file load done');
        });
        return offlineContext;
    }, []);

    const createPitchShiftNode = () => {
        return new AudioWorkletNode(audioContext, 'phase-vocoder-processor');
    };

    const createPitchShiftNodeForOffline = () => {
        return new AudioWorkletNode(offlineAudioContext, 'phase-vocoder-processor');
    };

    return (
        <AudioContextContext.Provider
            value={{
                audioContext,
                offlineAudioContext,
                createPitchShiftNode,
                createPitchShiftNodeForOffline,
            }}
        >
            {children}
        </AudioContextContext.Provider>
    );
};

export const useAudioContext = () => {
    const context = useContext(AudioContextContext);

    if (!context) {
        throw new Error('useAudioContext must be used within an AudioContextProvider');
    }

    return context;
};
