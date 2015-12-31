-- File containing utility functions for lists.

module Root.Src.Finder where

-- Returns the maximum element in a list.
maxFunction :: [Int] -> Int
maxFunction [] = error "List is empty. Please provide a non-empty list."
maxFunction [x] = x
maxFunction (x:xs)
        | x > maxTail = x
        | otherwise = maxTail
        where maxTail = maxFunction xs
