/* Voice Assistance XBlock JavaScript */

function VoiceAssistanceXBlock(runtime, element) {
    const apiUrl = runtime.handlerUrl(element, 'handle_api_request');
    const historyUrl = runtime.handlerUrl(element, 'get_conversation_history');
    const saveSettingsUrl = runtime.handlerUrl(element, 'save_user_settings');
    const updateContextUrl = runtime.handlerUrl(element, 'update_context');
    
    // DOM Elements
    const assistantButton = $('#voice-assistant-button', element);
    const assistantPanel = $('#voice-assistant-panel', element);
    const minimizeButton = $('#minimize-button', element);
    const conversationArea = $('#conversation-area', element);
    const textInput = $('#text-input', element);
    const sendButton = $('#send-button', element);
    const recordButton = $('#voice-recording-button', element);
    const contextBadge = $('#context-badge', element);
    
    // Settings elements
    const settingsButton = $('#settings-button', element);
    const settingsPanel = $('#settings-panel', element);
    const closeSettingsButton = $('#close-settings-button', element);
    const saveSettingsButton = $('#save-settings', element);
    const cancelSettingsButton = $('#cancel-settings', element);
    
    // History elements
    const historyButton = $('#history-button', element);
    const historyPanel = $('#history-panel', element);
    const historyContainer = $('#history-container', element);
    const closeHistoryButton = $('#close-history-button', element);
    
    // Settings form elements
    const voiceSelect = $('#voice-select', element);
    const languageSelect = $('#language-select', element);
    const speedRange = $('#speed-range', element);
    const volumeRange = $('#volume-range', element);
    
    // Speech recognition and synthesis
    let recognition = null;
    let isRecording = false;
    let synthesis = window.speechSynthesis;
    let currentUtterance = null;
    
    // Context tracking
    let currentContext = {};
    
    // Initialize the component
    function initialize() {
        // Load initial settings and state
        loadUserSettings();
        updateContextBadge();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize speech recognition if available
        setupSpeechRecognition();
        
        // Update context based on current page
        gatherCurrentContext();
        
        // Check for notifications
        checkForNotifications();
    }
    
    // Event listeners setup
    function setupEventListeners() {
        // Main button and panel controls
        assistantButton.on('click', toggleAssistantPanel);
        minimizeButton.on('click', minimizeAssistantPanel);
        
        // Input handlers
        textInput.on('keypress', function(e) {
            if (e.which === 13) sendUserMessage();
        });
        sendButton.on('click', sendUserMessage);
        recordButton.on('click', toggleVoiceRecording);
        
        // Settings panel
        settingsButton.on('click', openSettingsPanel);
        closeSettingsButton.on('click', closeSettingsPanel);
        saveSettingsButton.on('click', saveUserSettings);
        cancelSettingsButton.on('click', closeSettingsPanel);
        
        // Settings form interactions
        speedRange.on('input', updateRangeValue);
        volumeRange.on('input', updateRangeValue);
        
        // History panel
        historyButton.on('click', openHistoryPanel);
        closeHistoryButton.on('click', closeHistoryPanel);
        
        // Listen for page navigation
        $(window).on('hashchange', gatherCurrentContext);
    }
    
    // Speech recognition setup
    function setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            
            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                textInput.val(transcript);
                sendUserMessage();
            };
            
            recognition.onend = function() {
                isRecording = false;
                recordButton.removeClass('recording');
            };
            
            recognition.onerror = function(event) {
                console.error('Speech recognition error', event.error);
                isRecording = false;
                recordButton.removeClass('recording');
                addSystemMessage("I couldn't hear you. Please try again or type your message.");
            };
        }
    }
    
    // UI Control Functions
    function toggleAssistantPanel() {
        if (assistantPanel.hasClass('active')) {
            minimizeAssistantPanel();
        } else {
            assistantPanel.addClass('active');
            settingsPanel.removeClass('active').addClass('hidden');
            historyPanel.removeClass('active').addClass('hidden');
            assistantButton.removeClass('has-notifications').removeAttr('data-count');
            textInput.focus();
            
            // Reset notification count in backend
            $.post(apiUrl, {
                action: 'reset_notifications'
            });
        }
    }
    
    function minimizeAssistantPanel() {
        assistantPanel.removeClass('active');
        settingsPanel.removeClass('active').addClass('hidden');
        historyPanel.removeClass('active').addClass('hidden');
    }
    
    function openSettingsPanel() {
        assistantPanel.removeClass('active');
        historyPanel.removeClass('active').addClass('hidden');
        settingsPanel.removeClass('hidden').addClass('active');
        
        // Ensure settings are up to date
        loadUserSettings();
    }
    
    function closeSettingsPanel() {
        settingsPanel.removeClass('active');
        assistantPanel.addClass('active');
    }
    
    function openHistoryPanel() {
        assistantPanel.removeClass('active');
        settingsPanel.removeClass('active').addClass('hidden');
        historyPanel.removeClass('hidden').addClass('active');
        
        // Load history
        loadConversationHistory();
    }
    
    function closeHistoryPanel() {
        historyPanel.removeClass('active');
        assistantPanel.addClass('active');
    }
    
    // Input and Messaging Functions
    function sendUserMessage() {
        const message = textInput.val().trim();
        if (!message) return;
        
        // Add message to conversation
        addUserMessage(message);
        textInput.val('').focus();
        
        // Show typing indicator
        addTypingIndicator();
        
        // Send to backend for processing
        $.post(apiUrl, {
            action: 'process_message',
            message: message,
            context: JSON.stringify(currentContext)
        }).done(function(response) {
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add assistant response
            if (response.success) {
                addAssistantMessage(response.message);
                
                // Speak the response if settings allow
                speakAssistantMessage(response.message);
                
                // Update context if needed
                if (response.update_context) {
                    currentContext = {...currentContext, ...response.context_data};
                    updateContextBadge();
                }
            } else {
                addSystemMessage("Sorry, I encountered an error. Please try again.");
            }
        }).fail(function() {
            removeTypingIndicator();
            addSystemMessage("I'm having trouble connecting. Please check your internet connection.");
        });
    }
    
    function toggleVoiceRecording() {
        if (!recognition) {
            addSystemMessage("Voice recognition is not supported in your browser.");
            return;
        }
        
        if (isRecording) {
            recognition.stop();
            isRecording = false;
            recordButton.removeClass('recording');
        } else {
            // Stop any ongoing speech
            if (currentUtterance) {
                synthesis.cancel();
            }
            
            recognition.start();
            isRecording = true;
            recordButton.addClass('recording');
            addSystemMessage("Listening...");
        }
    }
    
    function speakAssistantMessage(message) {
        // Check if speech synthesis is available
        if (!synthesis) return;
        
        // Cancel any ongoing speech
        synthesis.cancel();
        
        // Create utterance with current settings
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = parseFloat(speedRange.val());
        utterance.volume = parseFloat(volumeRange.val());
        utterance.lang = languageSelect.val();
        
        // Use VAPI.ai voices if available, otherwise use browser default
        // This is a placeholder - actual implementation would depend on how VAPI.ai provides voices
        
        currentUtterance = utterance;
        synthesis.speak(utterance);
        
        utterance.onend = function() {
            currentUtterance = null;
        };
    }
    
    // UI Manipulation Functions
    function addUserMessage(message) {
        const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const messageHtml = `
            <div class="message user-message">
                <div class="message-content">${escapeHtml(message)}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;
        conversationArea.append(messageHtml);
        scrollToBottom();
    }
    
    function addAssistantMessage(message) {
        const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const messageHtml = `
            <div class="message assistant-message">
                <div class="message-content">${formatMessage(message)}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;
        conversationArea.append(messageHtml);
        scrollToBottom();
    }
    
    function addSystemMessage(message) {
        const messageHtml = `
            <div class="message system-message">
                <div class="message-content">${message}</div>
            </div>
        `;
        conversationArea.append(messageHtml);
        scrollToBottom();
    }
    
    function addTypingIndicator() {
        const indicatorHtml = `
            <div class="message assistant-message typing-indicator" id="typing-indicator">
                <div class="message-content">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            </div>
        `;
        conversationArea.append(indicatorHtml);
        scrollToBottom();
    }
    
    function removeTypingIndicator() {
        $('#typing-indicator', element).remove();
    }
    
    function scrollToBottom() {
        conversationArea.scrollTop(conversationArea[0].scrollHeight);
    }
    
    // Context and Settings Functions
    function gatherCurrentContext() {
        // Get current page info
        const courseId = $('body').attr('data-course-id') || '';
        const sectionId = $('.chapter.active').attr('data-id') || '';
        const subsectionId = $('.vertical.active').attr('data-id') || '';
        const pageName = $('.page-title').text() || document.title;
        
        // Get user progress
        const completedSections = $('.completed').length;
        const totalSections = $('.chapter').length;
        
        // Update context object
        currentContext = {
            courseId: courseId,
            sectionId: sectionId,
            subsectionId: subsectionId,
            pageName: pageName,
            progress: {
                completed: completedSections,
                total: totalSections,
                percentage: Math.round((completedSections / totalSections) * 100)
            },
            timestamp: new Date().toISOString()
        };
        
        // Update backend with new context
        $.post(updateContextUrl, {
            context: JSON.stringify(currentContext)
        });
        
        // Update UI with new context
        updateContextBadge();
    }
    
    function updateContextBadge() {
        if (currentContext.pageName) {
            contextBadge.text(currentContext.pageName);
        } else {
            contextBadge.text("Course Dashboard");
        }
    }
    
    function loadUserSettings() {
        $.get(apiUrl, {
            action: 'get_user_settings'
        }).done(function(response) {
            if (response.success) {
                // Apply settings to UI
                voiceSelect.val(response.settings.voice_id);
                languageSelect.val(response.settings.language);
                speedRange.val(response.settings.speaking_rate);
                volumeRange.val(response.settings.volume);
                
                // Update range displays
                updateRangeValue.call(speedRange[0]);
                updateRangeValue.call(volumeRange[0]);
            }
        });
    }
    
    function saveUserSettings() {
        const settings = {
            voice_id: voiceSelect.val(),
            language: languageSelect.val(),
            speaking_rate: speedRange.val(),
            volume: volumeRange.val()
        };
        
        $.post(saveSettingsUrl, {
            settings: JSON.stringify(settings)
        }).done(function(response) {
            if (response.success) {
                addSystemMessage("Your voice settings have been updated.");
                closeSettingsPanel();
            } else {
                addSystemMessage("There was a problem saving your settings.");
            }
        });
    }
    
    function loadConversationHistory() {
        historyContainer.html('<div class="loading">Loading your conversation history...</div>');
        
        $.get(historyUrl).done(function(response) {
            historyContainer.empty();
            
            if (!response.history || response.history.length === 0) {
                historyContainer.html('<div class="no-history">You have no conversation history yet.</div>');
                return;
            }
            
            // Group by date
            const groupedHistory = groupHistoryByDate(response.history);
            
            // Add each date group
            Object.keys(groupedHistory).forEach(date => {
                historyContainer.append(`<div class="conversation-date">${date}</div>`);
                
                // Add conversations for this date
                groupedHistory[date].forEach(convo => {
                    const convoHtml = `
                        <div class="conversation-item" data-id="${convo.id}">
                            <div class="conversation-topic">${convo.topic}</div>
                            <div class="conversation-preview">${convo.preview}</div>
                            <div class="conversation-meta">
                                <span class="conversation-time">${convo.time}</span>
                                <span class="conversation-context">${convo.context}</span>
                            </div>
                        </div>
                    `;
                    historyContainer.append(convoHtml);
                });
            });
            
            // Add click handler to conversation items
            $('.conversation-item', element).on('click', function() {
                const convoId = $(this).attr('data-id');
                loadConversationDetail(convoId);
            });
        }).fail(function() {
            historyContainer.html('<div class="error">Failed to load conversation history.</div>');
        });
    }
    
    function loadConversationDetail(convoId) {
        $.get(historyUrl, {
            conversation_id: convoId
        }).done(function(response) {
            if (response.success && response.conversation) {
                // Clear current conversation
                conversationArea.empty();
                
                // Add each message
                response.conversation.messages.forEach(msg => {
                    if (msg.role === 'user') {
                        addUserMessage(msg.content);
                    } else {
                        addAssistantMessage(msg.content);
                    }
                });
                
                // Close history panel, show conversation panel
                closeHistoryPanel();
            }
        });
    }
    
    function checkForNotifications() {
        $.get(apiUrl, {
            action: 'check_notifications'
        }).done(function(response) {
            if (response.count > 0) {
                assistantButton.addClass('has-notifications').attr('data-count', response.count);
            }
        });
        
        // Check periodically
        setTimeout(checkForNotifications, 60000);
    }
    
    // Utility Functions
    function updateRangeValue() {
        const value = $(this).val();
        const display = $(this).next('.range-value');
        
        if (this.id === 'speed-range') {
            display.text(value + 'x');
        } else if (this.id === 'volume-range') {
            display.text(Math.round(value * 100) + '%');
        }
    }
    
    function groupHistoryByDate(history) {
        const groups = {};
        
        history.forEach(convo => {
            const date = new Date(convo.timestamp).toLocaleDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push({
                id: convo.id,
                topic: convo.topic || "Conversation",
                preview: convo.preview || "...",
                time: new Date(convo.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                context: convo.context || "General assistance",
            });
        });
        
        return groups;
    }
    
    function formatMessage(message) {
        // Convert URLs to links
        let formatted = message.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        // Convert line breaks to <br>
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }
    
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Initialize the component
    initialize();
}
