"""Setup for Voice Assistance XBlock."""

import os
import re

from setuptools import setup


def load_requirements(*requirements_paths):
    """
    Load all requirements from the specified files.
    Returns a list of requirement strings.
    """
    requirements = set()
    for path in requirements_paths:
        with open(path) as reqs:
            requirements.update(
                line.split('#')[0].strip() for line in reqs
                if is_requirement(line.strip())
            )
    return list(requirements)


def is_requirement(line):
    """
    Return True if the requirement line is a package requirement.
    Returns False for comments, blank lines, etc.
    """
    return line and not line.startswith(('-r', '#', '-e', 'git+', '-c'))


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
    version='0.1.1',
    description='Assistant Agent xBlock with VAPI.ai integration',
    long_description=open('README.md').read(),
    long_description_content_type='text/markdown',
    url='https://github.com/aliasfoxkde/assistant_agent_xblock',
    license='AGPL-3.0',
    author='Micheal L C Kinney III',
    author_email='Micheal.L.C.Kinney@gmail.com',
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Framework :: Django',
        'Intended Audience :: Education',
        'License :: OSI Approved :: GNU Affero General Public License v3',
        'Operating System :: OS Independent',
        'Programming Language :: Python :: 3',
        'Topic :: Education',
    ],
    packages=[
        'voice_assistance_xblock',
    ],
    install_requires=load_requirements('requirements.txt'),
    entry_points={
        'xblock.v1': [
            'voice_assistance = voice_assistance_xblock:VoiceAssistanceXBlock',
        ]
    },
    package_data=package_data("voice_assistance_xblock", ["static", "public"]),
    include_package_data=True,
)
