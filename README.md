# README

# Voice Assistance xBlock for OpenEdX
A context-aware and interactive voice assistant integration for OpenEdX using VAPI.ai that enhances the learning experience with conversational AI capabilities.

## Features
- **Conversational AI**: Natural voice and text interactions with AI-powered assistance
- **Context Awareness**: Understands course position, progress, and user details
- **Customizable Voice**: Settings for speech speed, voice selection, accent, and language
- **Proactive Assistance**: Offers help when user appears stuck or confused
- **Conversation History**: Access to past interactions and summaries
- **Multi-Modal**: Both voice and text input supported
- **Responsive Design**: Works across desktop and mobile devices

## Documentation
- [Setup Guide](docs/STRUCTURE.md#setup) - Instructions for installing and configuring the xBlock
- [Usage Guide](docs/USAGE.md) - How to use the voice assistant in courses
- [Developer Guide](docs/STRUCTURE.md#development) - Information for developers extending the xBlock
- [Planning Documentation](docs/PLANNING.md) - Design methodology and development approach
- [Project Structure](docs/STRUCTURE.md) - Code organization and architecture
- [Task Breakdown](docs/TASKS.md) - Implementation tasks and progress tracking

## Purpose

This xBlock provides a floating, context-aware voice assistant to help learners navigate course content, answer questions, and enhance their learning experience through natural conversation. By integrating with VAPI.ai, it offers advanced voice interaction capabilities with minimal setup requirements.

## Quick Start

1. Install the package:
```bash
pip install -e git+https://github.com/yourusername/voice_assistance_xblock.git#egg=voice_assistance_xblock
```

2. Add to your advanced settings in Studio:
```"advanced_modules": ["voice_assistance"]```

3. Add the component to your course and configure API keys.

## Requirements
* OpenEdX version: Maple or later
* VAPI.ai API access (key and credentials)

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing
We welcome contributions! See our contributing guidelines for details.