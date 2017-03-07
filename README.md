# OSATreeSort
## Opportunistic self-adjusting tree sort

a binary sort tree that segmentally self adjusts as it walks new values down the tree
providing progressivley optimized paths for subsiquent sort values, especially if values
are already (or mostly) sorted.

osa = new OSATreeSort();
