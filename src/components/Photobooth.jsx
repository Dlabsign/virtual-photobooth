// src/components/Photobooth.jsx
import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import '../resizable.css'; // Pastikan file CSS ini ada dan diimpor

const videoConstraints = {
    width: 720,
    height: 720,
    facingMode: 'user'
};

const Photobooth = () => {
    const webcamRef = useRef(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [mode, setMode] = useState('initial'); // 'initial', 'camera', 'upload', 'edit'
    const [photoSize, setPhotoSize] = useState({ width: 200, height: 200 });
    const [photoPosition, setPhotoPosition] = useState({ x: 0, y: 0 });

    // Referensi untuk canvas output final
    const canvasRef = useRef(null);

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
        setPhotoSize({ width: 200, height: 200 });
        setPhotoPosition({ x: 0, y: 0 });
    };

    // Fungsi untuk menggabungkan foto dan frame lalu mendownloadnya
    const handleDownload = () => {
        if (!imageSrc) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Ukuran frame adalah 1080x1350
        const frameWidth = 1080;
        const frameHeight = 1350;

        canvas.width = frameWidth;
        canvas.height = frameHeight;

        // 1. Gambar frame terlebih dahulu
        const frameImage = new Image();
        frameImage.src = '/frame.png'; // Pastikan path ini benar

        frameImage.onload = () => {
            ctx.drawImage(frameImage, 0, 0, frameWidth, frameHeight);

            // 2. Gambar foto pengguna di atas frame
            const userPhoto = new Image();
            userPhoto.src = imageSrc;

            userPhoto.onload = () => {
                // Skalakan posisi dan ukuran foto pengguna agar sesuai dengan dimensi canvas (1080x1350)
                // Kita asumsikan area editing di UI adalah persegi (max-w-md aspect-square)
                // dan frame 1080x1350 memiliki rasio 4:5.
                // Untuk penyederhanaan, kita akan menggambar relatif terhadap canvas output akhir.
                // Penyesuaian ini mungkin perlu disempurnakan tergantung area 'hole' di frame Anda.

                // Misalnya, jika area editing visual di UI adalah 400px x 400px,
                // dan foto di drag/resize dalam area tersebut.
                // Anda perlu menghitung proporsi dari area editing ke canvas 1080x1350.
                // Jika rasio 'canvas' preview di UI adalah 400px (lebar) x 500px (tinggi)
                // dan frame adalah 1080x1350 (juga rasio 4:5), maka perhitungannya lebih mudah.

                // Asumsi: Kita akan menggambar foto pengguna secara proporsional di tengah frame
                // atau sesuai dengan posisi yang diatur oleh Draggable/Resizable.
                // Untuk mempermudah, kita akan asumsikan skala perbandingan dari preview ke final
                const scaleFactorX = frameWidth / 400; // Jika preview canvas adalah max 400px wide
                const scaleFactorY = frameHeight / 500; // Jika preview canvas adalah max 500px tall (contoh)

                // Ini adalah contoh sederhana. Anda perlu menyesuaikan scaleFactor
                // berdasarkan dimensi persis dari area editable di frame Anda.
                const currentPhotoWidth = photoSize.width * scaleFactorX;
                const currentPhotoHeight = photoSize.height * scaleFactorY;
                const currentPhotoX = photoPosition.x * scaleFactorX;
                const currentPhotoY = photoPosition.y * scaleFactorY;

                ctx.drawImage(userPhoto, currentPhotoX, currentPhotoY, currentPhotoWidth, currentPhotoHeight);

                // Download gambar yang sudah digabungkan
                const dataURL = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = dataURL;
                link.download = 'photobooth-result.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        };
    };


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <h1 className="text-3xl font-bold mb-6 text-indigo-600">Virtual Photobooth 📸</h1>
            <div className="w-full max-w-xl bg-white shadow-xl rounded-lg overflow-hidden p-6">

                {/* Kontrol Awal */}
                {mode === 'initial' && (
                    <div className="flex flex-col space-y-4">
                        <button
                            onClick={() => setMode('camera')}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition duration-300"
                        >
                            Buka Kamera 📷
                        </button>
                        <label className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition duration-300 text-center cursor-pointer">
                            Unggah Foto
                            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                    </div>
                )}

                {/* Mode Kamera */}
                {mode === 'camera' && (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="border-4 border-indigo-500 rounded-lg overflow-hidden w-full max-w-md aspect-square">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={videoConstraints}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={capture}
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300"
                            >
                                Ambil Foto 📸
                            </button>
                            <button
                                onClick={handleReset}
                                className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                )}

                {/* Mode Edit (Canvas Preview + Manipulasi) */}
                {mode === 'edit' && imageSrc && (
                    <div className="flex flex-col items-center space-y-4">

                        {/* Area "Canvas" - Relatif untuk Manipulasi
                Menggunakan aspect-h-[1350] / aspect-w-[1080] untuk rasio 1080x1350 (4:5)
                Kita akan membuat div ini memiliki lebar max-w-md (misal 448px)
                dan tinggi proporsional. 448 * (1350/1080) = 448 * 1.25 = 560px
            */}
                        <div className="relative w-full max-w-md aspect-[4/5] bg-gray-200 border-4 border-gray-700 rounded-lg overflow-hidden">
                            <img
                                src="/frame.png" // Path ke frame PNG Anda di folder public
                                alt="Bingkai Photobooth"
                                className="absolute inset-0 w-full h-full z-10 object-cover pointer-events-none"
                            />

                            <Draggable
                                bounds="parent" // Batasi geseran di dalam "canvas" preview
                                defaultPosition={{ x: 0, y: 0 }} // Set posisi awal foto (bisa disesuaikan)
                                onStop={onDragStop}
                                position={photoPosition}
                            >
                                <Resizable
                                    width={photoSize.width}
                                    height={photoSize.height}
                                    onResize={onResize}
                                    minConstraints={[50, 50]} // Ukuran minimal foto
                                    maxConstraints={[400, 500]} // Ukuran maksimal foto agar tidak melebihi area frame (disesuaikan dengan rasio 4:5)
                                >
                                    <img
                                        src={imageSrc}
                                        alt="Foto yang Diunggah/Diambil"
                                        style={{
                                            width: photoSize.width,
                                            height: photoSize.height,
                                            cursor: 'move', // Kursor geser
                                        }}
                                        className="object-cover absolute"
                                    />
                                </Resizable>
                            </Draggable>
                        </div>

                        {/* Kontrol Edit */}
                        <div className="flex space-x-4">
                            <button
                                onClick={handleDownload} // Panggil fungsi download
                                className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition duration-300"
                            >
                                Selesai & Download 💾
                            </button>
                            <button
                                onClick={handleReset}
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition duration-300"
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