import { getRmsWindowSize } from './audioProcessing.js';

let audioContext, analyser, bufferLength, dataArray;
export let rmsHistory;
export let rmsDataArray;

export async function setupAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  console.log('Sample rate:', audioContext.sampleRate);
  analyser = audioContext.createAnalyser();
  const fftSize = 8192; // possible values: 2048, 4096, 8192, 16384
  analyser.fftSize = fftSize;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  rmsDataArray = new Uint8Array(bufferLength);
  rmsHistory = Array(bufferLength).fill().map(() => []);

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
    await connectToAudioInput(selectedDeviceId);
  });

  await connectToAudioInput(select.value);
}

export async function connectToAudioInput(deviceId) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: deviceId }
  });
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
}

const windowFunction = new Float32Array(8192);

for (let i = 0; i < 8192; i++) {
  windowFunction[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / 8192));
}

export { analyser, audioContext, bufferLength, dataArray, windowFunction };