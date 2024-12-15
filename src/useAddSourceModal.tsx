import React, { createContext, useContext, useState } from 'react';
import { SampleData } from './Type';

interface AddSourceContextType {
    isModalOpen: boolean;
    speed: number;
    pitch: number;
    source: SampleData | null;
    openModal: (source: SampleData, isEdit: boolean) => void;
    closeModal: () => void;
    setSpeed: (value: number) => void;
    setPitch: (value: number) => void;
    startPoint: number;
    endPoint: number;
    setStartPoint: (value: number) => void;
    setEndPoint: (value: number) => void;
    isEdit: boolean;
}

const AddSourceModalContext = createContext<AddSourceContextType | undefined>(undefined);

export const AddSourceModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [speed, setSpeed] = useState(1.0);
    const [pitch, setPitch] = useState(0);
    const [startPoint, setStartPoint] = useState(0);
    const [endPoint, setEndPoint] = useState(0);
    const [source, setSource] = useState<SampleData | null>(null);
    const [isEdit, setIsEdit] = useState(false);

    const openModal = (source: SampleData, isEdit: boolean) => {
        setSource(source);
        setSpeed(source.speed);
        setPitch(source.pitch);
        setModalOpen(true);
        setIsEdit(isEdit);
        setStartPoint(source.startPoint);
        setEndPoint(source.endPoint);
    };

    const closeModal = () => {
        setModalOpen(false);
    };

    return (
        <AddSourceModalContext.Provider
            value={{
                isModalOpen,
                speed,
                pitch,
                source,
                openModal,
                closeModal,
                setSpeed,
                setPitch,
                startPoint,
                setStartPoint,
                endPoint,
                setEndPoint,
                isEdit,
            }}
        >
            {children}
        </AddSourceModalContext.Provider>
    );
};

export const useAddSourceModal = () => {
    const context = useContext(AddSourceModalContext);
    if (!context) {
        throw new Error('No Modal Context');
    }
    return context;
};
