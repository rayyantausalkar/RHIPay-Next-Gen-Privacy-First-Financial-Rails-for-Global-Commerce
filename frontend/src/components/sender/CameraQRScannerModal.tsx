"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  X,
  Upload,
  Sparkles,
  AlertCircle,
  SwitchCamera,
  Flashlight,
  QrCode,
  CheckCircle2,
} from "lucide-react";
import jsQR from "jsqr";
import { listRecentRequests } from "@/lib/api";
import { DynamicPaymentRequestResponse } from "@/types/payment";
import { toast } from "sonner";

interface CameraQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (payload: string) => void;
}

export const CameraQRScannerModal: React.FC<CameraQRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [recentRequests, setRecentRequests] = useState<DynamicPaymentRequestResponse[]>([]);

  // Load recent requests for quick test selection
  useEffect(() => {
    if (isOpen) {
      listRecentRequests(4)
        .then(setRecentRequests)
        .catch(() => {});
    }
  }, [isOpen]);

  const handleDetected = useCallback((data: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    toast.success("QR Code Successfully Scanned!");
    onScanSuccess(data);
    onClose();
  }, [onClose, onScanSuccess]);

  // Start Camera Stream & Scanner Loop
  useEffect(() => {
    if (!isOpen) return;

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play();
          setHasCameraPermission(true);
          scanFrame();
        }
      } catch (err: unknown) {
        setHasCameraPermission(false);
        const errMsg = err instanceof Error ? err.message : "Camera access denied or unavailable";
        setCameraError(errMsg);
      }
    };

    const scanFrame = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            handleDetected(code.data);
            return;
          }
        }
      }
      animFrameId.current = requestAnimationFrame(scanFrame);
    };

    startCamera();

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode, handleDetected]);

  // Handle Image File Upload & Decode
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleDetected(code.data);
        } else {
          toast.error("No valid QR code found in uploaded image");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#09090b] border border-white/[0.08] rounded-3xl p-6 shadow-2xl shadow-emerald-950/40 relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden Canvas for QR parsing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Scan Payment QR
              </h3>
              <p className="text-[11px] text-zinc-400">
                Point camera at recipient&apos;s dynamic QR
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewfinder Box */}
        <div className="my-4 relative rounded-2xl overflow-hidden bg-black aspect-square max-h-72 flex items-center justify-center border border-white/[0.08]">
          {hasCameraPermission === false ? (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <div>
                <h4 className="text-xs font-bold text-white">Camera Access Disabled</h4>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-xs leading-relaxed">
                  {cameraError || "Please enable camera permissions or upload an image file below."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
              >
                Upload QR Image
              </button>
            </div>
          ) : (
            <>
              {/* Live Video Feed */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
              />

              {/* Viewfinder Target Reticle Frame */}
              <div className="absolute inset-8 pointer-events-none border-2 border-dashed border-emerald-500/40 rounded-2xl flex items-center justify-center">
                {/* 4 Corner Markers */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />

                {/* Animated Emerald Laser Scan Line */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#10b981] animate-pulse" />
              </div>

              {/* Floating Camera Controls Overlay */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setFacingMode((prev) =>
                      prev === "environment" ? "user" : "environment"
                    )
                  }
                  className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-black/80 transition-colors"
                  title="Switch camera"
                >
                  <SwitchCamera className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Secondary Upload & Quick Options */}
        <div className="space-y-2 pt-2 border-t border-white/[0.08]">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-200 border border-white/[0.08] flex items-center justify-center gap-2 transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload QR Image / Screenshot</span>
          </button>

          {/* Quick Select Demo QR Codes */}
          {recentRequests.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
                Or Select Active Payment Request
              </span>
              <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto">
                {recentRequests.map((req) => (
                  <button
                    key={req.reference_id}
                    type="button"
                    onClick={() => handleDetected(req.qr_payload)}
                    className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/[0.04] hover:border-emerald-500/30 text-left text-[11px] text-zinc-300 transition-colors"
                  >
                    <div className="font-bold text-white truncate">
                      {req.recipient_name}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono">
                      {Number(req.requested_amount).toFixed(req.currency_decimals ?? 2)} {req.destination_currency}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
