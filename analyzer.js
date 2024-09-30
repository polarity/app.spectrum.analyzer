// Initialize variables
let audioContext, analyser, canvas, ctx, dataArray, bufferLength;
let slowDataArray, rmsDataArray;
let slopeWeight = 3; // 3dB/oct slope weighting
const slowLineDecayFactor = 0.98; // this is the decay factor for the slow line
let rmsWindowSize = 400; // Default RMS window size in ms
let rmsHistory = [];

// Colors (default values)
let peakColor = '#ff3232';
let rmsColor = 'rgba(0, 255, 0, 0.5)';
let slowLineColor = '#ffff00';
let labelColor = '#ffffff';

let thresholdDb = -60; // Default threshold value in dB
let thresholdValue = 0; // Default threshold value in linear scale

// Function to get note from frequency
function getNoteWithCents(frequency) {
  if (frequency <= 0) return 'N/A'
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const noteIndex = Math.round(12 * (Math.log2(frequency / 440) + 4))
  const octave = Math.floor(noteIndex / 12)
  const note = notes[noteIndex % 12] + octave
  
  // Calculate the exact frequency of the note
  const exactFrequency = 440 * Math.pow(2, (noteIndex - 57) / 12)
  
  // Calculate the difference in cents
  const cents = 1200 * Math.log2(frequency / exactFrequency)
  
  return `${note} (${cents.toFixed(0)} cents)`
}

// Setup audio context and analyzer
async function setupAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  slowDataArray = new Uint8Array(bufferLength);
  rmsDataArray = new Uint8Array(bufferLength);
  rmsHistory = Array(bufferLength).fill().map(() => []);

  // Get audio input devices
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audioInputs = devices.filter(device => device.kind === 'audioinput');

  // Populate audio input select
  const select = document.getElementById('audioInput');
  audioInputs.forEach(input => {
    const option = document.createElement('option');
    option.value = input.deviceId;
    option.text = input.label || `Mikrofon ${select.length + 1}`;
    select.appendChild(option);
  });

  // Set selected device from local storage
  const savedDeviceId = localStorage.getItem('selectedAudioDevice');
  if (savedDeviceId) {
    select.value = savedDeviceId;
  }

  // Listen for input changes
  select.addEventListener('change', async () => {
    const selectedDeviceId = select.value;
    localStorage.setItem('selectedAudioDevice', selectedDeviceId);
    await connectToAudioInput(selectedDeviceId);
  });

  // Initial connection to audio input
  await connectToAudioInput(select.value);

  // Add RMS window size slider
  addSlider('rmsWindow', 'RMS Window', 100, 20000, rmsWindowSize, value => {
    rmsWindowSize = parseInt(value);
    rmsHistory = Array(bufferLength).fill().map(() => []);
  });

  // Add slope weight slider
  addSlider('slopeWeight', 'Slope Weight', 0, 6, slopeWeight, value => {
    slopeWeight = parseFloat(value);
  });

  // Add threshold slider
  addSlider('threshold', 'Threshold', -100, 0, thresholdDb, value => {
    thresholdDb = parseFloat(value);
    thresholdValue = Math.pow(10, thresholdDb / 20) * 255; // convert dB to linear scale
  });

  // Add color pickers
  addColorPicker('peakColor', 'Peak Color', peakColor, value => peakColor = value);
  addColorPicker('rmsColor', 'RMS Color', rmsColor, value => rmsColor = value);
  addColorPicker('slowLineColor', 'Slow Line Color', slowLineColor, value => slowLineColor = value);
  addColorPicker('labelColor', 'Label Color', labelColor, value => labelColor = value);
}

// Function to connect to audio input
async function connectToAudioInput(deviceId) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: deviceId }
  });
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
}

// Helper function to add a slider
function addSlider(id, label, min, max, value, onChange) {
  const container = document.createElement('div');
  container.style.margin = '10px';
  const labelElement = document.createElement('label');
  labelElement.textContent = `${label}: `;
  labelElement.setAttribute('for', id);
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = id;
  slider.min = min;
  slider.max = max;
  slider.value = value;
  slider.addEventListener('input', e => onChange(e.target.value));
  container.appendChild(labelElement);
  container.appendChild(slider);
  document.body.insertBefore(container, canvas);
}

// Helper function to add a color picker
function addColorPicker(id, label, defaultColor, onChange) {
  const container = document.createElement('div');
  container.style.margin = '10px';
  const labelElement = document.createElement('label');
  labelElement.textContent = `${label}: `;
  labelElement.setAttribute('for', id);
  const picker = document.createElement('input');
  picker.type = 'color';
  picker.id = id;
  picker.value = defaultColor;
  picker.addEventListener('input', e => onChange(e.target.value));
  container.appendChild(labelElement);
  container.appendChild(picker);
  document.body.insertBefore(container, canvas);
}

// Calculate RMS for a single frequency bin
function calculateRMS(array) {
  return Math.sqrt(array.reduce((acc, val) => acc + val * val, 0) / array.length);
}

// global variables 
let smoothedPeaks = []
let labelPositions = []

// Draw function
function draw () {
  requestAnimationFrame(draw)
  
  analyser.getByteFrequencyData(dataArray)
  
  // Apply slope weighting
  for (let i = 0; i < bufferLength; i++) {
    const factor = Math.pow(10, slopeWeight * Math.log10((i + 1) / bufferLength) / 20)
    dataArray[i] *= factor
  }

  // Update RMS history and calculate RMS
  const rmsWindowSamples = Math.floor(rmsWindowSize / (1000 / 60)) // Assuming 60fps
  for (let i = 0; i < bufferLength; i++) {
    rmsHistory[i].push(dataArray[i])
    if (rmsHistory[i].length > rmsWindowSamples) {
      rmsHistory[i].shift()
    }
    rmsDataArray[i] = calculateRMS(rmsHistory[i])
  }

  // Clear canvas
  ctx.fillStyle = 'rgb(0, 0, 0)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw peak spectrum
  ctx.beginPath()
  ctx.strokeStyle = peakColor
  ctx.lineWidth = 2
  for (let i = 0; i < bufferLength; i++) {
    const x = logScale(i / bufferLength) * canvas.width
    const y = canvas.height - (dataArray[i] / 256) * canvas.height
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()

  // Draw average (RMS) spectrum
  ctx.beginPath()
  ctx.strokeStyle = rmsColor
  ctx.lineWidth = 2
  for (let i = 0; i < bufferLength; i++) {
    const x = logScale(i / bufferLength) * canvas.width
    const y = canvas.height - (rmsDataArray[i] / 256) * canvas.height
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()

  // Find peaks for RMS spectrum
  let peakFrequencies = []
  for (let i = 1; i < bufferLength - 1; i++) {
    if (rmsDataArray[i] > rmsDataArray[i - 1] && rmsDataArray[i] > rmsDataArray[i + 1]) {
      peakFrequencies.push({ index: i, value: rmsDataArray[i] })
    }
  }
  peakFrequencies.sort((a, b) => b.value - a.value)
  peakFrequencies = peakFrequencies.slice(0, 4)

  // Update smoothed peaks and label positions
  if (smoothedPeaks.length === 0) {
    smoothedPeaks = peakFrequencies.map(peak => ({ ...peak }))
    labelPositions = peakFrequencies.map(peak => logScale(peak.index / bufferLength))
  } else {
    smoothedPeaks = smoothedPeaks.map((smoothedPeak, i) => {
      const targetPeak = peakFrequencies[i] || { index: smoothedPeak.index, value: 0 }
      return {
        index: smoothedPeak.index * 0.99 + targetPeak.index * 0.01,
        value: smoothedPeak.value * 0.9 + targetPeak.value * 0.1
      }
    })
    labelPositions = labelPositions.map((pos, i) => {
      const targetPos = peakFrequencies[i] ? logScale(peakFrequencies[i].index / bufferLength) : pos
      return pos * 0.995 + targetPos * 0.005
    })
  }

  // Label peaks
  ctx.fillStyle = labelColor
  ctx.font = '12px Arial'
  let labelCount = 0
  smoothedPeaks.forEach((peak, index) => {
    if (peak.value > thresholdValue || labelCount < 3) {
      const frequency = peak.index * audioContext.sampleRate / analyser.fftSize
      const note = getNoteWithCents(frequency)
      const labelX = labelPositions[index] * canvas.width
      const labelY = 20 + labelCount * 20 // Position labels at the top of the canvas

      // Draw label background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      const labelText = `${frequency.toFixed(0)}Hz ${note}`
      const labelWidth = ctx.measureText(labelText).width + 10
      ctx.fillRect(labelX - labelWidth / 2, labelY - 10, labelWidth, 20)

      // Draw label text
      ctx.fillStyle = labelColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(labelText, labelX, labelY)

      // Draw line to peak
      const peakX = logScale(peak.index / bufferLength) * canvas.width
      const peakY = canvas.height - (peak.value / 256) * canvas.height
      ctx.beginPath()
      ctx.moveTo(labelX, labelY + 10)
      ctx.lineTo(peakX, peakY)
      ctx.strokeStyle = peak.value > thresholdValue ? labelColor : 'rgba(255, 255, 255, 0.3)'
      ctx.stroke()

      labelCount++
    }
  })

  // Draw threshold line
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 1
  const thresholdY = canvas.height - (thresholdValue / 256) * canvas.height
  ctx.moveTo(0, thresholdY)
  ctx.lineTo(canvas.width, thresholdY)
  ctx.stroke()

  // Draw frequency guide
  drawFrequencyGuide()
}

// Draw frequency guide
function drawFrequencyGuide() {
  const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
  ctx.fillStyle = labelColor
  ctx.font = '10px Arial'
  ctx.textAlign = 'center'
  
  frequencies.forEach(freq => {
    const x = logScale(freq / (audioContext.sampleRate / 2)) * canvas.width
    ctx.fillText(`${freq >= 1000 ? (freq / 1000) + 'k' : freq}Hz`, x, canvas.height - 5)
    ctx.beginPath()
    ctx.moveTo(x, canvas.height - 20)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  })
}

// Logarithmic scale function
function logScale(index) {
  const logmin = Math.log(1)
  const logmax = Math.log(bufferLength)
  const scale = (Math.log(index * (bufferLength - 1) + 1) - logmin) / (logmax - logmin)
  return scale
}

// Initialize
async function init() {
  await setupAudio();
  canvas = document.getElementById('analyzer');
  ctx = canvas.getContext('2d');
  draw();
}

init();