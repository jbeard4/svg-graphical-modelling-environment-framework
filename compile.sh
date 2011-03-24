#!/bin/sh
mkdir build
#/home/jacob/workspace/gsoc2010/scxml-js/py-run.sh --backend state behaviour/default.xml | js-beautify.sh > build/default.js
/home/jacob/workspace/gsoc2010/scxml-js/target/language-frontend-modules/sh/StatePatternStatechartGenerator.sh behaviour/default.xml > build/default.js
