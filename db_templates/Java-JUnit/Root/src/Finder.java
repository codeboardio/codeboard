/**
 * This class provides functions to search in arrays.
 * 
 */
 
public class Finder {

    /**
     * Finds the maximum element in an integer array.
     * @param input the array to search in
     * @return the maximum element of input
     */
    public int findMaximumElement(int[] input) {

        // Your task:
        // - Check if this function works for all possible integers.
        // - Throw an Error object with message "Array is empty."
        // if the input array is empty.

        int maxElement = 0;

        // loop through the array and look at each element
        for (int i = 0; i < input.length; i++) {
            if (maxElement < input[i]) {
                // current array element is greater than any we've seen before
                // so we store it as the new maximum element
                maxElement = input[i];
            }
        }

        return maxElement;
    }

}
