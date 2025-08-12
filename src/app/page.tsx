// "use client";
// import React, { useEffect, useRef, useState } from "react";
// import * as faceapi from "@vladmandic/face-api";

// export default function Home() {
// 	const videoRef = useRef<HTMLVideoElement>(null);
// 	const canvasRef = useRef<HTMLCanvasElement>(null);
// 	const [modelsLoaded, setModelsLoaded] = useState(false);

// 	useEffect(() => {
// 		const loadModels = async () => {
// 			const MODEL_URL = "/models";

// 			await Promise.all([
// 				faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
// 				faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
// 				faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
// 			]);

// 			setModelsLoaded(true);
// 			console.log("Face-api models loaded!");
// 		};

// 		loadModels();
// 	}, []);

// 	useEffect(() => {
// 		const startVideo = async () => {
// 			try {
// 				const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
// 				if (videoRef.current) {
// 					videoRef.current.srcObject = stream;
// 				}
// 			} catch (err) {
// 				console.error("Failed to access webcam:", err);
// 			}
// 		};

// 		if (modelsLoaded) {
// 			startVideo();
// 		}
// 	}, [modelsLoaded]);

// 	const handleVideoPlay = () => {
// 		const video = videoRef.current;
// 		const canvas = canvasRef.current;

// 		if (!video || !canvas) return;

// 		const displaySize = { width: video.videoWidth, height: video.videoHeight };
// 		faceapi.matchDimensions(canvas, displaySize);

// 		const interval = setInterval(async () => {
// 			const detections = await faceapi
// 				.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
// 				.withFaceLandmarks()
// 				.withFaceDescriptors();

// 			const resized = faceapi.resizeResults(detections, displaySize);

// 			canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
// 			faceapi.draw.drawDetections(canvas, resized);
// 			faceapi.draw.drawFaceLandmarks(canvas, resized);
// 		}, 100);

// 		return () => clearInterval(interval);
// 	};

// 	return (
// 		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
// 			{/* <h1 className="text-3xl font-bold mb-4">Face Recognition Attendance</h1> */}

// 			<div className="relative w-full max-w-lg aspect-video">
// 				<video
// 					ref={videoRef}
// 					autoPlay
// 					muted
// 					playsInline
// 					onPlay={handleVideoPlay}
// 					className="w-full h-full rounded-md shadow-md object-cover"
// 				/>
// 				<canvas
// 					ref={canvasRef}
// 					className="absolute top-0 left-0 w-full h-full"
// 				/>
// 			</div>

// 			{!modelsLoaded && (
// 				<p className="mt-4 text-sm text-gray-500">Loading models...</p>
// 			)}
// 		</div>
// 	);
// }

"use client";

import React, { useEffect, useRef, useState } from "react";
import { faceapi } from "@/lib/face-api";
import { loadLabeledImages } from "@/lib/loadLabeledImages";
import { attendanceManager } from "@/lib/attendance";
import AttendanceList from "@/components/AttendanceList";
import { Button } from "@/components/ui/button";
import { Settings, UserPlus, Camera, CameraOff } from "lucide-react";
import Link from "next/link";

export default function Home() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [modelsLoaded, setModelsLoaded] = useState(false);
	const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);
	const [isVideoOn, setIsVideoOn] = useState(true);
	const [detectionInterval, setDetectionInterval] = useState<NodeJS.Timeout | null>(null);
	const [lastDetectionTime, setLastDetectionTime] = useState<{ [key: string]: number }>({});

	// Load models once on client
	useEffect(() => {
		const load = async () => {
			try {
				await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
				await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
				await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
				await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
				setModelsLoaded(true);
				console.log("All models loaded");
			} catch (error) {
				console.error("Error loading models:", error);
			}
		};
		load();
	}, []);

	// Start video when models are ready
	useEffect(() => {
		if (!modelsLoaded || !isVideoOn) return;

		const startVideo = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ 
					video: { width: 640, height: 480 } 
				});
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
			} catch (err) {
				console.error("Error accessing webcam:", err);
			}
		};

		startVideo();

		// Cleanup function to stop video stream
		return () => {
			if (videoRef.current?.srcObject) {
				const stream = videoRef.current.srcObject as MediaStream;
				stream.getTracks().forEach(track => track.stop());
			}
		};
	}, [modelsLoaded, isVideoOn]);

	// Load labeled data once
	useEffect(() => {
		if (!modelsLoaded) return;

		const loadLabels = async () => {
			try {
				const labeledDescriptors = await loadLabeledImages();
				const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
				setFaceMatcher(matcher);
				console.log("Labeled images loaded");
			} catch (error) {
				console.error("Error loading labeled images:", error);
			}
		};

		loadLabels();
	}, [modelsLoaded]);

	// Capture face image for attendance record
	const captureAttendanceImage = (canvas: HTMLCanvasElement, detection: any): string => {
		try {
			const { x, y, width, height } = detection.detection.box;
			const faceCanvas = document.createElement('canvas');
			const faceCtx = faceCanvas.getContext('2d');
			
			if (!faceCtx) return '';
			
			faceCanvas.width = width;
			faceCanvas.height = height;
			
			faceCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
			return faceCanvas.toDataURL('image/jpeg', 0.8);
		} catch (error) {
			console.error('Error capturing face image:', error);
			return '';
		}
	};

	// When video plays, do detection and recognition
	const handleVideoPlay = () => {
		const video = videoRef.current;
		const canvas = canvasRef.current;
		if (!video || !canvas || !faceMatcher) return;

		const displaySize = {
			width: video.videoWidth,
			height: video.videoHeight,
		};
		faceapi.matchDimensions(canvas, displaySize);

		const interval = setInterval(async () => {
			if (!video || video.paused || video.ended) return;

			try {
				const detections = await faceapi
					.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
					.withFaceLandmarks()
					.withFaceDescriptors();

				const resized = faceapi.resizeResults(detections, displaySize);
				const ctx = canvas.getContext("2d");
				ctx?.clearRect(0, 0, canvas.width, canvas.height);

				resized.forEach((detection) => {
					const box = detection.detection.box;
					const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
					const confidence = 1 - bestMatch.distance;

					// Only process known faces (not "unknown")
					if (bestMatch.label !== "unknown" && confidence > 0.4) {
						const now = Date.now();
						const lastTime = lastDetectionTime[bestMatch.label] || 0;

						// Log attendance if enough time has passed (30 seconds)
						if (now - lastTime > 30000) {
							const imageData = captureAttendanceImage(canvas, detection);
							const success = attendanceManager.addRecord(
								bestMatch.label,
								confidence,
								imageData
							);

							if (success) {
								setLastDetectionTime(prev => ({
									...prev,
									[bestMatch.label]: now
								}));
								console.log(`Attendance recorded for ${bestMatch.label}`);
							}
						}

						// Draw box with green color for known faces
						const drawBox = new faceapi.draw.DrawBox(box, {
							label: `${bestMatch.label} (${(confidence * 100).toFixed(0)}%)`,
							lineWidth: 2,
							boxColor: '#10b981'
						});
						drawBox.draw(canvas);
					} else {
						// Draw box with red color for unknown faces
						const drawBox = new faceapi.draw.DrawBox(box, {
							label: "Unknown",
							lineWidth: 2,
							boxColor: '#ef4444'
						});
						drawBox.draw(canvas);
					}
				});
			} catch (error) {
				console.error('Error in face detection:', error);
			}
		}, 100);

		setDetectionInterval(interval);

		// Cleanup
		return () => clearInterval(interval);
	};

	// Toggle video on/off
	const toggleVideo = () => {
		if (detectionInterval) {
			clearInterval(detectionInterval);
			setDetectionInterval(null);
		}
		
		if (videoRef.current?.srcObject) {
			const stream = videoRef.current.srcObject as MediaStream;
			stream.getTracks().forEach(track => track.stop());
			videoRef.current.srcObject = null;
		}

		setIsVideoOn(!isVideoOn);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 px-4 py-3">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<h1 className="text-xl font-semibold text-gray-900">
						Facial Recognition Attendance
					</h1>
					<div className="flex items-center space-x-2">
						<Button
							variant="outline"
							size="sm"
							onClick={toggleVideo}
							className="flex items-center"
						>
							{isVideoOn ? (
								<>
									<CameraOff className="h-4 w-4 mr-2" />
									Stop Camera
								</>
							) : (
								<>
									<Camera className="h-4 w-4 mr-2" />
									Start Camera
								</>
							)}
						</Button>
						<Link href="/manage">
							<Button size="sm" className="flex items-center">
								<UserPlus className="h-4 w-4 mr-2" />
								Add Person
							</Button>
						</Link>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto p-4">
				<div className="flex flex-col lg:flex-row gap-6">
					{/* Camera Section */}
					<div className="flex-1">
						<div className="bg-white rounded-lg shadow-md p-6">
							<div className="relative w-full aspect-video max-w-3xl mx-auto">
								{isVideoOn ? (
									<>
										<video
											ref={videoRef}
											autoPlay
											muted
											playsInline
											onPlay={handleVideoPlay}
											className="w-full h-full rounded-md object-cover bg-black"
										/>
										<canvas
											ref={canvasRef}
											className="absolute top-0 left-0 w-full h-full pointer-events-none"
										/>
									</>
								) : (
									<div className="w-full h-full bg-gray-900 rounded-md flex items-center justify-center">
										<div className="text-center text-gray-400">
											<Camera className="h-12 w-12 mx-auto mb-2" />
											<p>Camera is off</p>
											<p className="text-sm mt-1">Click "Start Camera" to begin</p>
										</div>
									</div>
								)}
							</div>
							
							{/* Status */}
							<div className="mt-4 text-center">
								{!modelsLoaded ? (
									<div className="flex items-center justify-center space-x-2">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
										<p className="text-sm text-gray-500">Loading AI models...</p>
									</div>
								) : isVideoOn ? (
									<p className="text-sm text-green-600 font-medium">
										✓ Ready - Face detection active
									</p>
								) : (
									<p className="text-sm text-gray-500">
										Ready - Click "Start Camera" to begin detection
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Attendance Sidebar */}
					<div className="lg:w-80">
						<AttendanceList />
					</div>
				</div>
			</div>
		</div>
	);
}
