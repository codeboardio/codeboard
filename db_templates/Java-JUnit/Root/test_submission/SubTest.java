/**
 * Tests used to check a submission.
 * 
 * All tests in the "test_submission" folder are used for 
 * checking a submission and are executed when the 
 * "Submission" action is invoked.
 * 
 */

import static org.junit.Assert.*;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;


public class SubTest {

    /** the finder instance */
    Finder finder = new Finder();

    /**
     * Before running any test, we create a Finder instance which is then used
     * by all the tests.
     */
    @Before
    public void setUp() {
        finder = new Finder();
    }

    /**
     * Defines a rule that allows in-test specification of expected exception
     * types and messages.
     */
    @Rule
    public ExpectedException exception = ExpectedException.none();

    /**
     * Testing the Finder with non-negative numbers.
     */
    @Test
    public final void testNonNegativeValues() {
        int actualResult = finder.findMaximumElement(
            new int[] { 115, 54, 3, 0, 76, 665 });
        assertTrue("Testing non-negative inputs", actualResult == 665);
    }

    /**
     * Testing the Finder with negative numbers.
     */
    @Test
    public final void testNegativeValues() {

        int actualResult = finder.findMaximumElement(
            new int[] { -11, -55, -1, -12 });
        assertTrue("Testing negative inputs", actualResult == -1);
    }

    /**
     * Testing the Finder with an empty array as input. We expect the
     * findMaximumElement method to throw an error.
     */
    @Test
    public final void testEmptyArray() {
        exception.expect(Error.class);
        exception.expectMessage("Array is empty.");
        int actualResult = finder.findMaximumElement(new int[] {});
    }

}
