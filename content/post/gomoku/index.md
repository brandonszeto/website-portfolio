---
author : "Brandon Szeto"
title : "Gomoku with Monte Carlo Tree Search"
date : "2023-05-17"
description : "An AI agent implemented using Monte Carlo Tree Search, the same
algorithm Google DeepMind's AlphaGo used to defeat the South Korean Go Champion
Lee Sedol."
tags : [
    "pygame",
    "python",
]
categories : [
    "ai",
]
image : ""
math: true
toc: true
draft: false
---

## Introduction
Before we get can program the AI agent, let's briefly touch on the math
that will dictate how this AI agent will make its decisions: Monte Carlo
Methods and Multi-Armed Bandits (Which will later all be put together in a
search tree).

## Monte Carlo Methods
Monte Carlo methods are a class of algorithms that use random sampling to obtain
numerical results for various kinds of problems.
Named after the famous Monte Carlo Casino in Monaco, Monte Carlo Methods 
are a class of algorithms that use random sampling to obtain numerical 
results for various kinds of problems.

Here's a neat application of Monte Carlo methods in action:

{{< youtube ELetCV_wX_c >}}

We can estimate $\pi$ by simply counting the number of random samples that land
inside the circle divided by the number of random samples that land outside the
circle.

$$ 4 \cdot \frac{N_{inner}}{N_{total}} \rightarrow \pi $$

More generally, we can write:

$$\frac{1}{n} \sum_{i = 1}^n X_i \rightarrow E(X)$$

Clearly, as the number of samples increases, the better our approximation of our
numerical result will be. But in reality, we do not have access to infinite
random samples or data points to approximate a problem. Thus, we must strike a
balance between exploration and exploitation.

## Multi-Armed Bandits

Exploration versus exploitation is a classic problem in probability theory,
summarized as: 
[Multi-Armed Bandits](https://en.wikipedia.org/wiki/Multi-armed_bandit). 
The name is derived from a metaphor involving a gambler playing a row
of slot machines (also known as "one-armed bandits"). 

In this problem, we are faced with $N$ different slot machines, each with its
own unknown probability distribution for payout. We are tasked with figuring out
which machine to play at each turn in order to maximize our prize pool over a
given number of turns. Thus, we want to first "explore" our options then
"exploit" the best option we have seen so far. This can also be considered a
real-world approach to applying Monte Carlo methods.

This video gives a simple example of what Multi-Armed Bandits are:

{{< youtube e3L4VocZnnQ >}}

Two algorithms that have been developed to solve multi-armed bandit problems
include the Epsilon-Greedy and Upper Confidence Bound (UCB) algorithms, both of
which our algorithm depends on.

### Regret

Let's define regret over time (of a specific strategy) $\sigma$ to as the
expected loss over time compared to the best possible outcome of our game. This
looks something like:

$$ R_{\sigma}(t) = \mathbb{E}(\sum_{i = 0}^tX_{c^*} - \sum_{i = 0}^tX_{c_i})$$

This can be read as "the average of the optimal
choice minus my choice over the history of our game." 

Let's consider a game where we must guess
whether or not a coin lands heads or tails. We don't know if the coin is
weighted or not, and we are simply tasked with coming up with the best strategy
of picking heads or tails prior to each flip. Therefore, our regret would be the
number of times we guessed the coin incorrectly for $t$ total trials.

Now consider a plot of the
number of samples over time versus our running regret:

![Linear](linear.png)
![Uniformly Random](random.png)
![Sublinear](sublinear.png)

The purple line represents the case where our choice is completely correct. The
regret is always zero because we always correctly guess the outcome. 
The red line represents when our choices are always wrong. The
regret grows as quickly as it can (linear growth) because we make an incorrect 
guess for every sample.

But in reality, it would be near impossible to make an incorrect guess every
single time. Consider the blue line, where we make uniformly random guesses. The
regret grows half as quickly as it does in the case where we are completely
wrong as on average, we will get 50% correctly and 50% incorrectly.

What we want to achieve with our is the green line, our sublinear regret. The
intial increase in regret will be due to an "exploration" process where we test
out a few samples. Then once we get a good idea of how the game works based on
the samples we've seen, we expect minimal wrong cases (or increase in regret).

### Epsilon-Greedy
To achieve sublinear regret, consider the epsilon greedy method. Simply put, for
any round $t$, we compare the average reward of our choices and choose the one
with better empirical mean with probability of $1 - \epsilon$ and make a random
choice with probability $\epsilon$. Generally, $\epsilon$ is a small value.
Therefore, we will make the best choice we've seen so far a majority of the
time, while sometimes making new choices (to get new datapoints).

Consider the following two cases:

Here, the means are far apart. As a result, we will easily be able to identify
the better choice and and have no regret.

![Means far apart](separate.png)

However, things get complicated when the means are close together. Here, we
depict the case where it is possible to misidentify the better mean.

![Means close together](error.png)

Clearly, misidentification can only happen when $\triangle = \mu_2 - \mu_1 \leq 2
\epsilon$.
Without going into too much detail, by choosing an epsilon $\epsilon =
\sqrt{\frac{c\log T}{N}}$, where $N$ represents the number of independent and
identically distributed samples and $c$ is a variable to help us fine-tune
epsilon, we minimize regret in the epsilon-greedy case. This is based on 
[Hoeffding's Inequality](https://en.wikipedia.org/wiki/Hoeffding's_inequality).
In short, there is an upper bound on the probability that the sum of bounded
independent random variables will deviate from its expected value.

In general, this helps the epsilon-greedy method achieve a regret of
$$ \mathbb{E}[R_{\sigma}(N)] \approx O(N^{\frac{2}{3}}(K \log N)^{\frac{1}{3}})$$
which is sublinear! 🎉

### Upper Confidence Bound (UCB)

But we can do better. Notice how in the epsilon-greedy method, we are always
guaranteed a probability $\epsilon$ to make a random (likely suboptimal) 
choice. The goal of upper confidence bound tackles this problem by
adapting our plays based on actual performance. In this way, we can further
decrease our regret.

In essence, the upper confidence bound argues that after playing arm $i$ for
$$ n_i(t) \geq \frac{8 \log t}{\triangle_i^2}$$ The gap between $i^*$ (optimal
choice) and $i$ (our choice) can be identified, within $\frac{8 \log t}{\triangle_i^2}$ samples, 
and it should be very unlikely that arm $i$ can be played again. 
Again, without
going into too much detail, we are exploiting facts about normal 
overlapping concentrations, and taking note of the highest statistical potential.

In the end, we need to choose actions according to
$$ \text{max}_i \left( \overline{X}_i + \sqrt{\frac{2 \log (N)}{N_i}} \right)$$

Here, $\overline{X}_i$ represents the average reward of a given choice $i$, and
$\sqrt{\frac{2 \log (N)}{N_i}}$ indicates the "freshness" of a given choice $i$
(the more you choose $i$, the less fresh it becomes). Thus, the lowest possible
growth of regret using UCB is $O(\log (N))$, even smaller than before!

## Putting it all together: MCTS with UCT

How do we decide whether to keep going down into a subtree (exploit) or change
our focus to another subtree (explore)? 

![Monte Carlo Search Tree](tree.png)

We'll implement our UCB strategy into
the following process:

![MCTS with UCT Process](process.png)

### Psuedocode:
> **function** MCTS($s_{root}$)
>
> &emsp; **while** within computational budget **do**
>
> &emsp; &emsp; s $\leftarrow$ TreePolicy($s_{root}$)
>
> &emsp; &emsp; winner $\leftarrow$ DefaultPolicy($s$)
>
> &emsp; &emsp; Backup($s$, winner)
>
> &emsp; **end while**
>
> &emsp; **return** Action$\( \text{max}_{s' \in \text{children}(\text{root})} \frac{Q(s')}{N(s')} \)$
>
> **end function**

Here, the BestChild function represents our UCB strategy:

> **function** BestChild(s, c)
>
> &emsp; **return** Action$\( \text{max}_{s' \in \text{children}(\text{root})} \( \frac{Q(s')}{N(s')} + c \sqrt{ \frac{2 \ln N(s)}{N(s')}} \) \)$
>
> **end function**

The remaining functions represent basic tree traversals that will look something
like:

> **function** TreePolicy($s$)
>
> &emsp; **while** $s$ is not terminal **do**
>
> &emsp; &emsp; **if** $s$ is not fully expanded **then**
>
> &emsp; &emsp; &emsp; **return** Expand($s$)
>
> &emsp; &emsp; **else**
>
> &emsp; &emsp; &emsp; $s \leftarrow$ BestChild(s, c)
>
> &emsp; &emsp; **end if**
>
> &emsp; **end while**
>
> &emsp; **return** $s$
>
> **end function**

Here, we are in the explore stage of the multi-armed bandit problem, and are
using UCB (in the BestChild) function to expand the tree appropriately.

> **function** Expand($s$)
>
> &emsp; child $\leftarrow$ previously unexpanded child of $s$
>
> &emsp; Update the tree with (s, child)
>
> &emsp; **return** child
>
> **end function**

Expand is simply a subroutine to expand each child.

> **function** DefaultPolicy($s$)
>
> &emsp; **while** $s$ is not terminal **do**
>
> &emsp; &emsp; $s$ $\leftarrow$ random child of $s$
>
> &emsp; **end while**
>
> &emsp; **return** winner
>
> **end function**

Default policy is simply choosing a random child of a given leaf in the tree.

> **function** Backup(s, winner)
>
> &emsp; **while** $s$ is not Null **do**
>
> &emsp; &emsp; $N(s) \leftarrow N(s) + 1$
>
> &emsp; &emsp; $Q(s) \leftarrow Q(s) + \triangle(s, winner)$
>
> &emsp; &emsp; $s \leftarrow \text{parent}(s)$
>
> &emsp; **end while**
>
> **end function**

Backup backpropagates the result to the root.

This can be easily converted to simple Python and PyGame to simulate our newly
created agent versus a random agent. Using a computational budget of 1000
(iterations of our MCTS loop), we have a crude agent capable of beating a random
agent. 

![UCB Agent vs. Random Agent](gomoku.gif)

Clearly this agent does not perform nearly as well as Google Deepmind's AlphaGo.
However, we also didn't have access to the computing power of 1920 CPUs and 
280 GPUs! Further, AlphaGo made use of a huge database of human moves to train a
neural network through deep reinforcement learning, utilized a policy gradient,
and used train value predictions, all of which are out of scope of this simple
python program.

![Go world champion Lee Sedol loses second game to AlphaGo, 2016](lee.png)

### Conclusion

Thanks for reading!
The core content of this article is based on a programming 
assignment by professor [Gao Sicun](https://jacobsschool.ucsd.edu/node/3603) 
for his class CSE150B, Introduction to AI: Search and Reasoning.
