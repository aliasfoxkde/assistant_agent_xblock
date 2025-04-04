/* JavaScript for VoiceAssistanceXBlock Studio Editor */

function VoiceAssistanceEditBlock(runtime, element) {
    var $element = $(element);
    
    // Form elements
    var displayName = $element.find('#display_name');
    var vapiApiKey = $element.find('#vapi_api_key');
    var voiceModel = $element.find('#voice_model');
    var voiceId = $element.find('#voice_id');
    var promptTemplate = $element.find('#prompt_template');
    var autoEnableMicrophone = $element.find('#auto_enable_microphone');
    
    // Buttons
    var cancelButton = $element.find('#cancel-button');
    var saveButton = $element.find('#save-button');
    
    // Save settings
    function saveSettings() {
        var handlerUrl = runtime.handlerUrl(element, 'save_settings');
        
        var data = {
            display_name: displayName.val(),
            vapi_api_key: vapiApiKey.val(),
            voice_model: voiceModel.val(),
            voice_id: voiceId.val(),
            prompt_template: promptTemplate.val(),
            auto_enable_microphone: autoEnableMicrophone.prop('checked')
        };
        
        $.ajax({
            type: 'POST',
            url: handlerUrl,
            data: JSON.stringify(data),
            dataType: 'json',
            success: function(response) {
                runtime.notify('save', {state: 'end'});
            },
            error: function(xhr) {
                runtime.notify('error', {
                    title: 'Error saving settings',
                    message: 'An error occurred while saving settings'
                });
            }
        });
    }
    
    // Event handlers
    saveButton.click(function(e) {
        e.preventDefault();
        saveSettings();
    });
    
    cancelButton.click(function(e) {
        e.preventDefault();
        runtime.notify('cancel', {});
    });
}
