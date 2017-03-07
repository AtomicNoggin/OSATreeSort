/*
Opportunistic self-adjusting tree sort

a binary sort tree that segmentally self adjusts as it walks new values down the tree
providing progressivley optimized paths for subsiquent sort values, especially if values
are already (or mostly) sorted.
*/
OSATreeSort = (function()) {
/*
 walk the tree three positions at a time, (first, mid & last)
 so each step results one of the following conditions:

// less than two postions left:
// open || lt open || gt open
// drop in place

gt lt [open] or lt gt [open]
  split first & mid, stop
so  b -> a  becomes  b
          c         a c
       [ ] d           d

and  c -> d becomes   c
         b           b d
        a [ ]       a

 gt gt [open] or lt lt [open]
  place as last, pivot mid, stop
  so d -> a  becomes   c
            c        a  d
           b [ ]      b

 and  a -> d becomes   b
         b           a   d
      [ ] c             c


 gt lt [gt] && lt gt [lt]
  pivot last, step to mid
 so c -> a     becomes   a
          d               b
        [b]           c -> d
                        [ ]

 gt lt [lt] && lt gt [gt]
 pivot last, step to last
 so b -> a becomes   a
           d      b-> c
         [c]       [ ] d

 lt lt [gt] && gt gt [lt]
  pivot last, step to mid
  so c -> a   becomes  a
           b             d
            [d]        b  <- c
                        [ ]
  so b -> d   becomes  c
         c       b -> a d
        a             [ ]

 lt lt [lt] && gt gt [gt]
  pivot mid, step to last
  so d -> a   becomes  b
           b          a c <- d
           [c]          [ ]
 and a -> d   becomes  c
         c       a -> b d
       [b]          [ ]

*/
function walkTree(value, first, adding) {
    var delta, isFirst = true,
        isLast = true,
        check1 = '',
        check2 = '',
        check3 = '',
        mid, last, compare = first.tree.compare;
    //if adding, treat matches as gt to preserve insertion order, if not, return matches
    check1 = (delta = compare(value, first.value)) < 0 ? 'lt' : adding || delta > 0 ? 'gt' : return {
        'node': first,
        'check': 'match',
        'done': true
    };
    while (mid = first[check1]) {
        check2 = (delta = compare(value, mid.value)) < 0 ? 'lt' : adding || delta > 0 ? 'gt' : return {
            'node': mid,
            'check': 'match',
            'done': true
        };
        last = mid[check2];
        if (last) { //will need another step, adjust accordingly
            check3 = (delta = compare(value, last.value)) < 0 ? 'lt' : adding || delta > 0 ? 'gt' : return {
                'node': last,
                'check': 'match',
                'done': true
            };
            if (check1 == check2 && check2 == check3) {
                mid.pivot();
                isFirst = (isFirst && check3 == 'lt');
                isLast = (isLast && check3 == 'gt');
            } else {
                last.pivot();
                isFirst = isLast = false;
            }
            first = (check2 == check3) ? last : mid;
            check1 = (check2 == check3) ? check3 : check2;
        } else { //no last. done;
            if (check1 == check2) {
                mid.pivot();
                return {
                    'node': mid,
                    'check': check2,
                    'done': true,
                    'isFirst': (isFirst && check2 == 'lt'),
                    'isLast': (isLast && check2 == 'gt')
                };
            } else {
                //assume calling method will perform a split.
                return {
                    'node': first,
                    'check': check1,
                    'done': true,
                    'isFirst': false,
                    'isLast': false
                };
            }
        }
    }
    //no mid. done
    return {
        'node': first,
        'check': check1,
        'done': true,
        'isFirst': (isFirst && check1 == 'lt'),
        'isLast': (isLast && check1 == 'gt')
    };
}



function OSATreeSort(compareFunc, unique) {
    this.compare = compareFunc || function(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
    }

    //TODO: convert to getters
    this.uinque = unique;
    this.first = this.last = this.top = null;
}
OSATreeSort.fromArray = function(array, comapareFunc) {
    var osa = new OSATreeSort(compareFunc)
    for (var i = 0; i < array.length; i++) {
        osa.add(array[i]);
    }
    return osa;
}
//TODO: OSATreeSort.fromJSON()

function OSATreeNode(value, tree) {
    //TODO: convert to getter/setter
    this.top = this.gt = this.lt = null;
    this.tree = tree;

    //TODO: convert to getters
    this.value = value;
}

OSATreeSort.prototype.findNode = function(matching) {
    if (!this.top) {
        return null;
    } else {
        var result = walkTree(value, this.top);

        if (result.check === 'match') {
            var node = result.node,
                prev = !this.unique && node.previous();
            while (prev && this.compare(node, prev) === 0) {
                node = prev;
                prev = node.previous();
            }
            return node;
        } else {
            return null;
        }
    }
}
OSATreeSort.prototype.findMatchingNodes = function(from,to) {
  var start, end, delta, result, next;
  if (!this.top) {
      return null;
  } else {
      delta = to typeof !== 'undefined' ? this.compare(from,to) : 0;
      result = walkTree( delta < 1 ? from : to, this.top);
      if (!delta && result.check !== 'match') {
        return [];
      }
      start = result.node, next = result.check === 'match' && !this.unique && node.previous();
      while (next && this.compare(start.value, next.value) === 0) {
          start = next, next = node.previous();
      }
      result = delta !== 0 ? walkTree(delta > 0 ? from : to, this.top) : result;
      end = result.node, next = result.check === 'match' && !this.unique && node.next();
      while (next && this.compare(end.value, next.value) === 0) {
          end = next, next = end.next();
      }
      result = [];
      do  {
        result.push(start);
      } while (start !== end && (start = start.next());
      return result;
  }
}

//add a new value to the tree.
OSATreeSort.prototype.add = function add(value) {
    checks = 0;
    var node = new OSATreeNode(value, this);
    if (!this.top) {
        this.top = this.first = this.last = node;
    } else {
        //if unique is true, walk the tree like a find so it stops at a match.
        var result = walkTree(value, this.top, !this.unique);
        //only insert non matches.
        if (result.check !== 'match') {
            if (result.node[result.check]) {
                node.split(result.node, result.node[result.check]);
            } else {
                node.top = result.node;
                result.node[result.check] = node;
            }
            if (result.isFirst) {
                this.first = node;
            }
            if (result.isLast) {
                this.last = node;
            }
        }
    }
}
//TODO: OSATreeSort.prototype.merge(tree[[,...],tree]) // combine two or more trees together
//TODO: OSATreeSort.prototype.prune(matching[,until]) //remove nodes matching values & return a new tree with those values (inclusive).
//TODO: OSATreeSort.prototype.findAllNodes(matching[,until]) //return an array of all the nodes values between the two values (inclusive)
//TODO: OSATreeSort.prototype.toJSON()

if (Symbol && Symbol.iterator) {
    OSATreeSort.prototype[Symbol.iterator] = function*() {
        var node = this.first;
        while (node) {
            yield node.value;
            node = node.next();
        }
    }
    OSATreeSort.prototype.toIterator = OSATreeSort.prototype[Symbol.iterator];
    OSATreeSort.prototype.toArray = function() {
        return [...this];
    }
} else {
    OSATreeSort.prototype.toIterator = function() {
        var next = this.first;
        return {
            'next': function() {
                var current = next;
                if (current) {
                    next = current.next();
                }
                return {
                    'value': current && current.value || undefined,
                    'done': !current
                };
            }
        }
    }
    //walk the tree and return the sorted values.
    OSATreeSort.prototype.toArray = function toArray() {
        var array = [];
        var node = this.first;
        while (node) {
            array.push(node.value);
            node = node.next();
        }
        return array;
    }
}
OSATreeSort.prototype.toJSON = function() {
  return JSON.parse(
    JSON.stringify(this.top,function(key,value) {
      if (key === 'value') {
        return JSON.stringify(value); //avoid running the value through this filter function
      }
      else if (name === 'top' || typeof value === 'function')
        return undefined
      }
      return value;
    }),function (key,value) {
      if (key == 'value') {
        return JSON.parse(value); //re-parse the value back to it's original form
      }
      return value;
    });
}
OSATreeNode.prototype.next = function() {
    var node = this;
    if (node.tree.last === node) {
        return null;
    }
    if (node.gt) {
        node = node.gt;
        while (node.lt) {
            node = node.lt;
        }
    } else if (node.top) {
        while (node.top && node.top.gt == node) {
            node = node.top;
        }
        node = node.top;
    }
    return node !== this ? node : null;
}
OSATreeNode.prototype.previous = function() {
    var node = this;
    if (node.tree.first === node) {
        return null;
    }
    if (node.lt) {
        node = node.lt;
        while (node.gt) {
            node = node.gt;
        }
    } else if (node.top) {
        while (node.top && node.top.lt == node) {
            node = node.top;
        }
        node = node.top;
    }
    return node !== this ? node : null;
}
//TODO: OSATreeNode.prototype.remove() // pull

//TODO: move to closured, private function
// check down the tree up to two postions from the first node passed in
// either place the current node in the tree, or pass back the next node to step from
// to check in a subsiquent step and the result of it's comparison to speed up proccessing.
// also adjust the tree to partially optimize its structure
OSATreeNode.prototype.step = function step(forAddfirst, check) {
    var check1 = '',
        check2 = '',
        mid,
        last;
    //previous steps will pass back the nodes check value so we don't need to do it twice.
    check1 = check ? check : this.tree.compare(this.value, first.value) < 0 ? 'lt' : 'gt';
    //treat == as gt to keep insertion integrity
    mid = first[check1];
    if (mid) {
        check2 = this.tree.compare(this.value, mid.value) < 0 ? 'lt' : 'gt';
        last = mid[check2];
        if (last) { //will need another step
            if (check1 == check2) {
                check1 = this.tree.compare(this.value, last.value) < 0 ? 'lt' : 'gt';
                if (check1 == check2) {
                    this.isFirst = this.isFirst && check1 == 'lt';
                    this.isLast = this.isLast && check1 == 'gt';
                    mid.pivot()
                    return {
                        'node': last,
                        'check': check1,
                        done: false,
                    };
                } else {
                    this.isFirst = this.isLast = false;
                    last.pivot();
                    return {
                        'node': mid,
                        'check': check2
                    };
                }
            } else {
                this.isFirst = this.isLast = false;
                check1 = this.tree.compare(this.value, last.value) < 0 ? 'lt' : 'gt';
                last.pivot();
                return check1 == check2 ? {
                    'node': last,
                    'check': check1
                } : {
                    'node': mid,
                    'check': check2
                };
            }
        } else { //no last. drop;
            if (check1 == check2) {
                this.isFirst = this.isFirst && check2 == 'lt';
                this.isLast = this.isLast && check2 == 'gt';
                mid.pivot();
                mid[check2] = this;
                this.top = mid;
                return null;
            } else {
                this.isFirst = this.isLast = false;
                this.split(first, mid);
                return null;
            }
        }
    } else { //no mid. drop
        this.isFirst = this.isFirst && check1 == 'lt';
        this.isLast = this.isLast && check1 == 'gt';
        first[check1] = this;
        this.top = first;
        return;
    }
}
// Pivot this node "up" & move the node above it
// either left or right, based on current positioning
OSATreeNode.prototype.pivot = function pivot() {
    var top = this.top;
    if (!top) {
        return;
    }
    if (top.top) {
        this.top = top.top;
        if (top.top.gt == top) {
            top.top.gt = this;
        } else {
            top.top.lt = this;
        }
    } else {
        this.top = null;
        this.tree.top = this;
    }
    top.top = this;
    if (top.gt == this) {
        top.gt = null;
        if (this.lt) {
            this.lt.top = top;
            top.gt = this.lt
        }
        this.lt = top;
    } else { //top.lt == this
        top.lt = null;
        if (this.gt) {
            this.gt.top = top;
            top.lt = this.gt;
        }
        this.gt = top;
    }
}

//TODO: move to internal private function
//Make this node the topmost of the two given nodes,
//where first is currently the parent of last
//and last is either left or right of first
// ASSUMEs current node is not currentl in the tree
OSATreeNode.prototype.split = function split(first, last) {
    if (first.top) {
        this.top = first.top;
        if (first.top.gt == first) {
            first.top.gt = this;
        } else {
            first.top.lt = this;
        }
    } else {
        this.tree.top = this;
    }
    first.top = this;
    if (first.gt == last) {
        first.gt = null;
        this.lt = first;
        this.gt = last;
    } else {
        first.lt = null;
        this.gt = first;
        this.lt = last;
    }
    last.top = this;
}
return OSATreeSort;
})();
/*
function display(node, div) {
    div.innerText = node.value;
    div.style.textAlign = "center";
    if (node.lt) {
        var ltDiv = document.createElement('div');
        ltDiv.style.float = 'left';
        ltDiv.style.marginTop = '1em';
        div.appendChild(ltDiv);
        display(node.lt, ltDiv);
    }
    if (node.gt) {
        var gtDiv = document.createElement('div');
        gtDiv.style.float = 'right';
        gtDiv.style.marginTop = '1em';
        div.appendChild(gtDiv);
        display(node.gt, gtDiv);
    }
}
pow = 1, binary = checks = length = 0;
osa = new OSATreeSort();
for (a = 1000000; a--; osa.add((Math.random() * 1000000) >> 0)) {
    if (pow < length) {
        binary += 1;
        pow <<= 1;
    }
    if (!(length % 100)) console.log('length:', length, 'steps:', checks, 'bin max:', binary, pow);
}*/


booking[0][sdfgt][0][asdfasdf]=8&
name split("[\[\]]+")
values
