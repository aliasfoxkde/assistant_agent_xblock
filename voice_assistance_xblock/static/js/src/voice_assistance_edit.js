/* JavaScript for Voice Assistance XBlock Studio Edit */
function VoiceAssistanceXBlockEdit(runtime, element) {
    // Get the form elements
    var $element = $(element);
    var $form = $element.find('.editor-with-buttons');
    var $saveButton = $element.find('.save-button');
    var $cancelButton = $element.find('.cancel-button');
    var $speakingRate = $element.find('#speaking_rate');
    var $speakingRateValue = $element.find('#speaking_rate_value');

    // Update speaking rate value when slider changes
    $speakingRate.on('input', function() {
        $speakingRateValue.text($(this).val());
    });

    // Save handler
    $saveButton.on('click', function(e) {
        e.preventDefault();
        
        // Get form data
        var data = {
            display_name: $element.find('#display_name').val(),
            api_key: $element.find('#api_key').val(),
            assistant_id: $element.find('#assistant_id').val(),
            button_color: $element.find('#button_color').val(),
            button_position: $element.find('#button_position').val(),
            voice_id: $element.find('#voice_id').val(),
            speaking_rate: $element.find('#speaking_rate').val()
        };
        
        // Save the data
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
        $.post(handlerUrl, JSON.stringify(data)).done(function(response) {
            if (response.result === 'success') {
                runtime.notify('save', {state: 'end'});
            } else {
                runtime.notify('error', {msg: response.message});
            }
        });
    });

    // Cancel handler
    $cancelButton.on('click', function(e) {
        e.preventDefault();
        runtime.notify('cancel', {});
    });
}
