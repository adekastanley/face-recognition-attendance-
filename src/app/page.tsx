"use client";

import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

export default function Home() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [modelsLoaded, setModelsLoaded] = useState(false);

	useEffect(() => {
		const loadModels = async () => {
			const MODEL_URL = "/models";

			await Promise.all([
				faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
				faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
				faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
			]);

			setModelsLoaded(true);
			console.log("Face-api models loaded!");
		};

		loadModels();
	}, []);

	useEffect(() => {
		const startVideo = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
			} catch (err) {
				console.error("Failed to access webcam:", err);
			}
		};

		if (modelsLoaded) {
			startVideo();
		}
	}, [modelsLoaded]);

	const handleVideoPlay = () => {
		const video = videoRef.current;
		const canvas = canvasRef.current;

		if (!video || !canvas) return;

		const displaySize = { width: video.videoWidth, height: video.videoHeight };
		faceapi.matchDimensions(canvas, displaySize);

		const interval = setInterval(async () => {
			const detections = await faceapi
				.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
				.withFaceLandmarks()
				.withFaceDescriptors();

			const resized = faceapi.resizeResults(detections, displaySize);

			canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
			faceapi.draw.drawDetections(canvas, resized);
			faceapi.draw.drawFaceLandmarks(canvas, resized);
		}, 100);

		return () => clearInterval(interval);
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
			{/* <h1 className="text-3xl font-bold mb-4">Face Recognition Attendance</h1> */}

			<div className="relative w-full max-w-lg aspect-video">
				<video
					ref={videoRef}
					autoPlay
					muted
					playsInline
					onPlay={handleVideoPlay}
					className="w-full h-full rounded-md shadow-md object-cover"
				/>
				<canvas
					ref={canvasRef}
					className="absolute top-0 left-0 w-full h-full"
				/>
			</div>

			{!modelsLoaded && (
				<p className="mt-4 text-sm text-gray-500">Loading models...</p>
			)}
		</div>
	);
}
