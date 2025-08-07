import * as faceapi from "@vladmandic/face-api";

let modelsLoaded = false;

export async function loadModels(): Promise<void> {
	if (modelsLoaded) return;

	const MODEL_URL = "/models"; // Because models are in /public/models

	await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
	await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
	await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
	await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);

	modelsLoaded = true;
}

export { faceapi };
