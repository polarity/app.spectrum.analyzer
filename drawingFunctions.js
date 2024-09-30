import { analyser, audioContext, bufferLength, dataArray, rmsDataArray, rmsHistory } from './audioSetup.js';
import { applySlopeWeighting, updateRMSHistory, getThresholdValue } from './audioProcessing.js';
import { logScale, getNoteWithCents, peakColor, rmsColor, labelColor } from './utils.js';

let smoothedPeaks = [];
let labelPositions = [];

export function resizeCanvas(canvas) {
  const controlsContent = document.getElementById('controls-content');
  const isControlsVisible = controlsContent.classList.contains('visible');
  
  canvas.width = window.innerWidth;
  canvas.height = isControlsVisible ? window.innerHeight * 0.7 : window.innerHeight * 0.8;
}

export function draw(ctx, canvas) {
  requestAnimationFrame(() => draw(ctx, canvas));
  
  // Überprüfen und aktualisieren der Canvas-Größe bei jedem Frame
  if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight * 0.8) {
    resizeCanvas(canvas);
  }
  
  analyser.getByteFrequencyData(dataArray);
  
  applySlopeWeighting(dataArray, bufferLength);
  updateRMSHistory(dataArray, rmsHistory, rmsDataArray, bufferLength);

  // Clear canvas
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawSpectrum(ctx, canvas, dataArray, peakColor);
  drawSpectrum(ctx, canvas, rmsDataArray, rmsColor);

  const peakFrequencies = findPeaks(rmsDataArray, bufferLength);
  updateSmoothedPeaksAndLabelPositions(peakFrequencies);
  drawLabels(ctx, canvas, smoothedPeaks, labelPositions);

  drawThresholdLine(ctx, canvas);
  drawFrequencyGuide(ctx, canvas);
}

function drawSpectrum(ctx, canvas, dataArray, color) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let i = 0; i < bufferLength; i++) {
    const x = logScale(i / bufferLength, bufferLength) * canvas.width;
    const y = canvas.height - (dataArray[i] / 256) * canvas.height;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

function findPeaks(dataArray, bufferLength) {
  let peaks = [];
  for (let i = 1; i < bufferLength - 1; i++) {
    if (dataArray[i] > dataArray[i - 1] && dataArray[i] > dataArray[i + 1]) {
      peaks.push({ index: i, value: dataArray[i] });
    }
  }
  return peaks.sort((a, b) => b.value - a.value).slice(0, 4);
}

function updateSmoothedPeaksAndLabelPositions(peakFrequencies) {
  if (smoothedPeaks.length === 0) {
    smoothedPeaks = peakFrequencies.map(peak => ({ ...peak }));
    labelPositions = peakFrequencies.map(peak => logScale(peak.index / bufferLength, bufferLength));
  } else {
    smoothedPeaks = smoothedPeaks.map((smoothedPeak, i) => {
      const targetPeak = peakFrequencies[i] || { index: smoothedPeak.index, value: 0 };
      return {
        index: smoothedPeak.index * 0.99 + targetPeak.index * 0.01,
        value: smoothedPeak.value * 0.9 + targetPeak.value * 0.1
      };
    });
    labelPositions = labelPositions.map((pos, i) => {
      const targetPos = peakFrequencies[i] ? logScale(peakFrequencies[i].index / bufferLength, bufferLength) : pos;
      return pos * 0.995 + targetPos * 0.005;
    });
  }
}

function drawLabels(ctx, canvas, smoothedPeaks, labelPositions) {
  ctx.fillStyle = labelColor;
  ctx.font = '12px Arial';
  let labelCount = 0;
  const thresholdValue = getThresholdValue();
  smoothedPeaks.forEach((peak, index) => {
    if (peak.value > thresholdValue || labelCount < 3) {
      const frequency = peak.index * audioContext.sampleRate / analyser.fftSize;
      const note = getNoteWithCents(frequency);
      const labelX = labelPositions[index] * canvas.width;
      const labelY = 20 + labelCount * 20;

      // Draw label background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const labelText = `${frequency.toFixed(0)}Hz ${note}`;
      const labelWidth = ctx.measureText(labelText).width + 10;
      ctx.fillRect(labelX - labelWidth / 2, labelY - 10, labelWidth, 20);

      // Draw label text
      ctx.fillStyle = labelColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, labelX, labelY);

      // Draw line to frequency point
      const peakX = logScale(peak.index / bufferLength, bufferLength) * canvas.width;
      const peakY = canvas.height - (peak.value / 256) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(labelX, labelY + 10);
      ctx.lineTo(peakX, peakY);
      ctx.strokeStyle = peak.value > thresholdValue ? labelColor : 'rgba(255, 255, 255, 0.3)';
      ctx.stroke();

      labelCount++;
    }
  });
}

function drawThresholdLine(ctx, canvas) {
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  const thresholdY = canvas.height - (getThresholdValue() / 256) * canvas.height;
  ctx.moveTo(0, thresholdY);
  ctx.lineTo(canvas.width, thresholdY);
  ctx.stroke();
}

function drawFrequencyGuide(ctx, canvas) {
  const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  ctx.fillStyle = labelColor;
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  
  frequencies.forEach(freq => {
    const x = logScale(freq / (audioContext.sampleRate / 2), bufferLength) * canvas.width;
    ctx.fillText(`${freq >= 1000 ? (freq / 1000) + 'k' : freq}Hz`, x, canvas.height - 5);
    ctx.beginPath();
    ctx.moveTo(x, canvas.height - 20);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  });
}