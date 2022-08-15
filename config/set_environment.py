"""
Sets environment from .env files.
"""

import os
import sys
import logging
from dotenv import load_dotenv
import platform
import requests
import json
import socket
import os.path

# logger = logging.getLogger(__name__)
# logger.warning("EPA-Cyano-Web set_environment.py")

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))


class DeployEnv:
    """
    Class for determining deploy env for running QED apps.
    """

    def __init__(self):
        self.env_path = os.path.join(PROJECT_ROOT, ".env")

    def load_deployment_environment(self):
        # TODO: Load default .env if .env not found?
        if os.path.exists(self.env_path):
            logging.info("Loading env vars from: {}.".format(self.env_path))
            load_dotenv(self.env_path)  # loads env vars into environment
        else:
            logging.warning("Could not locate env var file: {}. Assuming env vars already set in enviornment.".format(self.env_path))