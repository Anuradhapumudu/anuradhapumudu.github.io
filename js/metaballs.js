
// Configuration & State
const settings = {
    sphereCount: 20,
    fixedTopLeftRadius: 0.3,
    fixedBottomRightRadius: 0.3,
    smallTopLeftRadius: 0.15,
    smallBottomRightRadius: 0.15,
    mergeDistance: 3.5,
    smoothness: 0.45,
    movementScale: 1.0,
    cursorRadiusMin: 0.25,
    enablePulse: true,
    enableGyro: true,
    autoCycle: true,
    autoCycleSpeed: 10000 // ms
};

// Shader Code
const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uPixelRatio; // Added pixel ratio uniform
uniform vec2 uMousePosition;
uniform vec3 uCursorSphere;
uniform float uCursorRadius;
uniform int uSphereCount;
uniform float uMergeDistance;
uniform float uSmoothness;
uniform vec3 uBackgroundColor;
uniform vec3 uSphereColor;
uniform bool uIsMobile;

// Pulse Uniforms
uniform float uPulseTime;
uniform vec2 uPulseOrigin;
uniform float uPulseIntensity;

varying vec2 vUv;

const float PI = 3.14159265359;
const float MAX_DIST = 100.0;

// Smooth Min Function (Metaball magic)
float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * k * 0.25;
}

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

// Convert screen coordinates to world/shader coordinates
vec3 screenToWorld(vec2 normalizedPos) {
    vec2 uv = normalizedPos * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;
    return vec3(uv * 2.0, 0.0);
}

// Signed Distance Function for the scene
float sceneSDF(vec3 pos) {
    float result = MAX_DIST;

    // Pulse Effect: Disturb position based on distance from click origin
    if (uPulseTime < 1.0 && uPulseIntensity > 0.0) {
         vec3 pOrigin = screenToWorld(uPulseOrigin);
         float distToPulse = length(pos - pOrigin);
         float pulseWave = sin(distToPulse * 10.0 - uPulseTime * 20.0) * exp(-distToPulse * 2.0) * uPulseIntensity * (1.0 - uPulseTime);
         pos += normalize(pos - pOrigin) * pulseWave * 0.5;
    }

    float t = uTime * 0.5; // Base animation speed

    // Render multiple moving spheres
    for (int i = 0; i < 20; i++) { // Hardcoded limit matching settings
        float fi = float(i);
        float radius = 0.15 + mod(fi, 3.0) * 0.05;
        
        // Orbit logic
        float orbitRadius = 0.5 + mod(fi, 2.0) * 0.3;
        float speed = 0.3 + fi * 0.1;
        float phase = fi * PI * 0.5;
        
        vec3 offset = vec3(
            sin(t * speed + phase) * orbitRadius * (uResolution.x / uResolution.y), // Stretch horizontally
            cos(t * speed * 0.8 + phase) * orbitRadius,
            0.0
        );

        float sphere = sdSphere(pos - offset, radius);
        
        // Blend everything together
        result = smin(result, sphere, uSmoothness);
    }

    // Cursor Interaction
    float cursorBall = sdSphere(pos - uCursorSphere, uCursorRadius);
    result = smin(result, cursorBall, uSmoothness);

    return result;
}

void main() {
    // Coordinate Setup
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;
    vec3 rayOrigin = vec3(uv * 2.0, 2.0); // Camera slightly back
    vec3 rayDir = normalize(vec3(0.0, 0.0, -1.0));

    // Raymarching Loop (Simplified for background)
    float t = 0.0;
    float dist = 0.0;
    int steps = 0;
    bool hit = false;
    
    // Low number of steps for performance as background
    for(int i = 0; i < 32; i++) {
        vec3 p = rayOrigin + rayDir * t;
        dist = sceneSDF(p);
        if(dist < 0.001) {
            hit = true;
            break;
        }
        t += dist;
        if(t > 10.0) break;
        steps = i;
    }

    // Coloring
    vec3 color = uBackgroundColor;
    
    if(hit) {
        // Simple lighting based on step count (fake AO/Glow)
        float glow = 1.0 - (float(steps) / 32.0);
        color = mix(uBackgroundColor, uSphereColor, glow * glow);
        
        // Add rim light/edge detection
        vec3 p = rayOrigin + rayDir * t;
        // Cheap gradient
        color += uSphereColor * 0.2 * (p.y + 1.0);
    } else {
        // Glow around blobs
        float glow = 1.0 / (dist * 2.0 + 0.1);
        color = mix(uBackgroundColor, uSphereColor, clamp(glow * 0.5, 0.0, 1.0));
    }

    gl_FragColor = vec4(color, 1.0);
}
`;

// Variables
let scene, camera, renderer, material;
let canvas;
let startTime = Date.now();
const container = document.getElementById('metaballs-container');

// Presets (Colors)
const presets = [
    { bg: new THREE.Color('#050505'), blob: new THREE.Color('#ff003c') }, // Cyber Red
    { bg: new THREE.Color('#0a0a1a'), blob: new THREE.Color('#00f3ff') }, // Cyber Cyan
    { bg: new THREE.Color('#1a0a1a'), blob: new THREE.Color('#ccff00') }, // Cyber Lime
    { bg: new THREE.Color('#000000'), blob: new THREE.Color('#ffffff') }  // Monochrome
];
let currentPreset = 0;

// State needed for pulse
const pulseState = {
    active: false,
    startTime: 0,
    origin: new THREE.Vector2(0.5, 0.5),
    intensity: 0.0
};

// Gyro State
const gyroState = {
    beta: 0,
    gamma: 0
};

// Initialization
function init() {
    if (!container) return;

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false }); // Disable antialias for perf
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Ensure size matches window
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    canvas = renderer.domElement;

    // Material
    material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(width, height) },
            uPixelRatio: { value: renderer.getPixelRatio() },
            uMousePosition: { value: new THREE.Vector2(0.5, 0.5) },
            uCursorSphere: { value: new THREE.Vector3(0, 0, 0) },
            uCursorRadius: { value: settings.cursorRadiusMin },
            uSphereCount: { value: settings.sphereCount },
            uMergeDistance: { value: settings.mergeDistance },
            uSmoothness: { value: settings.smoothness },
            uBackgroundColor: { value: presets[0].bg },
            uSphereColor: { value: presets[0].blob },
            uIsMobile: { value: window.innerWidth < 768 },
            // Pulse
            uPulseTime: { value: 100.0 },
            uPulseOrigin: { value: new THREE.Vector2(0.5, 0.5) },
            uPulseIntensity: { value: 0.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });

    const plane = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(plane, material);
    scene.add(mesh);

    // Events
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick); // Pulse trigger
    window.addEventListener('deviceorientation', onGyro); // Mobile tilt

    // Auto Cycle
    if (settings.autoCycle) {
        setInterval(cyclePreset, settings.autoCycleSpeed);
    }
}

function onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    material.uniforms.uResolution.value.set(width, height);
    material.uniforms.uIsMobile.value = width < 768;
}

function onMouseMove(e) {
    const x = e.clientX / window.innerWidth;
    const y = 1.0 - e.clientY / window.innerHeight; // Flip Y for WebGL

    material.uniforms.uMousePosition.value.set(x, e.clientY / window.innerHeight); // Normalized

    // Map usage interaction for cursor sphere (center calc)
    // Convert 0..1 to -aspect..aspect space for shader logic
    const aspect = window.innerWidth / window.innerHeight;
    material.uniforms.uCursorSphere.value.set(
        (e.clientX / window.innerWidth * 2 - 1) * aspect * 2.0,
        -(e.clientY / window.innerHeight * 2 - 1) * 2.0, // Shader Y is flipped vs DOM
        0
    );
}

function onClick(e) {
    // Trigger Pulse
    const x = e.clientX / window.innerWidth;
    const y = 1.0 - e.clientY / window.innerHeight;

    pulseState.active = true;
    pulseState.startTime = (Date.now() - startTime) / 1000;
    pulseState.origin.set(x, y);
    pulseState.intensity = 1.5; // Strength

    material.uniforms.uPulseOrigin.value.set(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    material.uniforms.uPulseIntensity.value = 1.5;
}

function onGyro(e) {
    if (!settings.enableGyro) return;

    // Simple mapping of tilt to mouse position
    // Beta: -180 to 180 (front/back)
    // Gamma: -90 to 90 (left/right)

    let x = 0.5;
    let y = 0.5;

    if (e.gamma) x = 0.5 + (e.gamma / 45) * 0.5;
    if (e.beta) y = 0.5 + ((e.beta - 45) / 45) * 0.5; // Assumes holding at 45deg

    // Clamp
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));

    // Update uniforms simulating mouse
    material.uniforms.uMousePosition.value.set(x, 1.0 - y);

    const aspect = window.innerWidth / window.innerHeight;
    material.uniforms.uCursorSphere.value.set(
        (x * 2 - 1) * aspect * 2.0,
        -(y * 2 - 1) * 2.0,
        0
    );
}

function cyclePreset() {
    currentPreset = (currentPreset + 1) % presets.length;

    // GSAP would be nice here, but let's just lerp manually or snap for now
    // Actually, manual lerping in render loop is cleaner
    // For now, simpler: direct assignment
    material.uniforms.uSphereColor.value = presets[currentPreset].blob;
    // material.uniforms.uBackgroundColor.value = presets[currentPreset].bg; 

    // Note: We might want to keep bg dark to let stars shine through
    // material.uniforms.uBackgroundColor.value = new THREE.Color('#000000');
}

function animate() {
    requestAnimationFrame(animate);

    const time = (Date.now() - startTime) / 1000;
    material.uniforms.uTime.value = time;

    // Pulse Animation Logic
    if (pulseState.active) {
        const pTime = time - pulseState.startTime;
        material.uniforms.uPulseTime.value = pTime;

        if (pTime > 2.0) { // Pulse duration
            pulseState.active = false;
            material.uniforms.uPulseIntensity.value = 0.0;
        }
    } else {
        material.uniforms.uPulseTime.value = 100.0; // Inactive
    }

    renderer.render(scene, camera);
}

// Start
init();
animate();
