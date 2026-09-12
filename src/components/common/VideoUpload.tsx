"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Camera, Circle, Square, Trash2, Upload, Video } from "lucide-react";
import { Button } from "@/components/common/Button";

interface VideoUploadProps {
  label: string;
  file?: File | null;
  existingUrl?: string;
  onChange: (file: File | null) => void;
  error?: string;
  className?: string;
  optional?: boolean;
}

type VideoMode = "upload" | "record";

export function VideoUpload({
  label,
  file,
  existingUrl,
  onChange,
  error,
  className,
  optional = false,
}: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [preview, setPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<VideoMode>("upload");
  const [recording, setRecording] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(existingUrl || null);
  }, [file, existingUrl]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [stopCamera]);

  const handleFile = useCallback(
    (selected: File) => {
      stopCamera();
      onChange(selected);
    },
    [onChange, stopCamera]
  );

  const removeFile = () => {
    onChange(null);
    stopCamera();
    if (inputRef.current) inputRef.current.value = "";
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch {
      setCameraError(
        "Camera access denied. Please allow camera permission or upload a video."
      );
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const recordedFile = new File([blob], `kyc-video-${Date.now()}.webm`, {
        type: "video/webm",
      });
      stopCamera();
      handleFile(recordedFile);
      setRecording(false);
    };

    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const displayLabel = optional ? `${label} (Optional)` : label;

  return (
    <div className={cn("w-full", className)}>
      <label className="mb-1.5 block text-sm font-medium text-muted">
        {displayLabel}
      </label>

      {!file && !preview ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "upload" ? "primary" : "outline"}
              onClick={() => {
                setMode("upload");
                stopCamera();
                inputRef.current?.click();
              }}
            >
              <Upload className="h-4 w-4" />
              Upload Video
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "record" ? "primary" : "outline"}
              onClick={() => {
                setMode("record");
                void startCamera();
              }}
            >
              <Camera className="h-4 w-4" />
              Record Webcam
            </Button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) handleFile(selected);
            }}
          />

          {mode === "upload" ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              className={cn(
                "flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all",
                error
                  ? "border-accent-red/50 bg-accent-red/5"
                  : "border-border bg-slate-50 hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Video className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Click to upload video
              </p>
              <p className="mt-1 text-xs text-muted">MP4, WebM or MOV</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl bg-[#1e293b]">
              <div className="relative aspect-video bg-black">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
                {!cameraReady && !cameraError ? (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-white">
                    Starting camera...
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                {cameraError ? (
                  <p className="text-xs text-red-300">{cameraError}</p>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void startCamera()}
                      disabled={cameraReady}
                    >
                      Enable Camera
                    </Button>
                    {!recording ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={startRecording}
                        disabled={!cameraReady}
                      >
                        <Circle className="h-4 w-4 fill-current text-accent-red" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={stopRecording}
                      >
                        <Square className="h-4 w-4" />
                        Stop Recording
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl bg-[#1e293b]">
          {preview ? (
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              <video
                src={preview}
                controls
                className="h-full w-full object-contain"
              />
            </div>
          ) : null}
          <button
            type="button"
            onClick={removeFile}
            className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-accent-red">{error}</p>}
    </div>
  );
}
