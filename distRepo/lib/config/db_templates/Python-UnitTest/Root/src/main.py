##
# Main function of the Python program.
#
##

from finder import maximum_in_list

def main():
    # we print a heading and make it bigger using HTML formatting
    print "<h4>-- Maximun Element Finder --</h4>"
    maximum = maximum_in_list([2, 3, 42, 12, 7])
    print "The maximum element is: ", maximum


if __name__ == '__main__':
    main()
