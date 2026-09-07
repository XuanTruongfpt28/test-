import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, X, Upload } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoBase64: string) => void;
  employeeName: string;
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  employeeName,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Khởi động Camera khi Modal mở
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setCapturedPhoto(null);
    setCameraError(null);
    setIsCameraReady(false);

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        });

        if (isMounted) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setIsCameraReady(true);
          }
        } else {
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch {
        if (isMounted) {
          setCameraError(
            'Không thể truy cập camera trực tiếp. Bạn có thể sử dụng tính năng tải ảnh từ máy.',
          );
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Chụp ảnh từ luồng video canvas
  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Lật gương video để ảnh chụp tự nhiên như nhìn gương
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Xuất ra base64 jpeg nén nhẹ 0.75 để tiết kiệm dung lượng
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.75);
    setCapturedPhoto(photoDataUrl);
  };

  // Chụp lại
  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  // Xác nhận ảnh
  const handleConfirm = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      onClose();
    }
  };

  // Fallback: Tải ảnh từ thư viện thiết bị
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        // Vẽ lên canvas nén lại
        const img = new Image();
        img.onload = () => {
          if (!canvasRef.current) return;
          const canvas = canvasRef.current;
          const maxDim = 640;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = (h / w) * maxDim;
              w = maxDim;
            } else {
              w = (w / h) * maxDim;
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div>
            <h3 className="font-display text-base font-bold text-[var(--color-ink)] flex items-center gap-2">
              <Camera size={18} className="text-[var(--color-primary)]" />
              Chụp ảnh tác phong vào ca
            </h3>
            <p className="text-xs text-[var(--color-ink-soft)]">
              Nhân viên: <strong className="text-[var(--color-ink)]">{employeeName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Khung hình Camera / Preview */}
        <div className="mt-4 relative overflow-hidden rounded-2xl bg-black aspect-square flex items-center justify-center">
          {/* Canvas ẩn để render ảnh chụp */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Màn hình xem ảnh đã chụp */}
          {capturedPhoto ? (
            <img
              src={capturedPhoto}
              alt="Ảnh chụp tác phong"
              className="h-full w-full object-cover"
            />
          ) : (
            /* Luồng Camera trực tiếp */
            <div className="relative h-full w-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover scale-x-[-1]"
              />

              {/* Khung hướng dẫn căn chỉnh khuôn mặt */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="h-56 w-44 rounded-[50%] border-2 border-dashed border-white/75 shadow-sm"></div>
                <span className="mt-2 text-[11px] font-semibold text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur-xs">
                  Căn khuôn mặt vào giữa khung
                </span>
              </div>
            </div>
          )}

          {/* Báo lỗi nếu không bật được Camera */}
          {cameraError && !capturedPhoto && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 p-4 text-center text-white">
              <AlertCircle size={28} className="text-amber-400 mb-2" />
              <p className="text-xs leading-relaxed text-zinc-200">{cameraError}</p>
              <label className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm cursor-pointer hover:bg-[var(--color-primary-dark)]">
                <Upload size={15} />
                <span>Tải ảnh khuôn mặt từ máy</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Chú thích tác phong */}
        <p className="mt-3 text-center text-[11px] text-[var(--color-ink-soft)] leading-relaxed">
          💡 Vui lòng đảm bảo đồng phục chỉnh tề, khuôn mặt rõ ràng để quản lý đối chiếu.
        </p>

        {/* Nút bấm hành động */}
        <div className="mt-4 flex flex-col gap-2">
          {!capturedPhoto ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled={!isCameraReady && !cameraError}
                onClick={handleSnap}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-3.5 text-sm font-bold text-white shadow-md shadow-[var(--color-primary)]/25 transition-all hover:bg-[var(--color-primary-dark)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <Camera size={18} />
                <span>Bấm Chụp Ảnh Ngay</span>
              </button>

              {!cameraError && (
                <label className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-primary)] cursor-pointer">
                  <Upload size={13} />
                  <span>Hoặc chọn ảnh từ tệp</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--color-border)] py-3 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-bg)] cursor-pointer"
              >
                <RefreshCw size={15} />
                <span>Chụp lại</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--color-primary)] py-3 text-xs font-bold text-white shadow-md shadow-[var(--color-primary)]/20 hover:bg-[var(--color-primary-dark)] cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>Xác nhận & Vào ca</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
