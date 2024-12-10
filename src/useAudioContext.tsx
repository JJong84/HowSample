import { createContext, useContext, useMemo } from "react";

const publicUrl = import.meta.env.BASE_URL;

// AudioContext 생성 및 관리
const AudioContextContext = createContext<{audioContext: AudioContext, createPitchShiftNode: (speed: number, pitch: number) => AudioWorkletNode} | null>(null);

export const AudioContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioContext = useMemo(() => {
    const context = new AudioContext();
    // async function
    context.audioWorklet.addModule(`${publicUrl}/phase-vocoder.js`).then(() => {
      console.log("phase vocoder file load done");
    });
    return context;
  }, []);

  const createPitchShiftNode = () => {
    return new AudioWorkletNode(audioContext, "phase-vocoder-processor");
  }

    return <AudioContextContext.Provider value={{audioContext, createPitchShiftNode}}>
        {children}
    </AudioContextContext.Provider>;
};

export const useAudioContext = () => {
  const context = useContext(AudioContextContext);

  if (!context) {
    throw new Error("useAudioContext must be used within an AudioContextProvider");
  }

  return context;
};