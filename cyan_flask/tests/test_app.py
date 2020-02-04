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

		# # Test chemical if not using mock request json:
		# self.test_chemical = "aspirin"
		# self.test_smiles = "CC(=O)OC1=C(C=CC=C1)C(O)=O"  # smiles version of aspirin

		# # Defines filename structure for example JSON results from jchem WS:
		# self.filename_structure = "mock_json/smilesfilter_result_{}.json"

		# self.smilesfilter_obj = SMILESFilter()

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

	


	# def get_example_result_json(self, prop):
	# 	"""
	# 	Gets .json file of example Jchem WS result for unit testing.
	# 	"""
	# 	# filename_structure = "jchem_unittest_object_{}.json"  # {} = property (e.g., pka, tautomer)
		
	# 	filename = self.filename_structure.format(prop)
		
	# 	project_root = os.path.abspath(os.path.dirname(__file__))
	# 	filename = os.path.join(project_root, filename)

	# 	filein = open(filename, 'r')
	# 	file_data = filein.read()
	# 	filein.close()

	# 	return json.loads(file_data)

	# def test_is_valid_smiles(self):
	# 	"""
	# 	Testing smilesfilter module is_valid_smiles() function.
	# 	"""

	# 	print(">>> Running smilesfilter is_valid_smiles unit test..")

	# 	mock_json = {"result": "true"}  # expected response from ctsws

	# 	expected_result = True  # expected result from smilesfilter test function

	# 	with patch('qed.cts_app.cts_calcs.smilesfilter.requests.post') as service_mock:

	# 		service_mock.return_value.content = json.dumps(mock_json)  # sets expected result from ctsws request

	# 		response = self.smilesfilter_obj.is_valid_smiles(self.test_smiles)

	# 	try:
	# 		# Compares function response with expected json:
	# 		self.assertEqual(response, expected_result)
	# 	finally:
	# 		tab = [[response], [expected_result]]
	# 		print("\n")
	# 		print(inspect.currentframe().f_code.co_name)
	# 		print(tabulate(tab, headers='keys', tablefmt='rst'))

	# 	return