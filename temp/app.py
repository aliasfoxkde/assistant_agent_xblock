#!/usr/bin/env python
import pkg_resources
import requests
import json
import logging
from datetime import datetime

from xblock.core import XBlock
from xblock.fields import Scope, String, Dict, List, Boolean, Integer, Float
from xblock.fragment import Fragment
from webob import Response

log = logging.getLogger(__name__)

"""Voice Assistance XBlock implementation using VAPI.ai with enhanced features."""
class VoiceAssistanceXBlock(XBlock):
    """
    XBlock providing voice assistance capabilities with VAPI.ai integration.
    
    Features:
    - Text-to-speech and speech-to-text capabilities
    - Context-aware AI assistance
    - Customizable voice settings
    - Conversation history tracking
    - Proactive assistance based on user behavior
    """

    # Configuration fields
    api_key = String(
        default="", 
        scope=Scope.settings,
        help="VAPI.ai API Key"
    )
    
    agent_id = String(
        default="", 
        scope=Scope.settings,
        help="VAPI.ai agent ID"
    )
    
    enabled = Boolean(
        default=True, 
        scope=Scope.settings,
        help="Enable/disable voice assistance"
    )
    
    # User preference fields
    voice_id = String(
        default="default", 
        scope=Scope.user_state,
        help="Selected voice for TTS"
    )
    
    speaking_rate = Float(
        default=1.0, 
        scope=Scope.user_state,
        help="Speaking rate (0.5 to 2.0)"
    )
    
    language = String(
        default="en-US", 
        scope=Scope.user_state,
        help="Selected language"
    )
    
    volume = Float(
        default=1.0, 
        scope=Scope.user_state,
        help="Voice volume (0.0 to 1.0)"
    )
    
    # Conversation history storage
    conversation_history = List(
        default=[], 
        scope=Scope.user_state,
        help="History of user conversations"
    )
    
    # Context tracking
    current_context = Dict(
        default={}, 
        scope=Scope.user_state,
        help="Current user context in course"
    )
    
    # Notification counter
    notification_count = Integer(
        default=0, 
        scope=Scope.user_state,
        help="Number of pending assistant notifications"
    )

    def resource_string(self, path):
        """Get the content of a resource"""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    def student_view(self, context=None):
        """
        The primary view of the VoiceAssistanceXBlock, shown to students.
        """
        # Load HTML template
        html = self.resource_string("static/html/voice_assistance.html")
        
        # Prepare context for rendering
        context = {
            'enabled': self.enabled,
            'voice_id': self.voice_id,
            'speaking_rate': self.speaking_rate,
            'language': self.language,
            'volume': self.volume,
            'notification_count': self.notification_count,
            'has_history': len(self.conversation_history) > 0
        }
        
        # Create and return fragment
        frag = Fragment(html.format(self=self, **context))
        
        # Load CSS
        frag.add_css(self.resource_string("static/css/voice_assistance.css"))
        
        # Load JavaScript
        frag.add_javascript(self.resource_string("static/js/voice_assistance.js"))
        frag.add_javascript(self.resource_string("static/js/voice_history.js"))
        frag.add_javascript(self.resource_string("static/js/voice_settings.js"))
        
        # Initialize JavaScript
        frag.initialize_js('VoiceAssistanceXBlock', {
            'api_key': self.api_key,
            'agent_id': self.agent_id,
            'voice_settings': {
                'voice_id': self.voice_id,
                'speaking_rate': self.speaking_rate,
                'language': self.language,
                'volume': self.volume
            },
            'notification_count': self.notification_count
        })
        
        return frag

    def studio_view(self, context=None):
        """
        The view for course staff in Studio.
        """
        html = self.resource_string("static/html/voice_settings.html")
        frag = Fragment(html.format(self=self))
        frag.add_css(self.resource_string("static/css/voice_assistance.css"))
        frag.add_javascript(self.resource_string("static/js/voice_settings.js"))
        frag.initialize_js('VoiceAssistanceStudioXBlock')
        return frag

    @XBlock.json_handler
    def save_settings(self, data, suffix=''):
        """
        Save admin/studio settings
        """
        self.api_key = data.get('api_key', '')
        self.agent_id = data.get('agent_id', '')
        self.enabled = data.get('enabled', True)
        
        return {'success': True}

    @XBlock.json_handler
    def update_user_preferences(self, data, suffix=''):
        """
        Update user voice preferences
        """
        self.voice_id = data.get('voice_id', self.voice_id)
        self.speaking_rate = float(data.get('speaking_rate', self.speaking_rate))
        self.language = data.get('language', self.language)
        self.volume = float(data.get('volume', self.volume))
        
        return {
            'voice_id': self.voice_id,
            'speaking_rate': self.speaking_rate,
            'language': self.language,
            'volume': self.volume
        }

    @XBlock.json_handler
    def get_conversation_history(self, data, suffix=''):
        """
        Retrieve conversation history for the user
        """
        return {
            'history': self.conversation_history
        }

    @XBlock.json_handler
    def add_conversation_entry(self, data, suffix=''):
        """
        Add a new entry to the conversation history
        """
        # Add timestamp and context
        entry = {
            'timestamp': datetime.now().isoformat(),
            'user_input': data.get('user_input', ''),
            'assistant_response': data.get('assistant_response', ''),
            'context': self.current_context.copy(),
            'audio_url': data.get('audio_url', '')
        }
        
        # Add to history (keep last 100 conversations)
        self.conversation_history.append(entry)
        if len(self.conversation_history) > 100:
            self.conversation_history = self.conversation_history[-100:]
        
        return {'success': True, 'history_count': len(self.conversation_history)}

    @XBlock.json_handler
    def clear_history(self, data, suffix=''):
        """
        Clear conversation history
        """
        self.conversation_history = []
        return {'success': True}

    @XBlock.json_handler
    def update_context(self, data, suffix=''):
        """
        Update the user's current context in the course
        """
        context = data.get('context', {})
        self.current_context.update(context)
        return {'success': True, 'context': self.current_context}

    @XBlock.json_handler
    def get_voice_options(self, data, suffix=''):
        """
        Get available voice options from VAPI.ai
        """
        # This would be replaced with an actual API call to VAPI.ai
        # For now, we'll return mock data
        voice_options = [
            {'id': 'en-US-1', 'name': 'English (US) - Female', 'language': 'en-US'},
            {'id': 'en-US-2', 'name': 'English (US) - Male', 'language': 'en-US'},
            {'id': 'en-GB-1', 'name': 'English (UK) - Female', 'language': 'en-GB'},
            {'id': 'es-ES-1', 'name': 'Spanish - Female', 'language': 'es-ES'},
            {'id': 'fr-FR-1', 'name': 'French - Male', 'language': 'fr-FR'},
            {'id': 'de-DE-1', 'name': 'German - Female', 'language': 'de-DE'}
        ]
        
        return {'voices': voice_options}

    @XBlock.json_handler
    def ask_assistant(self, data, suffix=''):
        """
        Send a question to the VAPI.ai agent and get response
        """
        if not self.api_key or not self.agent_id:
            return {'error': 'API configuration incomplete'}
        
        user_input = data.get('input', '')
        input_type = data.get('type', 'text')  # 'text' or 'audio'
        
        # This would be replaced with an actual API call to VAPI.ai
        # For demonstration, returning mock response
        mock_response = {
            'response': f"This is a simulated response to your question: '{user_input}'",
            'audio_url': 'https://example.com/audio/response.mp3'  # Simulated audio URL
        }
        
        # Add to conversation history
        self.add_conversation_entry({
            'user_input': user_input,
            'assistant_response': mock_response['response'],
            'audio_url': mock_response['audio_url']
        })
        
        return mock_response

    @XBlock.json_handler
    def clear_notifications(self, data, suffix=''):
        """
        Clear notification counter
        """
        self.notification_count = 0
        return {'success': True}

    @XBlock.json_handler
    def add_notification(self, data, suffix=''):
        """
        Add a notification (for testing purposes)
        """
        self.notification_count += 1
        return {'notification_count': self.notification_count}

    # Utility methods
    def get_course_context(self):
        """
        Get current course context information
        """
        # This would use OpenEdX's API to get current course context
        # For now, return a placeholder
        return {
            'course_id': getattr(self.runtime, 'course_id', 'unknown'),
            'section': 'Current Section',
            'subsection': 'Current Subsection',
            'unit': 'Current Unit'
        }

    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("VoiceAssistanceXBlock",
             """<voice_assistance/>
             """),
        ]
