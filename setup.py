"""Setup for chatgptxblock XBlock."""

import os

from setuptools import setup


def package_data(pkg, roots):
    """Generic function to find package_data.

    All of the files under each of the `roots` will be declared as package
    data for package `pkg`.

    """
    data = []
    for root in roots:
        for dirname, _, files in os.walk(os.path.join(pkg, root)):
            for fname in files:
                data.append(os.path.relpath(os.path.join(dirname, fname), pkg))

    return {pkg: data}


setup(
    name='assistant_agent_xblock',
    version='0.1.0',
    description='Assistant Agent xBlock',
    license='AGPL-3.0',
    author='Micheal L C Kinney III',
    author_email='Micheal.L.C.Kinney@gmail.com',
    packages=[
        'chatgptxblock',
        'voice_assistance_xblock',
    ],
    install_requires=[
        'XBlock',
        'openai',
        'xblock-utils',
        'requests'
    ],
    entry_points={
        'xblock.v1': [
            'chatgptxblock = chatgptxblock:ChatgptXBlock',
            'voice_assistance = voice_assistance_xblock:VoiceAssistanceXBlock',
        ]
    },
    package_data={**package_data("chatgptxblock", ["static", "public"]), **package_data("voice_assistance_xblock", ["static", "public"])},
)
