import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react";
// 'Resizable' sudah tidak digunakan
// import { Resizable } from "react-resizable"; 

const PhotoMaskEditor = forwardRef(
    // PERBAIKAN: Hapus 'frameRatio' dari props
    ({ imageSrc, facingMode = "environment" }, ref) => {

        const [offset, setOffset] = useState({ x: 0, y: 0 });
        const [dragging, setDragging] = useState(false);
        const [startPos, setStartPos] = useState({ x: 0, y: 0 });
        const [editable, setEditable] = useState(false);
        const [finished, setFinished] = useState(false);

        // PERBAIKAN: State baru untuk mengontrol format frame
        const [currentFrame, setCurrentFrame] = useState("4-5"); // '4-5' atau '9-16'

        const editorRef = useRef(null);
        const canvasRef = useRef(null);

        useEffect(() => {
            if (imageSrc) {
                setEditable(true);
                setFinished(false);
                setOffset({ x: 0, y: 0 });
            }
        }, [imageSrc]);

        const handleMouseDown = (e) => {
            if (!editable) return;
            e.preventDefault();
            setDragging(true);
            setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        };

        const handleMouseMove = (e) => {
            if (!dragging || !editable) return;
            setOffset({
                x: e.clientX - startPos.x,
                y: e.clientY - startPos.y,
            });
        };

        const handleMouseUp = () => setDragging(false);

        const handleDownload = () => {
            if (!imageSrc || !canvasRef.current || !editorRef.current) return;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            // PERBAIKAN: Gunakan 'currentFrame' (state) bukan 'frameRatio' (prop)
            const isStory = currentFrame === "9-16";
            const frameWidth = 1080;
            const frameHeight = isStory ? 1920 : 1350;
            const frameSrc = isStory ? "/frame-story.png" : "/frame.png"; // <-- Dinamis

            const dpr = window.devicePixelRatio || 1;
            canvas.width = frameWidth * dpr;
            canvas.height = frameHeight * dpr;
            ctx.scale(dpr, dpr);

            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, frameWidth, frameHeight);

            const frameImage = new Image();
            const userPhoto = new Image();
            frameImage.crossOrigin = userPhoto.crossOrigin = "Anonymous";
            frameImage.src = frameSrc; // <-- Gunakan frameSrc yang benar
            userPhoto.src = imageSrc;

            Promise.all([
                new Promise((res) => (frameImage.onload = res)),
                new Promise((res) => (userPhoto.onload = res)),
            ]).then(() => {
                const editorW = editorRef.current.offsetWidth;
                const scale = frameWidth / editorW;

                ctx.save();

                if (facingMode === "user") {
                    ctx.translate(frameWidth, 0);
                    ctx.scale(-1, 1);
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";

                const drawX = offset.x * scale;
                const drawY = offset.y * scale;
                const drawW = frameWidth;
                const drawH = frameHeight;

                const imgWidth = userPhoto.naturalWidth;
                const imgHeight = userPhoto.naturalHeight;
                const imgRatio = imgWidth / imgHeight;
                const containerRatio = drawW / drawH;

                let sx = 0;
                let sy = 0;
                let sWidth = imgWidth;
                let sHeight = imgHeight;

                if (imgRatio > containerRatio) {
                    sHeight = imgHeight;
                    sWidth = imgHeight * containerRatio;
                    sx = (imgWidth - sWidth) / 2;
                } else {
                    sWidth = imgWidth;
                    sHeight = imgWidth / containerRatio;
                    sy = (imgHeight - sHeight) / 2;
                }

                ctx.drawImage(
                    userPhoto,
                    sx, sy, sWidth, sHeight,
                    drawX, drawY, drawW, drawH
                );

                ctx.restore();
                ctx.drawImage(frameImage, 0, 0, frameWidth, frameHeight);

                const dataURL = canvas.toDataURL("image/png", 1.0);
                const link = document.createElement("a");
                link.href = dataURL;
                link.download = isStory ? "photobooth-story.png" : "photobooth-post.png";
                link.click();
            });
        };

        useImperativeHandle(ref, () => ({
            downloadPhoto: handleDownload,
        }));

        // PERBAIKAN: Variabel ini sekarang bergantung pada 'currentFrame' (state)
        const isStory = currentFrame === "9-16";
        const aspectRatio = isStory ? "9 / 16" : "4 / 5";
        const frameSrc = isStory ? "/frame-story.png" : "/frame.png";

        return (
            <div
                className="flex flex-col items-center space-y-6"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    ref={editorRef}
                    className="relative w-full max-w-sm rounded-xl overflow-hidden bg-gray-900 shadow-2xl transition-all" // Tambah transisi
                    style={{ aspectRatio }} // <-- Dinamis
                >
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            transform: `translate(${offset.x}px, ${offset.y}px)`,
                            cursor: editable ? (dragging ? "grabbing" : "grab") : "default",
                        }}
                        onMouseDown={handleMouseDown}
                    >
                        <img
                            src={imageSrc}
                            alt="Foto"
                            draggable={false}
                            className="w-full h-full object-cover select-none"
                        />
                    </div>

                    <img
                        src={frameSrc} // <-- Dinamis
                        alt="Frame"
                        className="absolute inset-0 w-full h-full pointer-events-none"
                    />
                </div>

                {/* --- PERBAIKAN: Tombol Kontrol --- */}
                {editable && !finished && (
                    <div className="flex flex-col items-center space-y-4 w-full max-w-sm">
                        {/* Tombol Pilihan Format */}
                        <div className="flex space-x-2 w-full">
                            <button
                                onClick={() => setCurrentFrame("4-5")}
                                className={`w-full px-4 py-2 rounded-lg transition-colors ${currentFrame === "4-5"
                                        ? "bg-blue-600 text-white font-bold"
                                        : "bg-gray-700 text-gray-300"
                                    }`}
                            >
                                Feed
                            </button>
                            <button
                                onClick={() => setCurrentFrame("9-16")}
                                className={`w-full px-4 py-2 rounded-lg transition-colors ${currentFrame === "9-16"
                                        ? "bg-blue-600 text-white font-bold"
                                        : "bg-gray-700 text-gray-300"
                                    }`}
                            >
                                Story
                            </button>
                        </div>

                        {/* Tombol Selesai */}
                        <button
                            onClick={() => {
                                setEditable(false);
                                setFinished(true);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg w-full"
                        >
                            Selesai
                        </button>
                    </div>
                )}

                {finished && (
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Download
                    </button>
                )}
                {/* --- AKHIR PERBAIKAN --- */}

                <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
        );
    }
);

export default PhotoMaskEditor;