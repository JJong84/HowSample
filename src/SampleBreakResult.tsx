// import { Button } from "@mui/material";
// import { BreakResponse, SampleData } from "./Type";
// import WaveForm from "./Waveform";
// import { useAudioContext } from "./useAudioContext";
// import { useMemo } from "react";

// interface SampleBreakModeProps {
//   breakResults: BreakResponse;
// }

// const SampleBreakResult = ({breakResults}: SampleBreakModeProps) => {
//   const {audioContext, createPitchShiftNode} = useAudioContext();
  
//     const handlePlayClick = () => {
//       breakResults.forEach((result) => {
//         const sourceNode = audioContext.createBufferSource();
//         sourceNode.buffer = result.source.audioBuffer;
        
//         const {speed, pitch, startPoint, endPoint} = result.source;
//         const node = createPitchShiftNode(speed, pitch);
//         const startTime = result.offset + audioContext.currentTime;
//         sourceNode.connect(node).connect(audioContext.destination);
//         sourceNode.start(startTime, startPoint, endPoint - startPoint);
//       });
//   }

//   const usedSources = useMemo(() => {
//     const result: SampleData[] = [];
//     breakResults.forEach((res) => {
//       if (result.every((r) => r.id != res.source.id)) {
//         result.push(res.source);
//       }
//     });
//     return result;
//   }, [breakResults]);

//     return <div className="sample-break-result">
//       <Button onClick={handlePlayClick}>Play All</Button>
//         {
//           usedSources.map((source) => 
//             <WaveForm id={source.id} data={source} pixelPerSecond={10} />
//           )
//         }
//     </div>
// }

// export default SampleBreakResult;