function dist(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function computeFeatures(lm) {
  // face center proxy
  const face = lm[1];
  const face_cx = face.x;
  const face_cy = face.y;

  // key points
  const leftOuter = lm[33], leftInner = lm[133], leftIris = lm[468];
  const rightOuter = lm[362], rightInner = lm[263], rightIris = lm[473];

  const leftEyeWidth = Math.max(1e-6, dist(leftOuter, leftInner));
  const rightEyeWidth = Math.max(1e-6, dist(rightOuter, rightInner));

  // centers
  const leftEyeCenterX = (leftOuter.x + leftInner.x) / 2;
  const rightEyeCenterX = (rightOuter.x + rightInner.x) / 2;

  const leftEyeCenterY = (leftOuter.y + leftInner.y) / 2;
  const rightEyeCenterY = (rightOuter.y + rightInner.y) / 2;

  // horizontal gaze proxy (positive = "screen right intent" after we flip later)
  const leftGx = (leftEyeCenterX - leftIris.x) / leftEyeWidth;
  const rightGx = (rightIris.x - rightEyeCenterX) / rightEyeWidth;
  const gaze_x = (leftGx + (-rightGx)) / 2;

  // vertical gaze proxy (up => positive-ish before flip)
  const leftGy = (leftEyeCenterY - leftIris.y) / leftEyeWidth;
  const rightGy = (rightIris.y - rightEyeCenterY) / rightEyeWidth;
  const gaze_y = (leftGy + (-rightGy)) / 2;

  // blink proxy
  const blink_l = dist(lm[159], lm[145]) / leftEyeWidth;
  const blink_r = dist(lm[386], lm[374]) / rightEyeWidth;

  return { gaze_x, gaze_y, blink_l, blink_r, face_cx, face_cy };
}

export function drawOverlay(octx, overlay, lm) {
  octx.clearRect(0, 0, overlay.width, overlay.height);
  octx.fillStyle = "lime";
  const ids = [33,133,159,145,362,263,386,374,468,473];
  for (const id of ids) {
    const p = lm[id];
    const x = p.x * overlay.width;
    const y = p.y * overlay.height;
    octx.beginPath();
    octx.arc(x, y, (id === 468 || id === 473) ? 4 : 2.5, 0, Math.PI * 2);
    octx.fill();
  }
}