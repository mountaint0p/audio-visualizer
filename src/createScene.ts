import * as BABYLON from "@babylonjs/core";

class Playground {
	public static CreateScene(
		engine: BABYLON.Engine,
		canvas: HTMLCanvasElement
	): BABYLON.Scene {
		const scene = new BABYLON.Scene(engine);

		// Visualizer parameters
		const numOfBars = 256;
		const barWidth = 5;
		const totalLength = numOfBars * barWidth;
		const startX = -totalLength / 2;

		// Create a camera that centers the visualizer on the screen
		// Create a UniversalCamera positioned to center the visualizer
		const camera = new BABYLON.UniversalCamera(
			"Camera",
			new BABYLON.Vector3(0, 0, -totalLength),
			scene
		);

		// Set the camera to look at the center of the visualizer
		camera.setTarget(new BABYLON.Vector3(0, 0, 0));

		// Attach the camera to the canvas
		camera.attachControl(canvas, true);

		// Generate points along the x-axis centered around the origin
		const analyzerPoints = [];
		for (let i = 0; i < numOfBars; i++) {
			const x = startX + i * barWidth;
			analyzerPoints.push(new BABYLON.Vector3(x, 0, 0));
		}

		// Create the GreasedLine Mesh for the analyzer line
		const analyzerLine = BABYLON.CreateGreasedLine(
			"analyzer-line",
			{
				points: analyzerPoints,
				updatable: true,
			},
			{
				sizeAttenuation: false,
				useDash: true,
				dashCount: numOfBars,
				dashRatio: 0.4,
				color: new BABYLON.Color3(1, 0, 0),
			},
			scene
		);

		// Start audio playback and create the audio analyzer
		_startAudio();
		_createAnalyzer();

		function _startAudio() {
			const music = new BABYLON.Sound(
				"Music",
				"https://wave-analyzer.babylonjs.xyz/mp3/glitch-flight-track.mp3",
				scene,
				null,
				{
					loop: true,
					autoplay: true,
				}
			);
		}

		function _createAnalyzer() {
			if (BABYLON.Engine.audioEngine) {
				const analyser = new BABYLON.Analyser(scene);
				BABYLON.Engine.audioEngine.connectToAnalyser(analyser);
				analyser.BARGRAPHAMPLITUDE = 256;
				analyser.FFT_SIZE = 512;
				analyser.SMOOTHING = 0.7;

				const frequencyAdjustment = 10;

				scene.onBeforeRenderObservable.add(() => {
					const frequencies = analyser.getByteFrequencyData();
					const widths = [];

					for (let i = 0; i < numOfBars; i++) {
						const f = frequencies[i];
						const normalizedFrequency = f * frequencyAdjustment;
						widths.push(Math.max(normalizedFrequency, 1)); // Ensure minimum width
					}

					analyzerLine.widths = widths;

					// Update the line after changing widths
					if (analyzerLine.update) {
						analyzerLine.update();
					}
				});
			} else {
				console.error("No audio engine.");
			}
		}

		return scene;
	}
}

export { Playground };
