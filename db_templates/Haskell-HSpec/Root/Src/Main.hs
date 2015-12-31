-- File containing the main function of this program.

module Root.Src.Main where

-- Import the module that defines the function maxElement
import Root.Src.Finder


-- The main entry point.
main = do
        -- We print a heading and make it bigger using HTML formatting.
        putStrLn "<h4>-- Maximun Element Finder --</h4>"

        -- Call the function to find the maximum element in a list.
        let x = maxFunction [2, 3, 42, 12, 7]
        putStrLn ("The maximum element is: " ++ (show x))
