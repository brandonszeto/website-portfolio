---
author : "Brandon Szeto"
title : "My Neovim Configuration 2023"
date : "2023-07-18"
description: "Notes + :help for my own Neovim configuration. This blog post will
be updated until the end of 2023. I am mostly tweaking my configuration during
the summer as I have more time on my hands."
tags : [
    "lua",
    "vim",
]
categories : [
    "misc",
]
image : "nvim.png"
math: true
draft: false
---
## Intro
I use Neovim as my IDE/text editor. Learning vim shortcodes and getting familiar
with plugins has a learning curve, and this blog is meant to help me
remember the many shortcuts, motions, snippets, etc. that I have set up. My
configuration can be found [here](https://github.com/brandonszeto/nvim-config).

## Features (non-plugin) I want to better utilize:

### Command-line mode

| Shortcut | Function | Notes |
| -------- | -------- | ----- |
| `:%s/old/new` | Replace all occurrences of 'old' with 'new' | Omit `%` if in visual mode |
| `:%s/old/new/gc` | Replace all occurrences of 'old' with 'new' with confirmation | Omit `%` if in visual mode |
| `:ls` | List all open buffers | |
| `:noh` | Stop highlighting search term | Gets annoying |

### Normal mode

| Shortcut | Function | Notes |
| -------- | -------- | ----- |
| `%` | Jump to corresponding pair `()`, `[]`, or `{}` |  |
| `ge` | Jump backwards to end of word |  |
| `f)` | Jump to first occurrence of ')' |  |
| `t)` | Jump to character before first occurrence of ')' |  |
| `<leader>bp` | Go to previous buffer | Custom mapping, not default |
| `<leader>bn` | Go to next buffer | Custom mapping, not default |


### Macros
| Shortcut | Function | Notes |
| -------- | -------- | ----- |
| `qa` | Record macro with label a | Label can be any character (to distinguish between available macros) |
| `q` | Stop recording macro |  |
| `@a` | Run macro a | Can be preceded by number like `5@a` to run a five times |
| `@@` | Rerun last macro |  |

## Mappings

Setup default behavior of mappings:
```vim
local opts = { 
    noremap = true, -- Helps prevent unwanted behavior
    silent = true, -- Suppresses annoying messages
}
local keymap = vim.api.nvim_set_keymap
```

Set my leader key to space:
```vim
keymap("n", "<Space>", "<Nop>", opts)
vim.g.mapleader = " "
vim.g.maplocalleader = " "
```

Use `Ctrl + h/j/k/l` to navigate between windows:
```vim
keymap("n", "<C-h>", "<C-w>h", opts)
keymap("n", "<C-j>", "<C-w>j", opts)
keymap("n", "<C-k>", "<C-w>k", opts)
keymap("n", "<C-l>", "<C-w>l", opts)
```

Toggle File Tree (NvimTree) of a given directory:
```vim
keymap("n", "<leader>e", ":NvimTreeToggle<cr>", opts)
```

Move selected text right or left
```vim
keymap("v", "<", "<gv", opts)
keymap("v", ">", ">gv", opts)
```

Move selected text up or down
```vim
keymap("v", "J", ":move '>+1<CR>gv-gv", opts)
keymap("v", "K", ":move '<-2<CR>gv-gv", opts)
```

Cursor stays in place when joining lines
```vim
keymap("n", "J", "mzJ`z", opts)
```

Cursor stays in place using `Ctrl + d/u` 
```vim
keymap("n", "<C-d>", "<C-d>zz", opts)
keymap("n", "<C-u>", "<C-u>zz", opts)
```

Cursor stays in place during search
```vim
keymap("n", "n", "nzzzv", opts)
keymap("n", "N", "Nzzzv", opts)
```

Register is not changed on paste
```vim
keymap("x", "<leader>p", '"_dP', opts)
```

Navigate buffers without entering command mode
```vim
keymap("n", "<leader>bn", ":bnext<CR>", opts)
keymap("n", "<leader>bp", ":bprevious<CR>", opts)
```

## Plugins I want to better utilize

### 💤[lazy.nvim](https://github.com/folke/lazy.nvim)
Previously, I used [impatient.nvim](https://github.com/lewis6991/impatient.nvim)
and [packer.nvim](https://github.com/wbthomason/packer.nvim).
implemented a chunk cache and a module resolution cache to speed up loading Lua
modules and files. However, as of Neovim 0.9, this functionality is built into
the core Neovim codebase.

The functionality of impatient.nvim can be achieved by simply running
```vim
vim.loader.enable()
```

Other than a few changes in some keywords, like `setup` -> `init`, `requires` ->
`dependencies` and no more need for `module`, migrating from packer to lazy is
pretty simple; you can copy and past most large chunks of your configuration to
achieve the same functionality but with lazy loading. Full documentation of all
of lazy's features can be found [here](https://github.com/folke/lazy.nvim). I
plan to look into this later when I begin profiling the startuptime of my
configuration.

### [Tpope's](https://github.com/tpope) [surround.vim](https://github.com/tpope/vim-surround) and [commentary.vim](https://github.com/tpope/vim-commentary)

Here are some quick shortcuts involving parantheses using vim-surround:
| Shortcut | Function | Notes |
| -------- | -------- | ----- |
| `ysiw]`  | Places brackets around selected word | `word` -> `[word]` |
| `ysiw[`  | Places brackets around selected word with space | `word` -> `[ word ]` |
| `yss[` | Wrap entire line in brackets | Same functionality as above but whole line|
| `S[` | Surrounds selected (in visual mode) text with braces | Same functionality as above but with highlighted text |
| `ds]`  | Delete brackets around selected word | `[word]` -> `word` |
| `cs]"` | Change brackets around selected word | `[word]` -> `"word"` |
| `cs]<q>` | Change brackets around selected word to html tag| `[word]` -> `<q>word</q>`|
| `cst[` | Change html tag around selected word to brackets | `<q>word</q>` -> `[word]` |

Here are some quick shortcuts involving parantheses using vim-commentary:
| Shortcut | Function | Notes |
| -------- | -------- | ----- |
| `gcc` | Comment out a line |  |
| `gcap` | Comment out a paragraph | Or the target of any motion |
| `gc` | Comment out a selection | Visual mode |


### Some extras:
Here are some plugins that I use, but currently don't have much to talk about:

Productivity + Homework ([Read more here](https://brandonszeto.com/p/my-productivity-workflow-2023/)):
- [copilot.vim](https://github.com/github/copilot.vim)
- [markdown-preview.nvim](https://github.com/iamcco/markdown-preview.nvim)
- [nvim-orgmode](https://github.com/nvim-orgmode/orgmode)
- [UltiSnips](https://github.com/SirVer/ultisnips)
- [VimTeX](https://github.com/lervag/vimtex)

Aesthetics:
- [formatter.nvim](https://github.com/mhartington/formatter.nvim)
- [nvim-tree.lua](https://github.com/nvim-tree/nvim-tree.lua)
- [lualine.nvim](https://github.com/nvim-lualine/lualine.nvim)

Miscellaneous:
- [telescope.nvim](https://github.com/nvim-telescope/telescope.nvim)
- [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter)
- [vim-tmux-navigator](https://github.com/christoomey/vim-tmux-navigator)

Git Integration:
- [gitsigns.nvim](https://github.com/lewis6991/gitsigns.nvim)
- [fugitive.vim](https://github.com/tpope/vim-fugitive)
