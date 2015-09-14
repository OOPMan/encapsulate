===========
Encapsulate
===========

A JavaScript OO system


Contents
========

1. Introduction
2. Requirements
3. Usage
4. Tests


Introduction
============

Encapsulate is a compact OO system for JavaScript that allows you to easily
create object instantiators (You probably know these as classes) using a
combination of traits (Objects or functions providing members) and other
instantiators (You probably call this inheritance).

Encapsulate is similar to StampIt_ in many regards and `Ring.js`_ in others.

Much like StampIt_, Encapsulate allows you to construct instances using factory
functions that can easily be re-used by multiple instantiators (StampIt_ calls
these stamps).

Similar to `Ring.js`_, Encapsulate allows you to re-use your instantiators
(`Ring.js`_ calls these classes) for inheritance purposes. As with `Ring.js`_,
Encapsulate makes use of `C3 Linearization`_ to implemented a well-behaved
multiple-inheritance scheme.

.. _StampIt: https://github.com/stampit-org/stampit
.. _Ring.js: http://ringjs.neoname.eu/
.. _C3 Linearization: https://en.wikipedia.org/wiki/C3_linearization
