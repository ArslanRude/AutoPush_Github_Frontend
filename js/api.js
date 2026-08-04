/**
 * AutoPush API Service
 * Handles communication with the FastAPI backend endpoint.
 */

const ApiService = {
  /**
   * Triggers multi-agent code generation
   * @param {Object} payload - Request payload containing topic, description, and history
   * @param {string} endpointUrl - Target API URL
   * @returns {Promise<Object>} Backend response JSON
   */
  async generateCode(payload, endpointUrl = CONFIG.DEFAULT_API_URL) {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: payload.topic || '',
        description: payload.description || '',
        topic_history: payload.topicHistory || []
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || `Request failed with status ${response.status}`);
    }

    return data;
  }
};
