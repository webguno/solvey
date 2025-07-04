
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const topicForm = document.getElementById('topic-form');
    const topicInput = document.getElementById('topic-input');
    const loader = document.getElementById('loader');
    const resultsContainer = document.getElementById('results-container');
    const output6th = document.getElementById('output-6th');
    const outputGrad = document.getElementById('output-grad');
    const outputPhd = document.getElementById('output-phd');
    const themeToggle = document.getElementById('theme-toggle');

    // API Configuration - using Python backend
    const API_URL = "/api/generate";

    // Theme Management
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    function updateTheme() {
        document.body.classList.toggle('dark-mode', isDarkMode);
        const icon = themeToggle.querySelector('i');
        icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('darkMode', isDarkMode);
    }

    themeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        updateTheme();
    });

    // Initialize theme
    updateTheme();

    // Prompts for each level - updated for Indian English
    const prompts = {
        level_6th: "Explain the topic of '{topic}' to me like I'm a school student. Use simple Hindi-English words that Indian students understand easily. Give examples from daily life in India.",
        level_grad: "Explain the topic of '{topic}' to me like I'm a college student in India. Use proper technical terms but explain them clearly. Give examples that Indian students can relate to.",
        level_phd: "Provide a detailed, expert-level explanation of the topic '{topic}' suitable for research scholars and professors in Indian universities. Include current research, technical details, and academic perspectives."
    };

    // Add input animation
    topicInput.addEventListener('focus', () => {
        topicInput.parentElement.classList.add('focused');
    });

    topicInput.addEventListener('blur', () => {
        if (!topicInput.value) {
            topicInput.parentElement.classList.remove('focused');
        }
    });

    // Form submission handler
    topicForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const topic = topicInput.value.trim();

        if (!topic) {
            showNotification('Please enter koi topic to learn!', 'warning');
            return;
        }

        // UI updates: show loader, hide old results
        loader.style.display = 'flex';
        resultsContainer.classList.add('hidden');
        output6th.innerHTML = outputGrad.innerHTML = outputPhd.innerHTML = '';

        // Add loading animation to cards
        document.querySelectorAll('.level-card').forEach(card => {
            card.classList.add('loading');
        });

        try {
            // Create all API call promises
            const promises = [
                callAPI(prompts.level_6th.replace('{topic}', topic)),
                callAPI(prompts.level_grad.replace('{topic}', topic)),
                callAPI(prompts.level_phd.replace('{topic}', topic))
            ];

            // Wait for all promises to resolve
            const [response6th, responseGrad, responsePhd] = await Promise.all(promises);

            // Display results with animation
            setTimeout(() => {
                output6th.innerHTML = formatResponse(response6th);
                outputGrad.innerHTML = formatResponse(responseGrad);
                outputPhd.innerHTML = formatResponse(responsePhd);

                resultsContainer.classList.remove('hidden');
                
                // Remove loading animation
                document.querySelectorAll('.level-card').forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.remove('loading');
                        card.classList.add('loaded');
                    }, index * 200);
                });
            }, 500);

            showNotification('Sab explanations ready ho gaye!', 'success');

        } catch (error) {
            showNotification(`Error: ${error.message}`, 'error');
            console.error(error);
        } finally {
            // Hide loader regardless of success or failure
            loader.style.display = 'none';
        }
    });

    // Notification system
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="icon ${type === 'success' ? '✓' : type === 'warning' ? '⚠' : '✗'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    /**
     * Calls the Python backend API
     * @param {string} promptText - The full prompt to send to the API.
     * @returns {Promise<string>} The generated text from the API.
     */
    async function callAPI(promptText) {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: promptText
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP Error ${response.status}`);
        }

        const data = await response.json();
        return data.text;
    }

    /**
     * A simple formatter to convert Gemini's markdown-like output to basic HTML.
     */
    function formatResponse(text) {
        // Replace **text** with <strong>text</strong> for bolding
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Replace * list item with <li> and wrap in <ul>
        formattedText = formattedText.split('\n').map(line => {
            if (line.trim().startsWith('* ')) {
                return `<li>${line.trim().substring(2)}</li>`;
            }
            return line;
        }).join('\n');

        if (formattedText.includes('<li>')) {
            formattedText = formattedText.replace(/<li>/g, '<ul><li>').replace(/<\/li>(?!\n<li>)/g, '</li></ul>');
        }

        return formattedText;
    }
});
