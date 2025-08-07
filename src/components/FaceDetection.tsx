// "use client";

// import { useEffect, useRef, useState } from "react";
// import { loadModels, faceapi } from "@/lib/face-api";

// export default function FaceDetection() {
// 	const videoRef = useRef<HTMLVideoElement>(null);
// 	const canvasRef = useRef<HTMLCanvasElement>(null);
// 	const [isReady, setIsReady] = useState(false);

// 	useEffect(() => {
// 		async function setup() {
// 			try {
// 				await loadModels();

// 				const stream = await navigator.mediaDevices.getUserMedia({
// 					video: true,
// 				});
// 				if (videoRef.current) {
// 					videoRef.current.srcObject = stream;
// 					videoRef.current.play();
// 				}

// 				setIsReady(true);
// 			} catch (err) {
// 				console.error("Error loading models or accessing webcam:", err);
// 			}
// 		}

// 		setup();
// 	}, []);

// 	useEffect(() => {
// 		if (!isReady) return;

// 		const video = videoRef.current;
// 		const canvas = canvasRef.current;
// 		const displaySize = { width: 640, height: 480 };

// 		if (!video || !canvas) return;

// 		canvas.width = displaySize.width;
// 		canvas.height = displaySize.height;

// 		const detectFaces = async () => {
// 			if (!video || video.paused || video.ended) return;

// 			const detections = await faceapi
// 				.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
// 				.withFaceLandmarks()
// 				.withFaceDescriptors();

// 			const resized = faceapi.resizeResults(detections, displaySize);
// 			const ctx = canvas.getContext("2d");
// 			if (ctx) {
// 				ctx.clearRect(0, 0, canvas.width, canvas.height);
// 				faceapi.draw.drawDetections(canvas, resized);
// 				faceapi.draw.drawFaceLandmarks(canvas, resized);
// 			}

// 			requestAnimationFrame(detectFaces);
// 		};

// 		detectFaces();
// 	}, [isReady]);

// 	return (
// 		<div>
// 			<video
// 				ref={videoRef}
// 				width="640"
// 				height="480"
// 				autoPlay
// 				muted
// 				style={{ position: "absolute" }}
// 			/>
// 			<canvas ref={canvasRef} style={{ position: "absolute" }} />
// 		</div>
// 	);
// }

// "use client";

// import * as faceapi from "@vladmandic/face-api";
// import { useEffect, useRef } from "react";

// export default function FaceDetection() {
// 	const videoRef = useRef<HTMLVideoElement>(null);

// 	useEffect(() => {
// 		const setup = async () => {
// 			try {
// 				// Load models
// 				const MODEL_URL = "/models";
// 				await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
// 				await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
// 				await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

// 				// Get webcam
// 				const stream = await navigator.mediaDevices.getUserMedia({
// 					video: true,
// 				});
// 				if (videoRef.current) {
// 					videoRef.current.srcObject = stream;
// 					await videoRef.current.play();
// 				}
// 			} catch (error) {
// 				console.error("Error loading models or accessing webcam:", error);
// 			}
// 		};

// 		setup();
// 	}, []);

// 	return (
// 		<div className="flex justify-center items-center">
// 			<video
// 				ref={videoRef}
// 				autoPlay
// 				muted
// 				width={640}
// 				height={480}
// 				className="rounded-xl border"
// 			/>
// 		</div>
// 	);
// }
