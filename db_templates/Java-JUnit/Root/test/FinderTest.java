/**
 * Tests for class Finder.
 * 
 * All tests in the folder "test" are executed 
 * when the "Test" action is invoked.
 * 
 */

import static org.junit.Assert.*;
import org.junit.Test;


public class FinderTest {

    @Test
    public final void testFindMaximumElement1() {

        // we define some test input and what result we would expect
        int[] testInput = new int[] { 1, 2, 3, 4, 5 };
        int expectedResult = 5;

        // create a Finder object and call the findMaximumElement function
        // with test input
        Finder myFinder = new Finder();
        int actualResult = myFinder.findMaximumElement(testInput);

        // the actualResult value should be the same as the expectedResult value
        assertTrue("Test input with ascending order",
                actualResult == expectedResult);
    }

    @Test
    public final void testFindMaximumElement2() {

        int[] testInput = new int[] { 117, 56, 38, 11, 0 };
        int expectedResult = 117;

        Finder myFinder = new Finder();
        int actualResult = myFinder.findMaximumElement(testInput);

        assertTrue("Test input with descending order",
                actualResult == expectedResult);
    }

    @Test
    public final void testFindMaximumElement3() {

        int[] testInput = new int[] { 42, 11, 38, 75, 14 };
        int expectedResult = 75;

        Finder myFinder = new Finder();
        int actualResult = myFinder.findMaximumElement(testInput);

        assertTrue("Test input with random order",
                actualResult == expectedResult);
    }

}
