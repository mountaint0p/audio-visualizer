import * as BABYLON from '@babylonjs/core';
import { Engine, Scene, ArcRotateCamera, Vector3, MeshBuilder, StandardMaterial, Color3, GlowLayer } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

//npm install --save babylonjs babylonjs-gui

class Playground2 {
	public static CreateScene(
		engine: BABYLON.Engine,
		canvas: HTMLCanvasElement
	):   BABYLON.Scene {
		const scene = new BABYLON.Scene(engine);


        // **Camera Setup**
        var camera = new BABYLON.ArcRotateCamera(
            "ArcRotateCamera",
            BABYLON.Tools.ToRadians(-90),
            BABYLON.Tools.ToRadians(90),
            6,
            new BABYLON.Vector3(0, 1, 0),
            scene
        );
        camera.attachControl(canvas, true);

        // **Sphere Setup**
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 1, segments: 32 }, scene);
        sphere.position = new BABYLON.Vector3(0, 1, 0);

        const material = new BABYLON.StandardMaterial("material", scene);
        material.diffuseColor = new BABYLON.Color3(0.5, 0.2, 1); // Purple color
        material.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0.5); // Glow effect
        sphere.material = material;

        // Add Glow Layer
        const glowLayer = new BABYLON.GlowLayer("glow", scene);
        glowLayer.intensity = 1.5;

        // **Audio Analyzer**
        const analyser = new BABYLON.Analyser(scene);
        if (BABYLON.Engine.audioEngine) {
            BABYLON.Engine.audioEngine.connectToAnalyser(analyser);
            analyser.FFT_SIZE = 64; // Higher resolution for smoother visuals
            analyser.SMOOTHING = 0.8;

            // Load audio track
            const track = new BABYLON.Sound(
                "track",
                "https://models.babylonjs.com/Demos/musicVisualizer/Let_them_ride.mp3",
                scene,
                null,
                { loop: true, autoplay: true }
            );

            // **Dynamic Scaling and Color Animation**
            scene.registerBeforeRender(() => {
                const frequencies = analyser.getByteFrequencyData();
                const bassFrequencies = frequencies.slice(0, 8); // Focus on bass frequencies
                const avgBass = bassFrequencies.reduce((a, b) => a + b, 0) / bassFrequencies.length;

                // Scale sphere size dynamically based on bass
                const scaleFactor = 1 + avgBass / 255; // Normalize bass value
                sphere.scaling.set(scaleFactor, scaleFactor, scaleFactor);

                // Change emissive color dynamically for a glowing effect
                material.emissiveColor.r = avgBass / 255;
                material.emissiveColor.g = (255 - avgBass) / 255;
                material.emissiveColor.b = Math.random() * (avgBass / 255); // Add randomness for dynamic visuals
            });

            const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

            const guiQuad = new GUI.Rectangle();
            guiQuad.width = "150px";
            guiQuad.height = "50px";
            guiQuad.cornerRadius = 20;
            guiQuad.color = "Orange";
            guiQuad.thickness = 4;
            guiQuad.background = "green";
            advancedTexture.addControl(guiQuad);


            const playButton = GUI.Button.CreateSimpleButton("playButton", "Play/Pause");
            playButton.width = "120px";
            playButton.height = "40px";
            playButton.color = "white";
            playButton.background = "green";
            
            playButton.onPointerDownObservable.add(() => {
                if (track.isPlaying) {
                    track.pause();
                } else {
                    track.play();
                }
            });
            
            advancedTexture.addControl(playButton);
        }
        return scene;
    };
}

export { Playground2 };
