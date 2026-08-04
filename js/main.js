/**
 * AutoPush Main Entry Point
 * Binds event listeners and initializes UI state.
 */

document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('submitBtn');
  const topicInput = document.getElementById('topic');
  const descInput = document.getElementById('description');
  const apiUrlInput = document.getElementById('apiUrl');
  const exampleChips = document.querySelectorAll('.example-chip');
  const newRunBtn = document.getElementById('newRunBtn');

  // Handle Tab Navigation
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('on'));
      
      tab.classList.add('active');
      const targetPanel = document.getElementById(`tab-${tab.dataset.tab}`);
      if (targetPanel) targetPanel.classList.add('on');
    });
  });

  // Handle Example Chip Clicks
  exampleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      topicInput.value = chip.textContent.trim();
      topicInput.focus();
    });
  });

  // Handle New Generation Button
  newRunBtn.addEventListener('click', () => {
    topicInput.value = '';
    descInput.value = '';
    UI.clearError();
    UI.showView('compose');
  });

  // Handle Form Submission
  async function handleGenerate() {
    const url = apiUrlInput.value.trim() || CONFIG.DEFAULT_API_URL;
    const topic = topicInput.value.trim();
    const description = descInput.value.trim();

    UI.clearError();
    UI.showView('loading');
    UI.startLoadingMessages();
    submitBtn.disabled = true;

    try {
      const data = await ApiService.generateCode(
        { topic, description, topicHistory: [] },
        url
      );

      UI.renderResults(data);
      UI.stopLoadingMessages();
      UI.showView('results');
    } catch (err) {
      UI.stopLoadingMessages();
      UI.showView('compose');
      UI.showError(err.message);
    } finally {
      submitBtn.disabled = false;
    }
  }

  submitBtn.addEventListener('click', handleGenerate);

  // Allow pressing Enter in Topic Input to Submit
  topicInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  });
});
