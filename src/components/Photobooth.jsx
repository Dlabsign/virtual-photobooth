// src/components/Photobooth.jsx
import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import '../resizable.css'; // Pastikan file CSS ini ada dan diimpor

const videoConstraints = {
    // Kami menjaga ini di 720p tetapi rasionya akan di-crop oleh container UI
    width: 720,
    height: 720,
    facingMode: 'user'
};

const Photobooth = () => {
    const webcamRef = useRef(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [mode, setMode] = useState('initial'); // 'initial', 'camera', 'upload', 'edit'
    // Ukuran default pratinjau foto
    const [photoSize, setPhotoSize] = useState({ width: 250, height: 250 });
    const [photoPosition, setPhotoPosition] = useState({ x: 0, y: 0 });

    const canvasRef = useRef(null);
    const previewContainerRef = useRef(null);

    const capture = useCallback(() => {
        const screenshot = webcamRef.current.getScreenshot();
        setImageSrc(screenshot);
        setMode('edit');
    }, [webcamRef]);

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

    const handleDownload = () => {
        if (!imageSrc || !canvasRef.current || !previewContainerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Dimensi Frame Final (1080x1350)
        const frameWidth = 1080;
        const frameHeight = 1350;

        // Dimensi Container Pratinjau (sesuai dengan UI saat ini)
        const previewWidth = previewContainerRef.current.offsetWidth;
        const previewHeight = previewContainerRef.current.offsetHeight;

        canvas.width = frameWidth;
        canvas.height = frameHeight;

        // Hitung faktor skala dari pratinjau (misal 400x500) ke final output (1080x1350)
        const scaleFactorX = frameWidth / previewWidth;
        const scaleFactorY = frameHeight / previewHeight;

        const frameImage = new Image();
        frameImage.crossOrigin = 'Anonymous';
        frameImage.src = '/frame.png';

        frameImage.onload = () => {
            // 1. Gambar frame terlebih dahulu
            ctx.drawImage(frameImage, 0, 0, frameWidth, frameHeight);

            const userPhoto = new Image();
            userPhoto.crossOrigin = 'Anonymous';
            userPhoto.src = imageSrc;

            userPhoto.onload = () => {
                // 2. Skalakan posisi dan ukuran foto pengguna
                const finalPhotoWidth = photoSize.width * scaleFactorX;
                const finalPhotoHeight = photoSize.height * scaleFactorY;
                const finalPhotoX = photoPosition.x * scaleFactorX;
                const finalPhotoY = photoPosition.y * scaleFactorY;

                // 3. Gambar foto pengguna
                ctx.drawImage(userPhoto, finalPhotoX, finalPhotoY, finalPhotoWidth, finalPhotoHeight);

                // Download
                try {
                    const dataURL = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.href = dataURL;
                    link.download = 'photobooth-result.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (error) {
                    console.error("Gagal mendownload gambar:", error);
                    alert("Error: Gagal memproses gambar untuk diunduh.");
                }
            };
            userPhoto.onerror = () => alert("Gagal memuat foto pengguna.");
        };

        frameImage.onerror = () => {
            console.error("Gagal memuat file frame.png. Cek path '/frame.png'");
            alert("Error: File frame.png tidak ditemukan. Pastikan file ada di folder public.");
        };
    };


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-grey-900 p-1">
            {/* <h1 className="text-3xl font-extrabold mb-8 text-indigo-700">Virtual Photobooth 📸</h1> */}
            <div className="w-full max-w-xl  shadow-2xl overflow-hidden ">

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
                {mode === 'camera' && (
                    <div className="flex flex-col items-center space-y-4">
                        {/* Container Webcam + Frame (Proporsional 4:5) */}
                        <div
                            ref={previewContainerRef} // Ref untuk mendapatkan dimensi saat runtime
                            className="relative w-full max-w-sm aspect-[4/5] bg-gray-800 rounded-lg overflow-hidden shadow-2xl"
                        >
                            {/* 1. Webcam di bawah Frame (z-10) */}
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={videoConstraints}
                                className="w-full h-full object-cover relative z-10"
                            />

                            {/* 2. FRAME SEBAGAI OVERLAY DI ATAS WEBCAM (z-20) */}
                            <img
                                src="/frame.png"
                                alt="Bingkai Photobooth"
                                className="absolute inset-0 w-full h-full z-20 object-contain pointer-events-none"
                            />
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={capture}
                                className="bg-red-500 flex-1  hover:bg-red-600 text-white font-semibold py-2 px-4 rounded text-xs shadow-lg transition duration-300"
                                
                            >
                                Ambil Foto
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