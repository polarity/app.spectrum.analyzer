import { getRmsWindowSize } from './audioProcessing.js';

let audioContext, analyser, bufferLength, dataArray;
export let rmsHistory;
export let rmsDataArray;

/**
 * Sets up the audio context and handles audio input selection.
 * This function initializes the audio context, enumerates available audio devices,
 * and creates a dropdown menu for selecting the audio input device.
 * It also handles the start button to initialize the audio context.
 * 
 * @returns {void}
 */
export async function setupAudio() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audioInputs = devices.filter(device => device.kind === 'audioinput');

  const select = document.getElementById('audioInput');
  audioInputs.forEach(input => {
    const option = document.createElement('option');
    option.value = input.deviceId;
    option.text = input.label || `Mikrofon ${select.length + 1}`;
    select.appendChild(option);
  });

  const savedDeviceId = localStorage.getItem('selectedAudioDevice');
  if (savedDeviceId) {
    select.value = savedDeviceId;
  }

  select.addEventListener('change', async () => {
    const selectedDeviceId = select.value;
    localStorage.setItem('selectedAudioDevice', selectedDeviceId);
    await initializeAudioContext(selectedDeviceId);
  });

  // Add a start button to initialize audio context
  const startButton = document.getElementById('controls-start-button');
  startButton.addEventListener('click', async () => {
    await initializeAudioContext(select.value);
    startButton.disabled = true;
  });
}

/**
 * Initializes the audio context and sets up the audio processing.
 * This function creates the audio context, sets up the analyser, and connects to the audio input device.
 * 
 * @param {string} deviceId - The ID of the audio input device to connect to.
 * @returns {Promise<void>}
 */
async function initializeAudioContext(deviceId) {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  console.log('Sample rate:', audioContext.sampleRate);
  analyser = audioContext.createAnalyser();
  const fftSize = 8192; // possible values: 2048, 4096, 8192, 16384
  analyser.fftSize = fftSize;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  rmsDataArray = new Uint8Array(bufferLength);
  rmsHistory = Array(bufferLength).fill().map(() => []);

  await connectToAudioInput(deviceId);
}

/**
 * Connects to the specified audio input device.
 * This function uses the MediaDevices API to get user media and create a media stream source.
 * 
 * @param {string} deviceId - The ID of the audio input device to connect to.
 * @returns {Promise<void>}
 */
async function connectToAudioInput(deviceId) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: deviceId }
  });
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
}

/**
 * Creates a window function for frequency analysis.
 * This function generates a cosine window function of length 8192.
 * 
 * @returns {Float32Array} The generated window function.
 */
const windowFunction = new Float32Array(8192);

for (let i = 0; i < 8192; i++) {
  windowFunction[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / 8192));
}

export { analyser, audioContext, bufferLength, dataArray, windowFunction };