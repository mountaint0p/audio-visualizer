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

        // BEGIN generic custom sphere lighting

    		// directional light
    		const lightDirection = new BABYLON.Vector3(-0.5, -1, 0.7);
    		const light = new BABYLON.DirectionalLight("DirectionalLight", lightDirection, scene);
    		light.diffuse = new BABYLON.Color3(1, 1, 1);
    		light.specular = new BABYLON.Color3(1, 1, 1);

    		const genericSphere = BABYLON.MeshBuilder.CreateSphere("genericSphere", { diameter: 2 });
    		genericSphere.position.y = 4;
    		genericSphere.position.x = 4;

    		
    		const vertexShader = `
  				attribute vec3 position;
  				attribute vec3 normal;
  				uniform mat4 world;
  				uniform mat4 view;
  				uniform mat4 projection;

  				varying vec3 worldPos;
  				varying vec3 worldNormal;

  				void main() {
						vec4 localPosition = vec4(position, 1.);
						vec4 worldPosition = world * localPosition;
						vec4 viewPosition	= view * worldPosition;
						vec4 clipPosition	= projection * viewPosition;

						worldNormal = world * normal;  // good enough!
						worldPos = worldPosition.xyz;

						gl_Position = clipPosition;
  				}
    		`;

    		const fragmentShader = `
  				uniform vec3 surfaceColor;
  				uniform vec3 lightDirection;
  				uniform float lightIntensity;
  				uniform vec3 lightColor;
  				uniform vec3 viewPosition;
  				uniform float shininess;
  				uniform float ambientTerm;
  				uniform vec3 specularColor;

  				varying vec3 worldNormal;
  				varying vec3 worldPos;

  				void main() {
  						vec3 normalizedLightDirection = normalize(lightDirection);
  						vec3 normalizedNormal = normalize(worldNormal);
  						vec3 normalizedViewDirection = normalize(viewPosition-worldPos);

  						// ambient color
  						vec3 ambientColor = ambientTerm * lightColor;

  						vec3 totalColor = ambientColor;
  						float cosineTheta = dot(normalizedNormal, -1.0 * normalizedLightDirection);
  						// only consider diffuse and specular when cos(theta) > 0.0
  						if (cosineTheta > 0.0) {
  							// diffuse
  							float intensity = cosineTheta * lightIntensity;
  							vec3 diffuseColor = intensity * (surfaceColor * lightColor);
  							// specular
  							vec3 halfVector = normalize(-1.0 * normalizedLightDirection + normalizedViewDirection);
  							float cosinePhi = dot(halfVector, normalizedNormal);
  							float shinyPower = pow(cosinePhi, shininess);
  							vec3 specularColorShown = shinyPower * specularColor;

  							totalColor = totalColor + diffuseColor + specularColorShown;
  						}
  						gl_FragColor = vec4(totalColor,1);
  				}
    		`;

    		
    		const shaderMaterial = new BABYLON.ShaderMaterial('genericShader', scene, {
    			// assign source code for vertex and fragment shader (string)
    			vertexSource: vertexShader,
    			fragmentSource: fragmentShader
    		},
    			{
    				// assign shader inputs
    				attributes: ["position", "normal"],
    				// TODO: do we need to make our own world/view/proj matrices?
    				// if so, see lab06
    				uniforms: ["world", "view", "projection",
    					"inverseTranspose", "surfaceColor",
    					"lightDirection", "lightIntensity", 
    					"viewPosition", "shininess", "ambientTerm",
    					"specularColor",
    				  // TODO more stuff to be set
    				]
    			});

    		genericSphere.material = shaderMaterial;

        // TODO finish setting variables
        const surfaceColor = BABYLON.Vector3.FromArray([1, 0, 0]);
    		function update() {
    			shaderMaterial.setVector3("surfaceColor", surfaceColor);
    			shaderMaterial.setVector3("lightDirection", light.direction);
    			shaderMaterial.setFloat("lightIntensity", light.intensity);
    			shaderMaterial.setColor3("lightColor", light.diffuse);
    			shaderMaterial.setColor3("specularColor", light.specular)
    			shaderMaterial.setVector3("viewPosition", camera.position);
    			shaderMaterial.setFloat("shininess", 50.0)
    			shaderMaterial.setFloat("ambientTerm", 0.1)
    		}
    		scene.registerBeforeRender(update);

        // END generic custom sphere lighting

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
