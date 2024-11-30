import * as BABYLON from "@babylonjs/core";

class Playground {
	public static CreateScene(
		engine: BABYLON.Engine,
		canvas: HTMLCanvasElement
	): BABYLON.Scene {
		const scene = new BABYLON.Scene(engine);

		// Visualizer parameters
		const numOfBars = 256; // Adjust as needed for performance
		const barWidth = 1;
		const barDepth = 1;
		const barSpacing = 0.2;
		const totalLength = numOfBars * (barWidth + barSpacing);
		const startX = -totalLength / 2 + (barWidth + barSpacing) / 2;

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

		// Create an array to hold the bar meshes
		const bars = [];

		// Generate bars along the x-axis centered around the origin
		for (let i = 0; i < numOfBars; i++) {
			const x = startX + i * (barWidth + barSpacing);

			// Create a box (bar) for each frequency
			const bar = BABYLON.MeshBuilder.CreateBox(
				`bar${i}`,
				{ width: barWidth, depth: barDepth, height: 1 },
				scene
			);
			bar.position.x = x;
			bar.position.y = 0.5; // Initial height is 1, so y is half of that

			// Add the bar to the array
			bars.push(bar);
		}

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
				analyser.FFT_SIZE = 512; // Must be a power of two
				analyser.SMOOTHING = 0.7;

				scene.onBeforeRenderObservable.add(() => {
					const frequencies = analyser.getByteFrequencyData();
					const minHeight = 0.1;
					const maxHeight = 70;

					for (let i = 0; i < numOfBars; i++) {
						const f = frequencies[i];
						const normalizedFrequency = f / 255; // Normalize between 0 and 1

						// Calculate new height
						const newHeight =
							minHeight + normalizedFrequency * (maxHeight - minHeight);

						// Update the bar's scaling and position
						const bar = bars[i];
						bar.scaling.y = newHeight;
						bar.position.y = newHeight / 2; // Adjust position so the bar scales from the bottom
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
