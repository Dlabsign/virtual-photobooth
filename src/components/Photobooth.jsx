// src/components/Photobooth.jsx
import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import '../resizable.css'; // Pastikan file CSS ini ada dan diimpor


const Photobooth = () => {
    const webcamRef = useRef(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [mode, setMode] = useState('initial'); // 'initial', 'camera', 'upload', 'edit'
    // Ukuran default pratinjau foto
    const [photoSize, setPhotoSize] = useState({ width: 250, height: 250 });
    const [photoPosition, setPhotoPosition] = useState({ x: 0, y: 0 });
    const [notification, setNotification] = useState("");

    const [facingMode, setFacingMode] = useState('user');
    // const [aspectRatio, setAspectRatio] = useState("4:5"); // ✅ pilihan frame
    const [frameRatio, setFrameRatio] = useState('4-5');

    const videoConstraints = {
        width: 2560,
        height: 1440,
        facingMode: facingMode,
    };


    const canvasRef = useRef(null);
    const previewContainerRef = useRef(null);

    const capture = useCallback(() => {
        if (!webcamRef.current) return;
        const video = webcamRef.current.video;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL("image/png", 1.0);
        setImageSrc(dataURL);
        setMode("frozen");
    }, []);



    const handleDownload = () => {
        if (!imageSrc) return;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const isStory = frameRatio === "9-16";
        const frameWidth = 1080;
        const frameHeight = isStory ? 1920 : 1350;
        const frameSrc = isStory ? "/frame-story.png" : "/frame.png";

        canvas.width = frameWidth;
        canvas.height = frameHeight;

        const frameImage = new Image();
        const userPhoto = new Image();
        frameImage.crossOrigin = userPhoto.crossOrigin = "anonymous";
        frameImage.src = frameSrc;
        userPhoto.src = imageSrc;

        Promise.all([
            new Promise((res) => (frameImage.onload = res)),
            new Promise((res) => (userPhoto.onload = res)),
        ]).then(() => {
            const imgRatio = userPhoto.width / userPhoto.height;
            const frameRatioNum = frameWidth / frameHeight;

            let sx, sy, sWidth, sHeight;
            if (imgRatio > frameRatioNum) {
                sHeight = userPhoto.height;
                sWidth = sHeight * frameRatioNum;
                sx = (userPhoto.width - sWidth) / 2;
                sy = 0;
            } else {
                sWidth = userPhoto.width;
                sHeight = sWidth / frameRatioNum;
                sx = 0;
                sy = (userPhoto.height - sHeight) / 2;
            }

            ctx.drawImage(userPhoto, sx, sy, sWidth, sHeight, 0, 0, frameWidth, frameHeight);
            ctx.drawImage(frameImage, 0, 0, frameWidth, frameHeight);

            const dataURL = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement("a");
            link.href = dataURL;
            link.download = isStory ? "photobooth-story.png" : "photobooth-post.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };



    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageSrc(reader.result);
                setMode('edit');
            };
            reader.readAsDataURL(file);
        }
    };

    const onResize = (event, { size }) => {
        setPhotoSize(size);
    };

    const onDragStop = (event, data) => {
        setPhotoPosition({ x: data.x, y: data.y });
    };

    const handleReset = () => {
        setImageSrc(null);
        setMode('initial');
        setPhotoSize({ width: 250, height: 250 });
        setPhotoPosition({ x: 0, y: 0 });
    };


    return (
        <div className="flex flex-col items-center justify-start min-h-screen bg-grey-900 p-1">
            {/* <h1 className="text-3xl font-extrabold mb-8 text-indigo-700">Virtual Photobooth 📸</h1> */}
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-black overflow-hidden">

                {/* Kontrol Awal */}
                {mode === 'initial' && (
                    <div className="flex flex-col space-y-4">
                        <button
                            onClick={() => setMode('camera')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded shadow-md transition duration-300 transform hover:scale-[1.02]"
                        >
                            Buka Kamera 📷
                        </button>
                        <label className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded shadow-md transition duration-300 text-center cursor-pointer transform hover:scale-[1.02]">
                            Unggah Foto
                            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                    </div>
                )}

                {/* Mode Kamera (Frame ditampilkan di atas Webcam) */}
                {/* Mode Kamera */}
                {mode === 'camera' && (
                    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">

                        <div
                            ref={previewContainerRef}
                            className={`relative w-screen ${frameRatio === '4-5' ? 'aspect-[4/5]' : 'aspect-[9/16]'
                                } bg-black overflow-hidden`}
                            style={{
                                WebkitMaskImage: `url(${frameRatio === '4-5' ? '/frame.png' : '/frame-story.png'})`,
                                maskImage: `url(${frameRatio === '4-5' ? '/frame.png' : '/frame-story.png'})`,
                                WebkitMaskSize: 'cover',
                                maskSize: 'cover',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center'
                            }}
                        >
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/png"
                                videoConstraints={videoConstraints}
                                className="absolute inset-0 w-full h-full object-cover"
                            />

                            {/* Frame visual, hanya sebagai dekorasi (tidak mempengaruhi mask) */}
                            <img
                                src={frameRatio === '4-5' ? '/frame.png' : '/frame-story.png'}
                                alt="Bingkai Photobooth"
                                className="absolute inset-0 w-full h-full z-20 object-cover pointer-events-none"
                            />
                        </div>

                        {/* Tombol kontrol */}
                        <div className="mt-4 flex w-full px-4 space-x-3">
                            <button
                                onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                                className="bg-yellow-500 flex-1 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded text-xs shadow-lg transition duration-300"
                            >
                                🔄 Flip Kamera
                            </button>
                            <button
                                onClick={capture}
                                className="bg-red-500 flex-1 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded text-xs shadow-lg transition duration-300"
                            >
                                Ambil Foto
                            </button>
                            <button
                                onClick={() => setFrameRatio((prev) => (prev === '4-5' ? '9-16' : '4-5'))}
                                className="bg-blue-500 flex-1 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded text-xs shadow-lg transition duration-300"
                            >
                                {frameRatio === '4-5' ? '📱 Vertikal' : '🖼️ Horizontal'}
                            </button>
                            <button
                                onClick={handleReset}
                                className="bg-gray-400 flex-1 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded text-xs shadow-lg transition duration-300"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                )}


                {/* Mode Frozen */}
                {mode === 'frozen' && imageSrc && (
                    <div className="flex flex-col items-center space-y-4">
                        <div className={`relative w-full max-w-sm ${frameRatio === '4-5' ? 'aspect-[4/5]' : 'aspect-[9/16]'} bg-gray-800 rounded-lg overflow-hidden shadow-2xl`}>
                            <img
                                src={imageSrc}
                                alt="Foto Hasil"
                                className="absolute inset-0 w-full h-full object-cover z-10"
                            />
                            <img
                                src={frameRatio === '4-5' ? '/frame.png' : '/frame-story.png'}
                                alt="Frame"
                                className="absolute inset-0 w-full h-full z-20 object-cover pointer-events-none"
                            />
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={handleDownload}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-[1.05]"
                            >
                                Download 💾
                            </button>
                            <button
                                onClick={handleReset}
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-[1.05]"
                            >
                                Ulangi 🔄
                            </button>
                        </div>
                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                    </div>
                )}


                {/* Mode Edit (Frame ditampilkan di atas Foto) */}
                {mode === 'edit' && imageSrc && (
                    <div className="flex flex-col items-center space-y-6">

                        {/* Area "Canvas" - Proporsional 4:5 */}
                        <div
                            ref={previewContainerRef} // Ref untuk mendapatkan dimensi saat runtime
                            className="relative w-full max-w-sm aspect-[4/5] bg-gray-800 border-8 border-gray-700 rounded-lg overflow-hidden shadow-2xl"
                        >
                            {/* 1. FRAME SEBAGAI OVERLAY (z-20) */}
                            <img
                                src="/frame.png"
                                alt="Bingkai Photobooth"
                                className="absolute inset-0 w-full h-full z-20 object-contain pointer-events-none"
                            />

                            {/* 2. Draggable/Resizable Foto (z-10) */}
                            <Draggable
                                bounds="parent"
                                onStop={onDragStop}
                                position={photoPosition}
                            >
                                <Resizable
                                    width={photoSize.width}
                                    height={photoSize.height}
                                    onResize={onResize}
                                    minConstraints={[50, 50]}
                                    // Batasan sekitar 400x500 di UI Preview
                                    maxConstraints={[400, 500]}
                                >
                                    <img
                                        src={imageSrc}
                                        alt="Foto yang Diunggah/Diambil"
                                        style={{
                                            width: photoSize.width,
                                            height: photoSize.height,
                                            cursor: 'move',
                                        }}
                                        className="object-cover absolute z-10"
                                    />
                                </Resizable>
                            </Draggable>
                        </div>


                        {/* Kontrol Edit */}
                        <div className="flex space-x-4">
                            <button
                                onClick={handleDownload}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-[1.05]"
                            >
                                Selesai & Download 💾
                            </button>
                            <button
                                onClick={handleReset}
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-[1.05]"
                            >
                                Ulangi 🔄
                            </button>
                        </div>

                        {/* Hidden Canvas untuk Proses Download */}
                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

                    </div>
                )}
            </div>
        </div>
    );
};

export default Photobooth;