# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2024-04-05

### Added
- SVG icons for feedback, history, and settings buttons
- Feedback dialog with rating system
- Improved installation instructions for Tutor
- MANIFEST.in file for proper package distribution
- Requirements.txt file for dependency management

### Changed
- Updated setup.py to be more compatible with OpenEdX build process
- Removed openai dependency to avoid conflicts
- Improved package metadata and requirements handling
- Enhanced README with detailed installation instructions
- Updated HTML templates to use SVG icons

### Fixed
- Fixed package_data handling in setup.py
- Addressed potential build issues with Tutor
- Improved error handling in VAPI API calls

## [0.1.0] - 2024-04-04

### Added
- Initial project structure and documentation
- Basic xBlock implementation with VAPI.ai integration
- Floating chat button with expandable interface
- Text and voice interaction capabilities
- Settings panel for voice customization
- Conversation history tracking
- Basic error handling and fallbacks
