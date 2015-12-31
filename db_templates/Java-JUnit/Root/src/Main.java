/**
 * Main class of the Java program. 
 * 
 */

public class Main {

    public static void main(String[] args) {
        
        // we print a heading and make it bigger using HTML formatting
        System.out.println("<h4>-- Maximun Element Finder --</h4>");
        
        // create the finder and call the function to find the maximum element
        Finder myFinder = new Finder();
        int[] myArray = new int[] {2, 3, 42, 12, 7};
        int maxElement = myFinder.findMaximumElement(myArray);
        
        System.out.println("The maximum element is: " + maxElement);
    }
}
