// lib/face-api.js
import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "/models";

export async function loadModels() {
	// 	await Promise.all([
	// 		faceapi.nets.tinyFaceDetector.loadFromUri(
	// 			`${MODEL_URL}/tiny_face_detector`
	// 		),
	// 		faceapi.nets.faceLandmark68Net.loadFromUri(`${MODEL_URL}/face_landmark_68`),
	// 		faceapi.nets.faceRecognitionNet.loadFromUri(
	// 			`${MODEL_URL}/face_recognition`
	// 		),
	// 		faceapi.nets.ssdMobilenetv1.loadFromUri(`${MODEL_URL}/ssd_mobilenetv1`),
	// 	]);
	// }

	await Promise.all([
		faceapi.nets.tinyFaceDetector.loadFromUri(
			`${MODEL_URL}/tiny_face_detector`
		),
		faceapi.nets.faceLandmark68Net.loadFromUri(`${MODEL_URL}/face_landmark_68`),
		faceapi.nets.faceRecognitionNet.loadFromUri(
			`${MODEL_URL}/face_recognition`
		),
		faceapi.nets.ssdMobilenetv1.loadFromUri(`${MODEL_URL}/ssd_mobilenetv1`),
	]);
}

export { faceapi };
