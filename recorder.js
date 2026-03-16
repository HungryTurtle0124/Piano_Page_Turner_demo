export function createRecorder() {
  let recording = false;
  let rows = [];

  function start() {
    rows = [];
    recording = true;
  }
  function stop() {
    recording = false;
  }
  function isRecording() { return recording; }
  function count() { return rows.length; }

  function push(features) {
    if (!recording) return;
    rows.push(features);
    if (rows.length > 20000) rows.splice(0, 2000);
  }

  function labelNext(windowMs = 1000) {
    const now = performance.now();
    for (let i = rows.length - 1; i >= 0; i--) {
      if (now - rows[i].t_ms > windowMs) break;
      rows[i].label = "NEXT";
    }
  }

  function downloadCsv(filename = "eye_page_turner_features.csv") {
    if (rows.length === 0) return;

    const header = [
      "t_ms","gaze_x","gaze_y","turnIntentX","turnIntentY",
      "blink_l","blink_r","face_cx","face_cy","label"
    ];
    const lines = [header.join(",")];

    for (const r of rows) {
      lines.push([
        r.t_ms.toFixed(1),
        r.gaze_x.toFixed(4),
        r.gaze_y.toFixed(4),
        (r.turnIntentX ?? 0).toFixed(4),
        (r.turnIntentY ?? 0).toFixed(4),
        r.blink_l.toFixed(4),
        r.blink_r.toFixed(4),
        r.face_cx.toFixed(4),
        r.face_cy.toFixed(4),
        r.label ?? "NONE"
      ].join(","));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return { start, stop, isRecording, count, push, labelNext, downloadCsv };
}