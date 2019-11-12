##
# Tests used to check a submission.
#
# All tests in the "test_submission" folder are used for
# checking a submission and are executed when the
# "Submission" action is invoked.
#
##

from Root.src.main import maximum_in_list
import sys
import unittest

class subTest(unittest.TestCase):

    # test with randomly ordered elements in the list
    def test_unsorted_input(self):
        self.assertEqual(maximum_in_list([115, 54, 3, 0, 76, 665]), 665)

    # test with negative elements in the list
    def test_negative_inputs(self):
        self.assertEqual(maximum_in_list([-11, -55, -1, -12]), -1)

    # test with a large element in the list
    def test_max_number(self):
        self.assertEqual(maximum_in_list([-17, 216, sys.maxsize]), sys.maxsize)

    # test if a ValueError exception is raised when providing an empty list
    def test_empty_list(self):
        self.assertRaises(ValueError, maximum_in_list, [])


if __name__ == '__main__':
    unittest.main()
