import React, { useRef, useState } from "react";
import { SampleData, WaveformHandle } from "./Type";
import WaveForm from "./Waveform_Modal";
import { useAddSourceModal } from "./useAddSourceModal";
import { Dialog, DialogContent, DialogTitle, Slider, Button, Box } from "@mui/material";
import { v4 } from "uuid";

interface AddSourceModalProps {
  sources: SampleData[];
  setSources: React.Dispatch<React.SetStateAction<SampleData[]>>;
}

const AddSourceModal = ({ setSources }: AddSourceModalProps) => {
  const { isModalOpen, speed, pitch, setSpeed, setPitch, source, closeModal, isEdit, startPoint, endPoint } =
    useAddSourceModal();
  const waveFormRef = useRef<WaveformHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pixelPerSecond, setPixelPerSecond] = useState(10);

  if (!source) return null;

  const playStop = () => {
    waveFormRef.current?.playStop();
  }

  const close = () => {
    waveFormRef.current?.stop();
    closeModal();
  };

  const apply = () => {
    if (isEdit) {
      setSources((prev) =>
        prev.map((s) =>
          s.id === source.id
            ? {
                ...s,
                speed,
                pitch,
                startPoint,
                endPoint: endPoint ? endPoint : s.audioBuffer.duration,
                edited: true,
              }
            : s
        )
      );
    } else {
      setSources((prev) => [
        ...prev,
        {
          ...source,
          id: v4(),
          speed,
          pitch,
          startPoint,
          endPoint: endPoint ? endPoint : source.audioBuffer.duration,
          edited: true,
        },
      ]);
    }

    waveFormRef.current?.stop();
    closeModal();
  };

  const handleChangeSpeed = (value: number) => {
    setSpeed(value);
  };

  const handleChangePitch = (value: number) => {
    setPitch(value);
  };

  const incrementPixelPerSecond = () => {
    setPixelPerSecond((prev) => prev + 5);
  };

  const decrementPixelPerSecond = () => {
    setPixelPerSecond((prev) => Math.max(prev - 5, 5));
  };

  return (
    <Dialog open={isModalOpen} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle>Adjust Waveform</DialogTitle>
      <DialogContent sx={{overflow: "hidden"}}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <Button
            variant="outlined"
            sx={{ marginRight: "20px" }}
            onClick={playStop}
          >
            Play
          </Button>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Button
              variant="outlined"
              onClick={decrementPixelPerSecond}
              sx={{ marginRight: "10px" }}
            >
              -
            </Button>
            <span>{pixelPerSecond} px/sec</span>
            <Button
              variant="outlined"
              onClick={incrementPixelPerSecond}
              sx={{ marginLeft: "10px" }}
            >
              +
            </Button>
          </Box>
        </Box>
        <Box
          ref={containerRef}
          sx={{
            width: "100%",
            height: "100px",
            border: "1px solid black",
            marginBottom: "20px",
            overflowY: "hidden",
            overflowX: "auto",
            position: "relative",
          }}
        >
          {source && <WaveForm ref={waveFormRef} pixelPerSecond={pixelPerSecond} data={source} speed={speed} pitch={pitch} />}
        </Box>
        <Box sx={{ marginBottom: "20px" }}>
          <Box>
            <label>Speed:</label>
            <Slider
              value={speed}
              onChange={(_, value) => handleChangeSpeed(value as number)}
              min={0.5}
              max={2.0}
              step={0.1}
              valueLabelDisplay="auto"
            />
            <span>{speed.toFixed(1)}x</span>
          </Box>
          <Box>
            <label>Pitch:</label>
            <Slider
              value={pitch}
              onChange={(_, value) => handleChangePitch(value as number)}
              min={-12}
              max={12}
              step={1}
              valueLabelDisplay="auto"
            />
            <span>{pitch} semitones</span>
          </Box>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Button
            variant="outlined"
            sx={{ marginRight: "10px" }}
            onClick={close}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={apply}
          >
            Apply
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AddSourceModal;