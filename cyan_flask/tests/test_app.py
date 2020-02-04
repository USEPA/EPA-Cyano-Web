import unittest
from unittest.mock import Mock, patch

# Loads environment based on deployment location:
sys.path.insert(1, os.path.join(sys.path[0], '..'))
# from config.set_environment import DeployEnv
from config.set_environment import DeployEnv



class TestApp(unittest.TestCase):
	"""
	Unit test class for app.py module, which is the Flask app
	that defines the API endpoints.
	"""

	print("cyan_flask app.py unittests conducted at " + str(datetime.datetime.today()))

	def setUp(self):
		"""
		Setup routine for Kabam unit tests.
		:return:
		"""
		# Sets up runtime environment:
		runtime_env = DeployEnv()
		runtime_env.load_deployment_environment()

	def tearDown(self):
		"""
		Teardown routine for Kabam unit tests.
		:return:
		"""
		pass
		# teardown called after each test
		# e.g. maybe write test results to some text file

	def test_get_status(self):
		"""
		Tests StatusTest endpoint GET request.
		"""
		pass

	def test_get_register(self):
		"""
		Tests Register endpoint GET request.
		"""
		pass

	def test_post_register(self):
		"""
		Tests Register endpoint POST request.
		"""
		pass

	def test_get_login(self):
		"""
		Tests Login endpoint GET request.
		"""
		pass

	def test_post_login(self):
		"""
		Tests Login endpoint POST request.
		"""
		pass

	def test_get_add_location(self):
		"""
		Tests AddLocation endpoint GET request.
		"""
		pass