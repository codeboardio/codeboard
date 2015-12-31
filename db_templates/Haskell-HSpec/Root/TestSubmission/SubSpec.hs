-- Tests used to check a submission. By default we set this
-- file to hidden (h) so students won't see these test cases.
--
-- All tests in the "TestSubmission" folder are used for 
-- checking a submission and are executed when the 
-- "Submission" action is invoked.

module Root.Test.SubSpec where

import Root.Src.Finder
import Test.Hspec
import Test.QuickCheck
import Control.Exception (evaluate)

main = hspec spec

spec::Spec
spec = do
        describe "Finder Specs: returns the maximum element of a list" $ do
                it "Test input with ascending order" $ do
                        maxFunction [1, 2, 5, 44, 333] `shouldBe` (333 :: Int)
                it "Test input with descending order" $ do
                        maxFunction [435, 33, 5, 1] `shouldBe` (435 :: Int)
                it "Test input with random order" $ do
                        maxFunction [8, 2, 45, 77, 33, 5, 10] `shouldBe` (77 :: Int)
                it "Test input with negative numbers" $ do
                        maxFunction [-8, -100, -45, -77, -33, -5, -10] `shouldBe` (-5 :: Int)
