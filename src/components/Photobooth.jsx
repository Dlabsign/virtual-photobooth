// src/components/Photobooth.jsx
import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import '../resizable.css'; // Kita akan buat file CSS ini nanti

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

        {/* Mode Edit (Canvas + Manipulasi) */}
        {mode === 'edit' && imageSrc && (
          <div className="flex flex-col items-center space-y-4">
            
            {/* Area "Canvas" - Relatif untuk Manipulasi */}
            <div className="relative w-full max-w-md aspect-square bg-gray-200 border-4 border-gray-700 rounded-lg overflow-hidden">
              <img 
                src="URL_BINGKAI_ANDA" // Ganti dengan URL Bingkai (Frame)
                alt="Bingkai Photobooth"
                className="absolute inset-0 w-full h-full z-10 pointer-events-none"
              />

              <Draggable
                bounds="parent" // Batasi geseran di dalam "canvas"
                defaultPosition={{x: 0, y: 0}}
                onStop={onDragStop}
                position={photoPosition}
              >
                <Resizable
                  width={photoSize.width}
                  height={photoSize.height}
                  onResize={onResize}
                  minConstraints={[50, 50]}
                  maxConstraints={[400, 400]}
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
                // Di sini Anda bisa menambahkan fungsi "Download" atau "Selesai"
                onClick={() => alert('Fungsi Selesai/Download diimplementasikan di sini!')}
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

          </div>
        )}
      </div>
    </div>
  );
};

export default Photobooth;