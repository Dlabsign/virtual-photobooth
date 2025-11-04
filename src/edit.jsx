import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react";

const PhotoMaskEditor = forwardRef(
  ({ imageSrc, facingMode = "environment" }, ref) => {
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [editable, setEditable] = useState(false);
    const [finished, setFinished] = useState(false);
    const [currentFrame, setCurrentFrame] = useState("4-5"); // Default "Feed"
    const [scale, setScale] = useState(1);
    const [isPinching, setIsPinching] = useState(false);
    const initialPinchDistance = useRef(0);
    const initialScale = useRef(1);
    const editorRef = useRef(null);
    const canvasRef = useRef(null);

    // Reset state saat gambar baru masuk
    useEffect(() => {
      if (imageSrc) {
        setEditable(true);
        setFinished(false);
        setOffset({ x: 0, y: 0 });
        setScale(1);
        initialScale.current = 1;
      }
    }, [imageSrc]);

    // --- Helper Functions ---

    const getDistance = (touches) => {
      const [touch1, touch2] = touches;
      return Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
    };

    const clampScale = (newScale) => Math.max(0.5, Math.min(newScale, 4));

    // --- Mouse Handlers ---

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

    // --- Touch Handlers ---

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

    // --- Download Handler ---

    const handleDownload = () => {
      if (!imageSrc || !canvasRef.current || !editorRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const isStory = currentFrame === "9-16";
      const frameWidth = 1080;
      const frameHeight = isStory ? 1920 : 1350;
      const frameSrc = isStory ? "/frame-story.png" : "/frame.png";
      
      // Gunakan Device Pixel Ratio untuk gambar lebih tajam
      const dpr = window.devicePixelRatio || 1;
      canvas.width = frameWidth * dpr;
      canvas.height = frameHeight * dpr;
      ctx.scale(dpr, dpr);

      // Latar belakang hitam (jika gambar tidak pas)
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
        // Skala dari editor di layar ke canvas final (1080px)
        const editorToCanvasScale = frameWidth / editorW;

        ctx.save();

        // Balik gambar jika foto selfie (facingMode === "user")
        if (facingMode === "user") {
          ctx.translate(frameWidth, 0);
          ctx.scale(-1, 1);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // 1. Terapkan offset (drag)
        const canvasOffsetX = offset.x * editorToCanvasScale;
        const canvasOffsetY = offset.y * editorToCanvasScale;
        ctx.translate(canvasOffsetX, canvasOffsetY);

        // 2. Terapkan scale (zoom)
        // Pindahkan titik pusat ke tengah canvas untuk zoom
        ctx.translate(frameWidth / 2, frameHeight / 2);
        ctx.scale(scale, scale);
        // Kembalikan titik pusat
        ctx.translate(-frameWidth / 2, -frameHeight / 2);

        // --- Logika 'object-cover' untuk canvas ---
        // Ini memastikan gambar mengisi frame tanpa distorsi
        const imgWidth = userPhoto.naturalWidth;
        const imgHeight = userPhoto.naturalHeight;
        const imgRatio = imgWidth / imgHeight;
        const containerRatio = frameWidth / frameHeight;

        let sx = 0, sy = 0, sWidth = imgWidth, sHeight = imgHeight;

        if (imgRatio > containerRatio) { // Gambar lebih lebar
          sHeight = imgHeight;
          sWidth = imgHeight * containerRatio;
          sx = (imgWidth - sWidth) / 2;
        } else { // Gambar lebih tinggi (atau sama)
          sWidth = imgWidth;
          sHeight = imgWidth / containerRatio;
          sy = (imgHeight - sHeight) / 2;
        }
        // --- End of 'object-cover' logic ---

        ctx.drawImage(
          userPhoto,
          sx, sy, sWidth, sHeight, // Sumber (crop)
          0, 0, frameWidth, frameHeight // Tujuan (canvas)
        );

        ctx.restore(); // Kembalikan state (termasuk flip selfie)

        // Gambar frame di atas segalanya
        ctx.drawImage(frameImage, 0, 0, frameWidth, frameHeight);

        // Buat link download
        const dataURL = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = isStory ? "photobooth-story.png" : "photobooth-post.png";
        link.click();
      });
    };

    // --- Imperative Handle ---

    useImperativeHandle(ref, () => ({
      downloadPhoto: handleDownload,
    }));

    // --- Render ---

    if (!imageSrc) {
      return null;
    }

    const isStory = currentFrame === "9-16";
    const aspectRatio = isStory ? "9 / 16" : "4 / 5";
    const frameSrc = isStory ? "/frame-story.png" : "/frame.png";

    return (
      <div
        // PERBAIKAN: Kembalikan items-center
        className="flex flex-col space-y-6 items-center"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={editorRef}
          // PERBAIKAN: Logika className kondisional
          className={`relative w-full ${
            isStory ? "max-h-[60vh]" : "max-w-sm"
          } rounded-xl overflow-hidden bg-gray-900 shadow-2xl transition-all`}
          style={{ aspectRatio }}
          onWheel={handleWheel}
        >
          {/* Kontainer untuk foto yang bisa digerakkan */}
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
              // Ganti object-contain dengan object-cover agar sesuai dengan logika canvas
              className="w-full h-full object-cover select-none"
              style={{
                // Balik gambar di layar jika selfie
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
              }}
            />
          </div>

          {/* Frame Overlay */}
          <img
            src={frameSrc}
            alt="Frame"
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        </div>

        {/* Tombol Kontrol */}
        {editable && !finished && (
          // PERBAIKAN: Hapus max-w-sm agar tombol mengikuti lebar editor
          <div className="flex flex-col items-center space-y-4 w-full px-4 sm:px-0">
            <div className="flex space-x-2 w-full max-w-sm">
              <button
                onClick={() => setCurrentFrame("4-5")}
                className={`w-full px-4 py-2 rounded-lg transition-colors ${
                  currentFrame === "4-5"
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => setCurrentFrame("9-16")}
                className={`w-full px-4 py-2 rounded-lg transition-colors ${
                  currentFrame === "9-16"
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

        {/* Tombol Download */}
        {finished && (
          <div className="w-full px-4 sm:px-0 max-w-sm">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg w-full"
            >
              Download
            </button>
          </div>
        )}

        {/* Canvas tersembunyi untuk rendering */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    );
  }
);

export default PhotoMaskEditor;