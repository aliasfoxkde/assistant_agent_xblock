"""Voice Assistance XBlock implementation using VAPI.ai."""

import pkg_resources
import requests
import json
import logging

from xblock.core import XBlock
from xblock.fields import Scope, String, Boolean, List, Dict, Integer, Float
from xblock.fragment import Fragment
from xblockutils.studio_editable import StudioEditableXBlockMixin

log = logging.getLogger(__name__)

class VoiceAssistanceXBlock(StudioEditableXBlockMixin, XBlock):
    """
    XBlock providing voice assistance capabilities with VAPI.ai integration.

    Features:
    - Text-to-speech and speech-to-text capabilities
    - Floating chat interface
    - Conversation history tracking
    - Voice and text interaction options
    """

    # Studio-editable fields
    display_name = String(
        display_name="Display Name",
        help="Display name for this module",
        default="Voice Assistant",
        scope=Scope.settings,
    )

    # VAPI.ai configuration
    api_key = String(
        display_name="VAPI API Key",
        help="Your VAPI.ai API key",
        default="",
        scope=Scope.settings,
    )

    assistant_id = String(
        display_name="VAPI Assistant ID",
        help="Your VAPI.ai Assistant ID",
        default="",
        scope=Scope.settings,
    )

    # UI configuration
    button_position = String(
        display_name="Button Position",
        help="Position of the floating button",
        default="bottom-right",
        values=["bottom-right", "bottom-left", "top-right", "top-left"],
        scope=Scope.settings,
    )

    button_color = String(
        display_name="Button Color",
        help="Color of the floating button",
        default="#4CAF50",
        scope=Scope.settings,
    )

    # Voice settings
    voice_id = String(
        display_name="Voice ID",
        help="Default voice ID for the assistant",
        default="alloy",
        values=["alloy", "echo", "fable", "onyx", "nova"],
        scope=Scope.settings,
    )

    speaking_rate = Float(
        display_name="Speaking Rate",
        help="Speed at which the assistant speaks (0.5 to 2.0)",
        default=1.0,
        scope=Scope.settings,
    )

    # Student-specific fields
    conversation_history = List(
        default=[],
        scope=Scope.user_state,
        help="Keeps track of user and assistant messages"
    )

    user_settings = Dict(
        default={
            "voice_id": "alloy",
            "speaking_rate": 1.0,
            "volume": 1.0,
            "language": "en-US"
        },
        scope=Scope.user_state,
        help="User-specific voice settings"
    )

    is_expanded = Boolean(
        default=False,
        scope=Scope.user_state,
        help="Whether the chat interface is expanded"
    )

    # Make fields editable in Studio
    editable_fields = [
        'display_name',
        'api_key',
        'assistant_id',
        'button_position',
        'button_color',
        'voice_id',
        'speaking_rate',
    ]

    def resource_string(self, path):
        """Load a resource from the package."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    def student_view(self, context=None):
        """
        The primary view of the VoiceAssistanceXBlock, shown to students.
        """
        # Load the HTML template
        html = self.resource_string("static/html/voice_assistance.html")

        # Prepare context for the template
        context = {
            'self': self,
            'api_key': self.api_key,
            'assistant_id': self.assistant_id,
            'button_position': self.button_position,
            'button_color': self.button_color,
            'conversation_history': json.dumps(self.conversation_history),
            'user_settings': json.dumps(self.user_settings),
        }

        # Create and return fragment
        frag = Fragment(html.format(**context))

        # Add CSS
        frag.add_css(self.resource_string("static/css/voice_assistance.css"))

        # Add JavaScript
        frag.add_javascript(self.resource_string("static/js/voice_assistance.js"))

        # Initialize JavaScript
        frag.initialize_js('VoiceAssistanceXBlock', {
            'api_key': self.api_key,
            'assistant_id': self.assistant_id,
            'user_settings': self.user_settings,
            'conversation_history': self.conversation_history
        })

        return frag

    def studio_view(self, context=None):
        """
        Return the studio view.
        """
        return super(VoiceAssistanceXBlock, self).studio_view(context)

    @XBlock.json_handler
    def send_message(self, data, suffix=''):
        """
        Handle sending a message to VAPI.ai
        """
        if not self.api_key or not self.assistant_id:
            return {'error': 'API configuration incomplete'}

        message = data.get('message', '')
        message_type = data.get('type', 'text')  # 'text' or 'audio'

        # Add message to conversation history
        self.conversation_history.append({
            'role': 'user',
            'content': message,
            'type': message_type
        })

        try:
            # Call the appropriate VAPI API based on message type
            if message_type == 'text':
                response = self.call_vapi_text(message)
            else:
                # For audio messages, we need to handle the audio blob
                audio_blob = data.get('audio_blob')
                if not audio_blob:
                    return {'success': False, 'error': 'No audio data provided'}
                response = self.call_vapi_audio(audio_blob)

            # Add response to conversation history
            self.conversation_history.append({
                'role': 'assistant',
                'content': response.get('response', ''),
                'audio_url': response.get('audio_url', ''),
                'type': 'text'
            })

            return {
                'success': True,
                'response': response.get('response', ''),
                'audio_url': response.get('audio_url', '')
            }

        except Exception as e:
            log.error(f"Error calling VAPI API: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    @XBlock.json_handler
    def update_settings(self, data, suffix=''):
        """
        Update user voice settings
        """
        if 'voice_id' in data:
            self.user_settings['voice_id'] = data['voice_id']

        if 'speaking_rate' in data:
            self.user_settings['speaking_rate'] = float(data['speaking_rate'])

        if 'volume' in data:
            self.user_settings['volume'] = float(data['volume'])

        if 'language' in data:
            self.user_settings['language'] = data['language']

        return {
            'success': True,
            'settings': self.user_settings
        }

    @XBlock.json_handler
    def clear_history(self, data, suffix=''):
        """
        Clear conversation history
        """
        self.conversation_history = []
        return {
            'success': True
        }

    def call_vapi_text(self, message):
        """
        Call VAPI.ai API for text input
        """
        try:
            # Make an API call to VAPI.ai
            response = requests.post(
                "https://api.vapi.ai/call/text",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}",
                },
                json={
                    "assistantId": self.assistant_id,
                    "message": message,
                    "user": {
                        "firstName": "Student",  # Could be replaced with actual user info
                    },
                    "voice": {
                        "voiceId": self.user_settings.get('voice_id', 'alloy'),
                        "speed": self.user_settings.get('speaking_rate', 1.0)
                    }
                },
            )

            response.raise_for_status()
            data = response.json()

            return {
                'response': data.get('text', 'No response received'),
                'audio_url': data.get('audioUrl', '')
            }
        except Exception as e:
            log.error(f"Error calling VAPI API: {str(e)}")
            return {
                'response': f"Sorry, I encountered an error: {str(e)}",
                'audio_url': ''
            }

    def call_vapi_audio(self, audio_data):
        """
        Call VAPI.ai API for audio input
        """
        try:
            # In a real implementation, we would upload the audio file to a server
            # and then pass the URL to VAPI.ai
            # For now, we'll use a placeholder implementation

            # Create a multipart form request with the audio data
            files = {
                'audio': ('audio.wav', audio_data, 'audio/wav')
            }

            # Make an API call to VAPI.ai
            response = requests.post(
                "https://api.vapi.ai/call/audio",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                },
                files=files,
                data={
                    "assistantId": self.assistant_id,
                    "voice": json.dumps({
                        "voiceId": self.user_settings.get('voice_id', 'alloy'),
                        "speed": self.user_settings.get('speaking_rate', 1.0)
                    })
                }
            )

            response.raise_for_status()
            data = response.json()

            return {
                'response': data.get('text', 'No response received'),
                'audio_url': data.get('audioUrl', '')
            }
        except Exception as e:
            log.error(f"Error calling VAPI API for audio: {str(e)}")
            return {
                'response': f"Sorry, I encountered an error processing your voice message: {str(e)}",
                'audio_url': ''
            }

    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("VoiceAssistanceXBlock",
             """<voice_assistance/>
             """),
        ]
