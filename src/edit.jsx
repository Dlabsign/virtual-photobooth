import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react";

const PhotoMaskEditor = forwardRef(
    ({ imageSrc, facingMode = "environment" }, ref) => {
        // ... (Semua state dan fungsi dari handleDownload sampai useImperativeHandle
        // ... tidak ada yang berubah di sini, jadi saya sembunyikan agar ringkas) ...

        const [offset, setOffset] = useState({ x: 0, y: 0 });
        const [dragging, setDragging] = useState(false);
        const [startPos, setStartPos] = useState({ x: 0, y: 0 });
        const [editable, setEditable] = useState(false);
        const [finished, setFinished] = useState(false);
        const [currentFrame, setCurrentFrame] = useState("4-5");
        const [scale, setScale] = useState(1);
        const [isPinching, setIsPinching] = useState(false);
        const initialPinchDistance = useRef(0);
        const initialScale = useRef(1);
        const editorRef = useRef(null);
        const canvasRef = useRef(null);

        useEffect(() => {
            if (imageSrc) {
                setEditable(true);
                setFinished(false);
                setOffset({ x: 0, y: 0 });
                setScale(1);
                initialScale.current = 1;
            }
        }, [imageSrc]);

        const getDistance = (touches) => {
            const [touch1, touch2] = touches;
            return Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
        };

        const clampScale = (newScale) => Math.max(0.5, Math.min(newScale, 4));

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

        const handleWheel = (e) => {
            if (!editable) return;
            e.preventDefault();
            const scaleAmount = e.deltaY > 0 ? -0.1 : 0.1;
            setScale((prevScale) => clampScale(prevScale + scaleAmount));
        };

        const handleTouchStart = (e) => {
            if (!editable) return;
            if (e.touches.length === 2) {
                setIsPinching(true);
                setDragging(false);
                initialPinchDistance.current = getDistance(e.touches);
                initialScale.current = scale;
            } else if (e.touches.length === 1) {
                setDragging(true);
                setIsPinching(false);
                const touch = e.touches[0];
                setStartPos({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
            }
        };

        const handleTouchMove = (e) => {
            if (!editable) return;
            e.preventDefault();
            if (isPinching && e.touches.length === 2) {
                const newDistance = getDistance(e.touches);
                const scaleFactor = newDistance / initialPinchDistance.current;
                setScale(clampScale(initialScale.current * scaleFactor));
            } else if (dragging && e.touches.length === 1) {
                const touch = e.touches[0];
                setOffset({
                    x: touch.clientX - startPos.x,
                    y: touch.clientY - startPos.y,
                });
            }
        };

        const handleTouchEnd = () => {
            setDragging(false);
            setIsPinching(false);
            initialScale.current = scale;
        };

        const handleDownload = () => {
            if (!imageSrc || !canvasRef.current || !editorRef.current) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            const isStory = currentFrame === "9-16";
            const frameWidth = 1080;
            const frameHeight = isStory ? 1920 : 1350;
            const frameSrc = isStory ? "/frame-story.png" : "/frame.png";
            const dpr = window.devicePixelRatio || 1;
            canvas.width = frameWidth * dpr;
            canvas.height = frameHeight * dpr;
            ctx.scale(dpr, dpr);
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, frameWidth, frameHeight);
            const frameImage = new Image();
            const userPhoto = new Image();
            frameImage.crossOrigin = userPhoto.crossOrigin = "Anonymous";
            frameImage.src = frameSrc;
            userPhoto.src = imageSrc;
            Promise.all([
                new Promise((res) => (frameImage.onload = res)),
                new Promise((res) => (userPhoto.onload = res)),
            ]).then(() => {
                const editorW = editorRef.current.offsetWidth;
                const editorToCanvasScale = frameWidth / editorW;
                ctx.save();
                if (facingMode === "user") {
                    ctx.translate(frameWidth, 0);
                    ctx.scale(-1, 1);
                }
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                const canvasOffsetX = offset.x * editorToCanvasScale;
                const canvasOffsetY = offset.y * editorToCanvasScale;
                ctx.translate(canvasOffsetX, canvasOffsetY);
                ctx.translate(frameWidth / 2, frameHeight / 2);
                ctx.scale(scale, scale);
                ctx.translate(-frameWidth / 2, -frameHeight / 2);
                const imgWidth = userPhoto.naturalWidth;
                const imgHeight = userPhoto.naturalHeight;
                const imgRatio = imgWidth / imgHeight;
                const containerRatio = frameWidth / frameHeight;
                let sx = 0, sy = 0, sWidth = imgWidth, sHeight = imgHeight;
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
                    0, 0, frameWidth, frameHeight
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

        if (!imageSrc) {
            return null;
        }

        const isStory = currentFrame === "9-16";
        const aspectRatio = isStory ? "9 / 16" : "4 / 5";
        const frameSrc = isStory ? "/frame-story.png" : "/frame.png";

        return (
            <div
                // PERBAIKAN 1: Hapus 'items-center'
                className="flex flex-col space-y-6"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    ref={editorRef}
                    // PERBAIKAN 2: Hapus 'max-w-sm'
                    className="relative w-full rounded-xl overflow-hidden bg-gray-900 shadow-2xl transition-all"
                    style={{ aspectRatio }}
                    onWheel={handleWheel}
                >
                    <div
                        className="w-full h-full"
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                            transition: isPinching ? "none" : "transform 0.05s ease-out",
                            cursor: editable ? (dragging ? "grabbing" : "grab") : "default",
                            touchAction: "none",
                        }}
                    >
                        <img
                            src={imageSrc}
                            alt="Foto"
                            draggable={false}
                            className="w-full h-full object-contain select-none"
                        />
                    </div>

                    <img
                        src={frameSrc}
                        alt="Frame"
                        className="absolute inset-0 w-full h-full pointer-events-none"
                    />
                </div>

                {/* Tombol Kontrol */}
                {editable && !finished && (
                    // PERBAIKAN 3: Hapus 'max-w-sm'
                    <div className="flex flex-col items-center space-y-4 w-full">
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

                    </div>
                )}

                {finished && (
                    <button
                        onClick={handleDownload}
                        // Anda mungkin ingin menambahkan 'w-full' di sini juga agar konsisten
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg w-full"
                    >
                        Download
                    </button>

                )}

                <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
        );
    }
);

export default PhotoMaskEditor;