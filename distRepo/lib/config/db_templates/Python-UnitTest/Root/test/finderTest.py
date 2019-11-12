##
# Tests for finder.py
#
# All tests in the folder "test" are executed
# when the "Test" action is invoked.
#
##

from Root.src.finder import maximum_in_list
import unittest

class finderTest(unittest.TestCase):

    # test with a list sorted in ascending order
    def test_ascending_input(self):
        self.assertEqual(maximum_in_list([1, 2, 3, 4, 5]), 5)

    # test with a list sorted in descending order
    def test_descending_input(self):
        self.assertEqual(maximum_in_list([117, 56, 38, 11, 0]), 117)

    # test with a randomly sorted list
    def test_random_input(self):
        self.assertEqual(maximum_in_list([42, 11, 38, 75, 14]), 75)


if __name__ == '__main__':
    unittest.main()
