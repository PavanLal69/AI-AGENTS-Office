/**
 * Office Layout Editor & Viewport Controls UI Controller
 */
class LayoutEditorUI {
  constructor() {
    this.modalTeam = document.getElementById('modal-team-workflow');
    this.isEditing = false;

    this.initListeners();
  }

  initListeners() {
    // Zoom Controls
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnResetView = document.getElementById('btn-reset-view');
    const zoomText = document.getElementById('zoom-level');

    btnZoomIn.addEventListener('click', () => {
      if (window.officeCanvas) {
        window.officeCanvas.scale = Math.min(3.0, window.officeCanvas.scale + 0.2);
        window.officeCanvas.initCanvasSize();
        zoomText.textContent = `${Math.round(window.officeCanvas.scale * 55)}%`;
      }
    });

    btnZoomOut.addEventListener('click', () => {
      if (window.officeCanvas) {
        window.officeCanvas.scale = Math.max(1.0, window.officeCanvas.scale - 0.2);
        window.officeCanvas.initCanvasSize();
        zoomText.textContent = `${Math.round(window.officeCanvas.scale * 55)}%`;
      }
    });

    btnResetView.addEventListener('click', () => {
      if (window.officeCanvas) {
        window.officeCanvas.scale = 1.8;
        window.officeCanvas.initCanvasSize();
        zoomText.textContent = '100%';
      }
    });

    // Toggle Sound Button
    const btnAudio = document.getElementById('btn-toggle-audio');
    const audioIcon = document.getElementById('audio-icon');
    btnAudio.addEventListener('click', () => {
      if (window.audioEngine) {
        const enabled = window.audioEngine.toggleSound();
        audioIcon.className = enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
      }
    });

    // Team Workflow Modal Trigger
    document.getElementById('btn-team-workflow').addEventListener('click', () => {
      this.modalTeam.classList.add('active');
    });

    const teamForm = document.getElementById('team-workflow-form');
    teamForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const promptInput = document.getElementById('team-prompt-input');
      const prompt = promptInput.value.trim();

      if (prompt && window.mainApp && window.mainApp.sendWsEvent) {
        window.mainApp.sendWsEvent('DISPATCH_TEAM_WORKFLOW', { prompt });
        promptInput.value = '';
        this.modalTeam.classList.remove('active');
      }
    });
  }
}

window.layoutEditorUI = new LayoutEditorUI();
