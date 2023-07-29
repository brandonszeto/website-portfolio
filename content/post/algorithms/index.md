---
author : "Brandon Szeto"
title : "Search Algorithm Visualizer"
date : "2023-04-17"
description : "Visualization of the breadth-first-search, depth-first-search,
Dijkstra's, and A* algorithms."
tags : [
    "python",
    "pygame",
]
categories : [
    "ai",
]
image : "algorithm.jpg"
math: true
toc: true
---

## Introduction
Search is an active and purpose-driven process that enables access to data and
resources, fosters learning, problem-solving, and informed decision-making.
Remarkably, this complex process is apparent in even simple organisms like slime
molds. 

![Slime Mold](slime.jpg)

Humans have replicated nature by creating their own
search algorithms including particle swarm optimization (PSO), ant colony
optimization (ACO), and genetic algorithms (GA). However, our focus will be on
the fundamentals. In order of complexity, we have depth-first search (DFS), 
breadth-first search (BFS), Dijkstra's (UCS), and A\*. For each algorithm, 
let's consider the example of searching for a diamond in a pile of dirt.

## Depth-First Search (DFS)

Depth-First Search is a straightforward search algorithm that explores as far as
it can along a path before backtracking. In the context of our example, imagine
searching for the diamond by digging a hole deeper and deeper until we can no
longer progress. Once we reach a dead end, we backtrack to the previous poitn
where there was an unexplored path, and continue digging again from there.

To implement DFS, we can use a stack data structure. At each step, we consider
the next possible direction to dig (or the next possible direction to explore)
and push it onto the stack. This process continues until we either find the
diamond or exhaust all possible paths in our search. If we encounter a dead end,
we pop the last item from the stack and continue searching from there.
Psuedocode for DFS would look something like:

```python
procedure DFS_iterative(G, v) is
    let S be a stack
    label v as discovered
    S.push(iterator of G.adjacentEdges(v))
    while S is not empty do
        if S.peek().hasNext() then
            w = S.peek().next()
            if w is not labeled as discovered then
                label w as discovered
                S.push(iterator of G.adjacentEdges(w))
        else
            S.pop()
```

## Breadth-First Search (BFS)

Breadth-First Search is an algorithm that explores the nearest neighbors before
moving on to the next level of distant neighbors. In the context of our example,
it's like searching for the diamond by removing dirt from the pile in layers.

To implement BFS, we can simply change our data structure from a stack to a
queue. We begin by placing the starting point (e.g. at the top of our pile) in
the queue. Then, we explore all immediate neighboring points (dirt patches
around the top) before moving down the pile to the next layer of neighbors. We
continue this process layer by layer until we either find the diamond or search
through the entire pile of dirt. Psuedocode for BFS would look like:

```python
procedure BFS(G, root) is
      let Q be a queue
      label root as explored
      Q.enqueue(root)
      while Q is not empty do
          v := Q.dequeue()
          if v is the goal then
              return v
          for all edges from v to w in G.adjacentEdges(v) do
              if w is not labeled as explored then
                  label w as explored
                  w.parent := v
                  Q.enqueue(w)
```

## Dijkstra's Algorithm

Dijkstra's algorithm is used to find the shortest path from a starting point to
all other points in the graph, and UCS is Dijkstra's algorithm, but generalized
to handle non-negative and negative edge weights. Let's only consider UCS. UCS
greedily chooses the lowest-cost path to explore next. In the context of our
example, consider the case where there exists a bedrock that takes more time to
dig through. When we have the option to dig through bedrock or dirt, we always
choose dirt as it takes less time. 

To implement UCS, we can use a priority queue data structure. Notice that this
is quite similar to BFS, but instead we prioritize cases that have a lower cost
over cases that have a higher cost (e.g. dirt over bedrock). Thus, we simply
perform the search as we would in BFS, except consider the weight of each path.
Psuedocode for Dijkstra's would look something like:

```python
function Dijkstra(Graph, source):
      for each vertex v in Graph.Vertices:
          dist[v] ← INFINITY
          prev[v] ← UNDEFINED
          add v to Q
      dist[source] ← 0
      
      while Q is not empty:
          u ← vertex in Q with min dist[u]
          remove u from Q
          
          for each neighbor v of u still in Q:
              alt ← dist[u] + Graph.Edges(u, v)
              if alt < dist[v]:
                  dist[v] ← alt
                  prev[v] ← u

      return dist[], prev[]
```

## A* Algorithm

The A* algorithm is an extension of Dijkstra's algorithm. It aims to find the
shortest path from a starting point to a target point in a graph, taking both
the actual cost of the path from the starting point and an estimated cost to
reach the target into account. In the context of our example, A* would be used
to find both the shortest path to reach the diamond and the most efficient way
(exploring as little locations as possible). However, it assumes we know some
extra information about the location of our diamond (in reality, it is common to
know extra information about a goal).

To implement A\*, we use something called a heuristic function to estimate the
cost of reaching the target from any given location. In our example, we could
consider the distance between our location and the location of the diamond.
Then, similar to Dijkstra's we iterate layer by layer, considering the weight of
each path, in addition to the heuristic weight of each path. We always choose
the shortest path. Psuedocode for A\* would look something like:

```python
function reconstruct_path(cameFrom, current)
    total_path := {current}
    while current in cameFrom.Keys:
        current := cameFrom[current]
        total_path.prepend(current)
    return total_path

function A_Star(start, goal, h)
    openSet := {start}

    cameFrom := an empty map

    gScore := map with default value of Infinity
    gScore[start] := 0

    fScore := map with default value of Infinity
    fScore[start] := h(start)

    while openSet is not empty
        current := the node in openSet having the lowest fScore[] value
        if current = goal
            return reconstruct_path(cameFrom, current)

        openSet.Remove(current)
        for each neighbor of current
            tentative_gScore := gScore[current] + d(current, neighbor)
            if tentative_gScore < gScore[neighbor]
                cameFrom[neighbor] := current
                gScore[neighbor] := tentative_gScore
                fScore[neighbor] := tentative_gScore + h(neighbor)
                if neighbor not in openSet
                    openSet.add(neighbor)

    return failure
```

## Final Implementation

Let's observe these algorithms in action in a grid consisting of:
- A yellow starting square
- An orange ending square
- Black "concrete" that can be easily traversed through
- Blue "puddles" that cannot be traversed through
- Green "grass" that can be traversed through at higher weight cost

Where the goal is to traverse from the yellow square to the orange square.

![Algorithms in action](algorithm.gif)

Some things to notice:
- DFS traverses one long path before finding the goal
- BFS, UCS, and A\* each slowly search outwards depending on the weights

I've only scratched the surface of what these algorithms are capable of. For
example, some 
real-world applications of these algorithms include but are not
limited to network routing, web crawling, GPS systems, and transportation 
logitics. There exist many more complex search algorithms and techniques
in the fields of statistics and machine learning that I hope to learn more about
in the future (perhaps simulations or the 3D visualization of techniques like
graident descent where decision-making happens in multiple dimensions).

As for now, thanks for reading.  
The core content of this article is based on a programming 
assignment by professor [Gao Sicun](https://jacobsschool.ucsd.edu/node/3603) 
for his class CSE150B, Introduction to AI: Search and Reasoning.
