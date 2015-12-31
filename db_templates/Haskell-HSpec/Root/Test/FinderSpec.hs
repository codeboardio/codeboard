-- Tests for the Root.Src.Finder module.
--
-- All tests in the folder "Test" are executed 
-- when the "Test" action is invoked.

module Root.Test.FinderSpec where

import Root.Src.Finder
import Test.Hspec
import Test.QuickCheck
import Control.Exception (evaluate)

main = hspec spec

spec::Spec
spec = do
        describe "Finder Specs: returns the maximum element of a list" $ do
                it "Test input with ascending order" $ do
                        maxFunction [1, 2, 3, 4, 5] `shouldBe` (5 :: Int)
                it "Test input with descending order" $ do
                        maxFunction [117, 56, 38, 11, 0] `shouldBe` (117 :: Int)
                it "Test input with random order" $ do
                        maxFunction [42, 11, 38, 75, 14] `shouldBe` (75 :: Int)
