"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Loader2, ScanLine } from "lucide-react";
import jsQR from "jsqr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ScannerState = "starting" | "scanning" | "error";

function decode(source: CanvasImageSource, width: number, height: number, canvas: HTMLCanvasElement) {
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(source, 0, 0, width, height);
  const image = context.getImageData(0, 0, width, height);
  return jsQR(image.data, width, height, { inversionAttempts: "dontInvert" })?.data ?? null;
}

function cameraErrorMessage(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError") return "Trình duyệt chưa được cấp quyền dùng camera. Hãy cho phép rồi thử lại.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Không tìm thấy camera trên thiết bị này.";
  if (typeof navigator !== "undefined" && !navigator.mediaDevices) {
    return "Camera chỉ dùng được trên HTTPS hoặc localhost.";
  }
  return "Không mở được camera. Bạn có thể chọn ảnh chụp mã QR thay thế.";
}

/** Reads the voucher QR with the device camera (or a photo of it) and hands back the token it contains. */
export function QrScannerDialog({
  open,
  onOpenChange,
  onResult,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (token: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="size-5 text-[#934a33]" /> Quét mã QR voucher
          </DialogTitle>
          <DialogDescription>Đưa mã QR trên voucher của khách vào khung hình.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so closing the dialog stops the camera. */}
        {open && (
          <Scanner
            onResult={(token) => {
              onOpenChange(false);
              onResult(token);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Scanner({ onResult }: { onResult: (token: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const onResultRef = useRef(onResult);
  const [state, setState] = useState<ScannerState>("starting");
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;

    const tick = () => {
      if (stopped) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
        const token = decode(video, video.videoWidth, video.videoHeight, canvas);
        if (token) {
          stopped = true;
          onResultRef.current(token);
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("no-media-devices");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (stopped) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setState("scanning");
        frame = requestAnimationFrame(tick);
      } catch (cause) {
        if (stopped) return;
        setError(cameraErrorMessage(cause));
        setState("error");
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const readFile = async (file: File | undefined) => {
    if (!file || !canvasRef.current) return;
    setFileError(null);
    try {
      const bitmap = await createImageBitmap(file);
      const token = decode(bitmap, bitmap.width, bitmap.height, canvasRef.current);
      bitmap.close();
      if (token) onResult(token);
      else setFileError("Không tìm thấy mã QR trong ảnh. Hãy chụp rõ và thẳng hơn.");
    } catch {
      setFileError("Không đọc được ảnh này.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-900">
        <video ref={videoRef} muted playsInline className="size-full object-cover" />
        {state === "scanning" && (
          <div className="pointer-events-none absolute inset-[15%] rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />
        )}
        {state === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-white/80">
            <Loader2 className="size-4 animate-spin" /> Đang mở camera…
          </div>
        )}
        {state === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-white/90">
            <Camera className="size-8 text-white/60" />
            {error}
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void readFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <Button variant="outline" className="w-full gap-1.5 text-xs" onClick={() => fileRef.current?.click()}>
        <ImageUp className="size-4" /> Chọn ảnh có mã QR
      </Button>
      {fileError && (
        <p className="text-xs text-red-600" role="alert">
          {fileError}
        </p>
      )}
    </div>
  );
}
