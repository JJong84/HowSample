// //real-time frequency count

// import { useEffect, useRef } from "react";
// import { useAudioContext } from "./useAudioContext";
// import { SampleData } from "./Type";

// interface Props {
//     data: SampleData,
// }

// // const analyzer = audioContext.createAnalyser();
// // analyzer.fftSize = 256;

// // const source = audioContext.createBufferSource();
// // source.buffer = audioBuffer;
// // source.connect(analyzer);
// // analyzer.connect(audioContext.destination);

// // const bufferLength = analyzer.frequencyBinCount;
// // const dataArray = new Uint8Array(bufferLength);
// // analyzer.getByteTimeDomainData(dataArray);

// const WaveForm = ({data}: Props) => {
//     const {audioContext} = useAudioContext();
//     const {soundSource, analyzer} = data;
//     const waveformRef = useRef<HTMLCanvasElement>(null);

//     const initialize = async () => {
//         if (!waveformRef.current) {
//             return;
//         }
//         const canvasContext = waveformRef.current.getContext('2d');
//         if (!canvasContext) {
//             return;
//         }
        
//         const WIDTH = waveformRef.current?.width;
//         const HEIGHT = waveformRef.current?.height;
//         canvasContext.clearRect(0, 0, WIDTH, HEIGHT);
//     }

//     useEffect(() => {
//         initialize().then((() => {
//             console.log("initialize done");
//         }));
//     }, []);

//     useEffect(() => {
//         draw();
//     }, [analyzer]);

//     const draw = () => {
//         // console.log('draw');
//         if (!analyzer) {
//             console.log("no analyzer");
//             return;
//         }
//         if (!waveformRef.current) {
//             return;
//         }
//         const canvasContext = waveformRef.current.getContext('2d');
//         if (!canvasContext) {
//             return;
//         }

//         requestAnimationFrame(draw);

//         const bufferLength = analyzer.frequencyBinCount;
//         const dataArray = new Uint8Array(bufferLength);
//         analyzer.getByteTimeDomainData(dataArray);

//         const WIDTH = waveformRef.current.width;
//         const HEIGHT = waveformRef.current.height;

//         // Clear
//         canvasContext.fillStyle = "rgb(200 200 200)";
//         canvasContext.fillRect(0, 0, WIDTH, HEIGHT);

//         const barWidth = (WIDTH / bufferLength);
//         let barHeight;
//         let x = 0;

//         for (let i = 0; i < bufferLength; i++) {
//             // console.log(i, dataArray[i])
//             barHeight = dataArray[i] / 2;
          
//             canvasContext.fillStyle = `rgb(${barHeight + 100} 50 50)`;
//             canvasContext.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight);
          
//             x += barWidth + 1;
//         }
//     }

//     const handleClickPlay = () => {
//         soundSource?.start(0);
//     };

//     return <>
//         <button onClick={handleClickPlay}>Play Music</button>
//         <canvas ref={waveformRef} />
//     </>
// };

// export default WaveForm;