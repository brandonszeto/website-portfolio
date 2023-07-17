---
title: Leetcode
description: 📝 Documenting my leetcode exercises
date: '2023-07-09'
aliases:
  - leetcode
lastmod: '2023-07-09'
menu:
    main: 
        weight: -90
        params:
            icon: brand-leetcode
toc: true
---

Below is a collection of leetcode problems that I did on video to help me
practice technical interview questions. I find that being on video is a great
form of rubber ducking; I can practice explaining my thoughts while under
pressure.

The following closely follows the structure articulated by [NeetCode](https://neetcode.io).
I also took notes on how I felt about each problem/performance.

⭐️0/50 Hard ⭐️ |
⭐️8/100 Medium ⭐️|
⭐️14/200 Easy ⭐️

## Hard

## Medium
### 128. Longest Consecutive Sequence [Python]
📆 July 17, 2023

🖇️ Topic: Arrays

📝 Notes: Check whether beginning of a sequence, and if so, loop until end of
the sequence (by checking if next number in sequence exists in array) whilst 
counting the length of the sequence

🧩 Pattern: Hashing frequency of something

{{< youtube pYTXaCshEWQ>}}

### 167. Two Sum II [Python]
📆 July 17, 2023

🖇️ Topic: Two Pointers

📝 Notes: Use the fact that array is sorted to determine which pointer to move,
if sum is greater than target, move right pointer to the left, and conversely,
if the sum is less than target move left pointer to the right, otherwise
return if solution exists.

🧩 Pattern: Two Pointers

{{< youtube CDAO_1IMMz4 >}}

### 15. Three Sum [Python]
📆 July 17, 2023

🖇️ Topic: Two Pointers

📝 Notes: Use the idea from two sum II at every index. Need to keep track if we
run into duplicate numbers, as duplicates in the resulting list of lists is
invalid.

🧩 Pattern: Two Pointers

{{< youtube nvWdRfoYOiA >}}

### 238. Product of Array Except Self [Python]
📆 July 16, 2023

🖇️ Topic: Arrays

📝 Notes: O(n) achieved by looping only twice: once forwards, once backwards

🧩 Pattern: Notice trick in achieving O(n)

{{< youtube 9IbkO-IoBuY >}}

### 226. Valid Sudoku [Python]
📆 July 16, 2023

🖇️ Topic: Arrays

📝 Notes: Use tuple as key, keeping a hashtable for every row, column, and grid.

🧩 Pattern: Hashing frequency of something

{{< youtube PVXwi-_vkAk >}}

### 49. Group Anagrams [Python]
📆 July 12, 2023

🖇️ Topic: Arrays and Hashing

📝 Notes: Use a dictionary as a key for another dictionary, need to use
collections.defaultdict() in order to avoid key errors when nothing exists, want
to use tuple(dict) to index e.g. somedict[tuple(dict)] because lists are mutable
and in python, you can't use a mutable object as a key in a dictionary, use
ascii values with ord(char) function to key a list instead of dictionary.

🧩 Pattern: Track information about each index using dictionary

{{< youtube cva9RKrbCmo >}}

### 347. Top K Frequent Elements [Python]
📆 July 12, 2023

🖇️ Topic: Arrays and Hashing

📝 Notes: Use .get(n, 0) to determine if it exists, use dictionary to keep track
of frequencies, use bucket sort to store freq : list of numbers rather than a
list of numbers and their respective frequencies

🧩 Pattern: Track information about each index using dictionary

{{< youtube xsggeR466kg >}}

### 226. Add Two Numbers [Python]
📆 July 11, 2023

🖇️ Topic: Linked list

📝 Notes: Minor mistakes in implementation

🧩 Pattern: Edit linked list pointers in-place

{{< youtube Mcu1FEkQJ58 >}}

## Easy
### 110. Balanced Binary Tree [Python]
📆 July 11, 2023

🖇️ Topic: Binary Tree

📝 Notes: Not confident about runtime

🧩 Pattern: Recursion, global attribute

{{< youtube hXB_-3Qt9JU >}}

### 543. Diameter of Binary Tree [Python]
📆 July 11, 2023

🖇️ Topic: Binary Tree

📝 Notes: Misinterpreted problem

🧩 Pattern: Recursion, global attribute

{{< youtube 9bKM1lsKkgM >}}

### 100. Same Binary Tree [Python]
📆 July 11, 2023

🖇️ Topic: Binary Tree

📝 Notes: 

🧩 Pattern: Recursion, global attribute

{{< youtube a1eoceSYXMY >}}

### 104. Maximum Depth of Binary Tree [Python]
📆 July 11, 2023

🖇️ Topic: Binary Tree

📝 Notes: Used self attribute

🧩 Pattern: Recursion

{{< youtube TemFMQRC-TI >}}

### 226. Invert Binary Tree [Python]
📆 July 11, 2023

🖇️ Topic: Binary Tree

📝 Notes: Mistyped variable, incorrect runtime

🧩 Pattern: Recursion

{{< youtube ajeVB36CZUg >}}

### 206. Reverse Linked List [Python]
📆 July 11, 2023

🖇️ Topic: Linked Lst

📝 Notes: Unnecessary to create an entire copy, save pointer to next in
temporary variable

🧩 Pattern: Edit pointers in-place

{{< youtube EWWf3ERQUH0 >}}

### 21. Merge Two Sorted Lists [Python]
📆 July 11, 2023

🖇️ Topic: Linked List

📝 Notes: Use a dummy node to cover edge cases

🧩 Pattern: Edit pointers in-place

{{< youtube TN-QErNkHFc >}}

### 9. Palindrome Number [Python]
📆 July 10, 2023

🖇️ Topic: Integers

📝 Notes: Small mistake in initializing a variable, // operator means divide and
floor (more concise)

🧩 Pattern: Integer manipulation

{{< youtube LIvVfZPRZhg >}}

### 13. Roman to Integer [Python]
📆 July 10, 2023

🖇️ Topic: Strings

📝 Notes: Improve explanation

🧩 Pattern: String manipulation

{{< youtube aTdwrq2ewtQ >}}

### 125. Palindrome [Python]
📆 July 9, 2023

🖇️ Topic: Two pointers, .isalnum() returns whether a character is alphanumeric

📝 Notes: Didn't feel confident

🧩 Pattern: Array and string manipulation

{{< youtube NiwPl1A-3kg >}}

### 704. Binary Search [Python]
📆 July 9, 2023

🖇️ Topic: Binary Search

📝 Notes: Messed up my variable names, thought it had something to do with floor

🧩 Pattern: Binary Search

{{< youtube AOhjXTNdMFo >}}

### 20. Valid Parentheses [Python]
📆 July 9, 2023

🖇️ Topic: Stack

📝 Notes: Messed up an edge case where stack is not empty, use .append() and
.pop() on a list to emulate behavior of stack

🧩 Pattern: Stack

{{< youtube xd3iUoUMe10 >}}

### 1. Two Sum [Python] 
📆 July 8, 2023

🖇️ Topic: Arrays and hashing 

📝 Notes: Need to get code down more quickly and didn't explain runtime

🧩 Pattern: Track information about each index using dictionary

{{< youtube 1wbFjIZYs0A >}}

### 242. Valid Anagram [Python]

📆 July 8, 2023

🖇️ Topic: Arrays and hashing 

📝 Notes: Messed up .items(), didn't explain runtime, .items() used to unpack
dictionary values, could've used .get(), didn't talk about runtime

🧩 Pattern: Track information about each index using dictionary

{{< youtube awjOq-BjR-A >}}
