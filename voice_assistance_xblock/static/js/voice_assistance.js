/* Voice Assistance XBlock JavaScript */

function VoiceAssistanceXBlock(runtime, element, initArgs) {
    // Configuration
    const apiKey = initArgs.api_key;
    const assistantId = initArgs.assistant_id;
    let userSettings = initArgs.user_settings || {
        voice_id: 'alloy',
        speaking_rate: 1.0,
        volume: 1.0,
        language: 'en-US'
    };
    let conversationHistory = initArgs.conversation_history || [];

    // DOM Elements
    const container = $('#voice-assistant-container', element);
    const floatingButton = $('#voice-assistant-button', element);
    const chatPanel = $('#voice-assistant-panel', element);
    const settingsPanel = $('#settings-panel', element);
    const conversationArea = $('#conversation-area', element);
    const textInput = $('#text-input', element);
    const sendButton = $('#send-button', element);
    const voiceButton = $('#voice-recording-button', element);
    const minimizeButton = $('#minimize-button', element);
    const settingsButton = $('#settings-button', element);
    const historyButton = $('#history-button', element);
    const feedbackButton = $('#feedback-button', element);
    const closeSettingsButton = $('#close-settings-button', element);
    const saveSettingsButton = $('#save-settings-button', element);
    const resetSettingsButton = $('#reset-settings-button', element);

    // Settings elements
    const voiceSelect = $('#voice-select', element);
    const speakingRateInput = $('#speaking-rate', element);
    const speakingRateValue = $('#speaking-rate-value', element);
    const volumeInput = $('#volume', element);
    const volumeValue = $('#volume-value', element);
    const languageSelect = $('#language-select', element);

    // State variables
    let isRecording = false;
    let mediaRecorder = null;
    let audioChunks = [];

    // Handler URLs
    const sendMessageUrl = runtime.handlerUrl(element, 'send_message');
    const updateSettingsUrl = runtime.handlerUrl(element, 'update_settings');
    const clearHistoryUrl = runtime.handlerUrl(element, 'clear_history');

    // Initialize the component
    function init() {
        // Set initial values for settings
        voiceSelect.val(userSettings.voice_id);
        speakingRateInput.val(userSettings.speaking_rate);
        speakingRateValue.text(userSettings.speaking_rate);
        volumeInput.val(userSettings.volume);
        volumeValue.text(userSettings.volume);
        languageSelect.val(userSettings.language);

        // Load conversation history
        loadConversationHistory();

        // Set up event listeners
        setupEventListeners();
    }

    // Set up event listeners
    function setupEventListeners() {
        // Toggle chat panel
        floatingButton.on('click', toggleChatPanel);

        // Minimize chat panel
        minimizeButton.on('click', minimizeChatPanel);

        // Send message
        sendButton.on('click', sendTextMessage);
        textInput.on('keypress', function(e) {
            if (e.which === 13) { // Enter key
                sendTextMessage();
            }
        });

        // Voice recording
        voiceButton.on('click', toggleVoiceRecording);

        // Settings panel
        settingsButton.on('click', toggleSettingsPanel);
        closeSettingsButton.on('click', closeSettingsPanel);
        saveSettingsButton.on('click', saveSettings);
        resetSettingsButton.on('click', resetSettings);

        // Settings inputs
        speakingRateInput.on('input', function() {
            speakingRateValue.text($(this).val());
        });

        volumeInput.on('input', function() {
            volumeValue.text($(this).val());
        });

        // History button
        historyButton.on('click', clearConversationHistory);

        // Feedback button
        feedbackButton.on('click', showFeedbackDialog);
    }

    // Toggle chat panel visibility
    function toggleChatPanel() {
        chatPanel.toggleClass('expanded');
        if (settingsPanel.hasClass('visible')) {
            settingsPanel.removeClass('visible');
        }
    }

    // Minimize chat panel
    function minimizeChatPanel() {
        chatPanel.removeClass('expanded');
    }

    // Toggle settings panel
    function toggleSettingsPanel() {
        settingsPanel.toggleClass('visible');
    }

    // Close settings panel
    function closeSettingsPanel() {
        settingsPanel.removeClass('visible');
    }

    // Save settings
    function saveSettings() {
        const newSettings = {
            voice_id: voiceSelect.val(),
            speaking_rate: parseFloat(speakingRateInput.val()),
            volume: parseFloat(volumeInput.val()),
            language: languageSelect.val()
        };

        $.ajax({
            type: 'POST',
            url: updateSettingsUrl,
            data: JSON.stringify(newSettings),
            success: function(response) {
                if (response.success) {
                    userSettings = response.settings;
                    closeSettingsPanel();
                    showNotification('Settings saved successfully');
                }
            },
            error: function() {
                showNotification('Failed to save settings', true);
            }
        });
    }

    // Reset settings to default
    function resetSettings() {
        voiceSelect.val('alloy');
        speakingRateInput.val(1.0);
        speakingRateValue.text('1.0');
        volumeInput.val(1.0);
        volumeValue.text('1.0');
        languageSelect.val('en-US');
    }

    // Send text message
    function sendTextMessage() {
        const message = textInput.val().trim();
        if (!message) return;

        // Add message to UI
        addMessageToUI('user', message);

        // Clear input
        textInput.val('');

        // Show typing indicator
        showTypingIndicator();

        // Send to server
        $.ajax({
            type: 'POST',
            url: sendMessageUrl,
            data: JSON.stringify({
                message: message,
                type: 'text'
            }),
            success: function(response) {
                // Hide typing indicator
                hideTypingIndicator();

                if (response.success) {
                    // Add response to UI
                    addMessageToUI('assistant', response.response);

                    // Play audio if available
                    if (response.audio_url) {
                        playAudioResponse(response.audio_url);
                    }
                } else {
                    showNotification('Error: ' + response.error, true);
                }
            },
            error: function() {
                hideTypingIndicator();
                showNotification('Failed to send message', true);
            }
        });
    }

    // Toggle voice recording
    function toggleVoiceRecording() {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }

    // Start voice recording
    function startRecording() {
        // Check if browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showNotification('Your browser does not support voice recording', true);
            return;
        }

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                audioChunks = [];
                mediaRecorder = new MediaRecorder(stream);

                mediaRecorder.addEventListener('dataavailable', function(event) {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener('stop', function() {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    sendAudioMessage(audioBlob);

                    // Stop all tracks to release microphone
                    stream.getTracks().forEach(track => track.stop());
                });

                // Start recording
                mediaRecorder.start();
                isRecording = true;
                voiceButton.addClass('recording');
                showNotification('Recording started...');
            })
            .catch(function(error) {
                console.error('Error accessing microphone:', error);
                showNotification('Error accessing microphone', true);
            });
    }

    // Stop voice recording
    function stopRecording() {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            voiceButton.removeClass('recording');
            showNotification('Recording stopped');
        }
    }

    // Send audio message
    function sendAudioMessage(audioBlob) {
        // Show typing indicator
        showTypingIndicator();

        // Add a placeholder for the user's message
        addMessageToUI('user', '[Voice Message]');

        // Send to server
        $.ajax({
            type: 'POST',
            url: sendMessageUrl,
            data: JSON.stringify({
                message: '[Voice Message]',
                type: 'audio',
                audio_blob: audioBlob
            }),
            contentType: 'application/json',
            processData: false,
            success: function(response) {
                // Hide typing indicator
                hideTypingIndicator();

                if (response.success) {
                    // Add response to UI
                    addMessageToUI('assistant', response.response);

                    // Play audio if available
                    if (response.audio_url) {
                        playAudioResponse(response.audio_url);
                    }
                } else {
                    showNotification('Error: ' + response.error, true);
                }
            },
            error: function() {
                hideTypingIndicator();
                showNotification('Failed to send voice message', true);
            }
        });
    }

    // Play audio response
    function playAudioResponse(audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play();
    }

    // Add message to UI
    function addMessageToUI(role, content) {
        const messageClass = role === 'user' ? 'user-message' : 'assistant-message';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const messageHtml = `
            <div class="message ${messageClass}">
                <div class="message-content">${content}</div>
                <div class="message-time">${time}</div>
            </div>
        `;

        conversationArea.append(messageHtml);

        // Scroll to bottom
        conversationArea.scrollTop(conversationArea[0].scrollHeight);
    }

    // Show typing indicator
    function showTypingIndicator() {
        const indicatorHtml = `
            <div class="typing-indicator" id="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;

        conversationArea.append(indicatorHtml);
        conversationArea.scrollTop(conversationArea[0].scrollHeight);
    }

    // Hide typing indicator
    function hideTypingIndicator() {
        $('#typing-indicator', element).remove();
    }

    // Show notification
    function showNotification(message, isError = false) {
        const notificationClass = isError ? 'error-notification' : 'success-notification';

        // Remove any existing notifications
        $('.notification', element).remove();

        const notificationHtml = `
            <div class="notification ${notificationClass}">
                ${message}
            </div>
        `;

        container.append(notificationHtml);

        // Auto-hide after 3 seconds
        setTimeout(function() {
            $('.notification', element).fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    }

    // Load conversation history
    function loadConversationHistory() {
        // Clear conversation area except welcome message
        conversationArea.find('.message').remove();

        // Add messages from history
        conversationHistory.forEach(function(message) {
            addMessageToUI(message.role, message.content);
        });
    }

    // Clear conversation history
    function clearConversationHistory() {
        $.ajax({
            type: 'POST',
            url: clearHistoryUrl,
            data: JSON.stringify({}),
            success: function(response) {
                if (response.success) {
                    conversationHistory = [];
                    loadConversationHistory();
                    showNotification('Conversation history cleared');
                }
            },
            error: function() {
                showNotification('Failed to clear history', true);
            }
        });
    }

    // Show feedback dialog
    function showFeedbackDialog() {
        // Simple implementation - could be expanded with a proper form
        const feedbackHtml = `
            <div class="feedback-dialog">
                <h3>Provide Feedback</h3>
                <p>How would you rate your experience with the assistant?</p>
                <div class="rating-buttons">
                    <button class="rating-button" data-rating="1">😞</button>
                    <button class="rating-button" data-rating="2">😐</button>
                    <button class="rating-button" data-rating="3">🙂</button>
                    <button class="rating-button" data-rating="4">😊</button>
                    <button class="rating-button" data-rating="5">😍</button>
                </div>
                <textarea placeholder="Additional comments (optional)" rows="3"></textarea>
                <div class="feedback-actions">
                    <button class="cancel-feedback">Cancel</button>
                    <button class="submit-feedback">Submit</button>
                </div>
            </div>
        `;

        // Add to container
        container.append(feedbackHtml);

        // Set up event handlers
        $('.rating-button', element).on('click', function() {
            $('.rating-button', element).removeClass('selected');
            $(this).addClass('selected');
        });

        $('.cancel-feedback', element).on('click', function() {
            $('.feedback-dialog', element).remove();
        });

        $('.submit-feedback', element).on('click', function() {
            const rating = $('.rating-button.selected', element).data('rating');
            const comments = $('.feedback-dialog textarea', element).val();

            // Here you would send the feedback to the server
            // For now, just show a thank you message
            $('.feedback-dialog', element).html('<h3>Thank You!</h3><p>Your feedback has been submitted.</p>');

            // Remove after 2 seconds
            setTimeout(function() {
                $('.feedback-dialog', element).fadeOut(300, function() {
                    $(this).remove();
                });
            }, 2000);
        });
    }

    // Initialize the component
    init();
}
