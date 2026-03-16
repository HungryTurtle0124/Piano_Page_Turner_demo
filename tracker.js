import { clamp } from "./ui.js";
import { computeFeatures, drawOverlay } from "./features.js";

export function createTracker(ui, pdf, recorder) {
  const {
    videoEl, frameCanvas, frameCtx, overlay, octx,
    thr, hold, cool, calState, gazeBarX, gazeBarY, dbg,
    setAutoState, setCalState
  } = ui;

  // calibration (neutral)
  let hasNeutral = false;
  let neutralFaceX = 0.5;
  let neutralFaceY = 0.5;
  let neutralGazeX = 0.0;
  let neutralGazeY = 0.0;

  // last features for calibration button
  let lastF = null;

  // turning state
  let autoEnabled = false;
  let lastTurnMs = 0;
  let lookStartMs = null;

  // FaceMesh
  const faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  // weights: head vs eye
  const W_EYE = 1.0;
  const W_HEAD = 2.0;

  // direction flip so "look right" => meter goes right
  const FLIP_X = -1; // if it feels wrong, change to +1
  const FLIP_Y = -1; // if up/down feels reversed, flip

  function setAuto(on) {
    autoEnabled = on;
    setAutoState(on);
  }

  function calibrate() {
    if (!lastF) {
      dbg("calibrate failed (no face yet)");
      return;
    }
    neutralFaceX = lastF.face_cx;
    neutralFaceY = lastF.face_cy;
    neutralGazeX = lastF.gaze_x;
    neutralGazeY = lastF.gaze_y;
    hasNeutral = true;
    setCalState(true);
    dbg("calibrated ✅");
  }

  function computeIntent(f) {
    const headX = f.face_cx - (hasNeutral ? neutralFaceX : 0.5);
    const headY = f.face_cy - (hasNeutral ? neutralFaceY : 0.5);
    const eyeX  = f.gaze_x  - (hasNeutral ? neutralGazeX : 0.0);
    const eyeY  = f.gaze_y  - (hasNeutral ? neutralGazeY : 0.0);

    // flip directions
    const turnIntentX = FLIP_X * ((W_EYE * eyeX) + (W_HEAD * headX));
    const turnIntentY = FLIP_Y * ((W_EYE * eyeY) + (W_HEAD * headY));

    return { turnIntentX, turnIntentY };
  }

  function updateMeters(turnIntentX, turnIntentY) {
    // Use a smaller range so small movements are visible
    const rangeX = 0.08;
    const rangeY = 0.08;

    const x = clamp(turnIntentX, -rangeX, rangeX);
    const y = clamp(turnIntentY, -rangeY, rangeY);

    const pctX = ((x + rangeX) / (2 * rangeX)) * 100;
    const pctY = ((y + rangeY) / (2 * rangeY)) * 100;

    gazeBarX.style.width = `${pctX}%`;
    gazeBarY.style.width = `${pctY}%`;
  }

  function maybeTurn(turnIntentX, now) {
    const threshold = parseFloat(thr.value);
    const holdMs = parseInt(hold.value, 10);
    const cooldownMs = parseInt(cool.value, 10);

    const inCooldown = (now - lastTurnMs) < cooldownMs;

    if (!autoEnabled || inCooldown) {
      lookStartMs = null;
      return { inCooldown, threshold };
    }

    if (turnIntentX > threshold) {
      if (lookStartMs === null) lookStartMs = now;
      const held = now - lookStartMs;
      if (held >= holdMs) {
        pdf.turnNextPage();
        lastTurnMs = now;
        lookStartMs = null;
      }
    } else {
      lookStartMs = null;
    }

    return { inCooldown, threshold };
  }

  // iPad-safe camera loop
  let rafId = null;

  async function startCamera() {
    try {
      dbg("requesting camera...");

      videoEl.setAttribute("autoplay", "");
      videoEl.setAttribute("muted", "");
      videoEl.setAttribute("playsinline", "");
      videoEl.muted = true;
      videoEl.playsInline = true;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 360 } }
      });

      videoEl.srcObject = stream;

      await new Promise((resolve) => { videoEl.onloadedmetadata = () => resolve(); });
      await videoEl.play();

      // set canvas sizes once
      const vw = videoEl.videoWidth || 480;
      const vh = videoEl.videoHeight || 360;

      frameCanvas.width = vw;
      frameCanvas.height = vh;

      overlay.width = vw;
      overlay.height = vh;

      setAuto(true);
      dbg("camera playing ✅");

      const loop = async () => {
        if (!videoEl.srcObject) return;

        frameCtx.drawImage(videoEl, 0, 0, frameCanvas.width, frameCanvas.height);
        await faceMesh.send({ image: frameCanvas });

        rafId = requestAnimationFrame(loop);
      };
      loop();
    } catch (err) {
      dbg(`camera error: ${err.name} - ${err.message}`);
      setAuto(false);
    }
  }

  async function stopCamera() {
    setAuto(false);

    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;

    const stream = videoEl.srcObject;
    if (stream?.getTracks) stream.getTracks().forEach(t => t.stop());
    videoEl.srcObject = null;

    dbg("camera stopped");
  }

  // FaceMesh results
  faceMesh.onResults((results) => {
    const now = performance.now();

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      octx.clearRect(0, 0, overlay.width, overlay.height);
      dbg("no face");
      lookStartMs = null;
      lastF = null;
      return;
    }

    const lm = results.multiFaceLandmarks[0];
    drawOverlay(octx, overlay, lm);

    const f = computeFeatures(lm);
    const { turnIntentX, turnIntentY } = computeIntent(f);

    lastF = f;
    updateMeters(turnIntentX, turnIntentY);

    // record
    recorder.push({
      t_ms: now,
      ...f,
      turnIntentX,
      turnIntentY,
      label: "NONE"
    });

    // turn decision uses horizontal intent
    const { inCooldown, threshold } = maybeTurn(turnIntentX, now);

    // debug
    ui.debugEl.textContent =
`debug:
turnX=${turnIntentX.toFixed(3)} thr=${threshold.toFixed(2)}  cooldown=${inCooldown}
gaze_x=${f.gaze_x.toFixed(3)} gaze_y=${f.gaze_y.toFixed(3)}
face_cx=${f.face_cx.toFixed(3)} face_cy=${f.face_cy.toFixed(3)}
calibrated=${hasNeutral}`;
  });

  return {
    startCamera, stopCamera, calibrate,
    setAuto, setCalibrated: (v) => { hasNeutral = v; setCalState(v); },
    isCalibrated: () => hasNeutral
  };
}