import { $, setText, setEnabled } from "./ui.js";
import { initPdfViewer } from "./pdf_viewer.js";
import { createRecorder } from "./recorder.js";
import { createTracker } from "./tracker.js";

const ui = {
  // PDF
  pdfInput: $("pdfInput"),
  pdfCanvas: $("pdfCanvas"),
  pageNumEl: $("pageNum"),
  pageCountEl: $("pageCount"),
  prevBtn: $("prevBtn"),
  nextBtn: $("nextBtn"),

  // Camera
  startCamBtn: $("startCamBtn"),
  stopCamBtn: $("stopCamBtn"),
  calibBtn: $("calibBtn"),
  videoEl: $("video"),
  overlay: $("overlay"),
  debugEl: $("debug"),

  // Hidden frame canvas
  frameCanvas: $("frameCanvas"),
  frameCtx: $("frameCanvas").getContext("2d", { willReadFrequently: true }),
  octx: $("overlay").getContext("2d"),

  // Meters
  gazeBarX: $("gazeBarX"),
  gazeBarY: $("gazeBarY"),

  // Sliders
  thr: $("thr"),
  hold: $("hold"),
  cool: $("cool"),
  thrVal: $("thrVal"),
  holdVal: $("holdVal"),
  coolVal: $("coolVal"),

  // States
  autoState: $("autoState"),
  calState: $("calState"),

  // Recorder
  recState: $("recState"),
  toggleRecBtn: $("toggleRecBtn"),
  labelNextBtn: $("labelNextBtn"),
  downloadCsvBtn: $("downloadCsvBtn"),

  dbg: (msg) => { $("debug").textContent = `debug: ${msg}`; },

  setAutoState: (on) => {
    setText($("autoState"), on ? "ON" : "OFF");
    $("autoState").style.fontWeight = on ? "700" : "400";
  },
  setCalState: (on) => {
    setText($("calState"), on ? "YES" : "NO");
    $("calState").style.fontWeight = on ? "700" : "400";
  }
};

// slider labels
function syncSliders() {
  setText(ui.thrVal, ui.thr.value);
  setText(ui.holdVal, ui.hold.value);
  setText(ui.coolVal, ui.cool.value);
}
ui.thr.addEventListener("input", syncSliders);
ui.hold.addEventListener("input", syncSliders);
ui.cool.addEventListener("input", syncSliders);
syncSliders();

const pdf = initPdfViewer(ui);
const recorder = createRecorder();

// Buttons start disabled until camera starts
setEnabled(ui.stopCamBtn, false);
setEnabled(ui.calibBtn, false);
setEnabled(ui.toggleRecBtn, false);
setEnabled(ui.labelNextBtn, false);
setEnabled(ui.downloadCsvBtn, false);

ui.setAutoState(false);
ui.setCalState(false);

const tracker = createTracker(ui, pdf, recorder);

// Start/Stop camera
ui.startCamBtn.addEventListener("click", async () => {
  await tracker.startCamera();
  setEnabled(ui.stopCamBtn, true);
  setEnabled(ui.calibBtn, true);
  setEnabled(ui.toggleRecBtn, true);
});

ui.stopCamBtn.addEventListener("click", async () => {
  await tracker.stopCamera();
  setEnabled(ui.stopCamBtn, false);
});

ui.calibBtn.addEventListener("click", () => {
  tracker.calibrate();
});

// Recording UI
ui.toggleRecBtn.addEventListener("click", () => {
  if (!recorder.isRecording()) {
    recorder.start();
    setText(ui.recState, "ON");
    setText(ui.toggleRecBtn, "Stop Recording");
    setEnabled(ui.labelNextBtn, true);
    setEnabled(ui.downloadCsvBtn, false);
  } else {
    recorder.stop();
    setText(ui.recState, "OFF");
    setText(ui.toggleRecBtn, "Start Recording");
    setEnabled(ui.labelNextBtn, false);
    setEnabled(ui.downloadCsvBtn, recorder.count() > 0);
  }
});

ui.labelNextBtn.addEventListener("click", () => {
  recorder.labelNext(1000);
  setEnabled(ui.downloadCsvBtn, recorder.count() > 0);
});

ui.downloadCsvBtn.addEventListener("click", () => {
  recorder.downloadCsv();
});

ui.dbg("ready v4");