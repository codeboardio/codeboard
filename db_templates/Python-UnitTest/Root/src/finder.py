##
# A collection of functions to search in lists.
#
##


# Returns the minimum element in a list of integers
def maximum_in_list(list):

    # Your task:
    # - Check if this function works for all possible integers.
    # - Throw a ValueError if the input list is empty (see code below)

    # if not list:
    #     raise ValueError('List may not be empty')

    max_element = 0

    # we loop trough the list and look at each element
    for element in list:
        if element > max_element:
            max_element = element

    return max_element
