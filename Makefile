JS_FILES = \
	src/start.js \
	src/ns.js \
	src/Id.js \
	src/Svg.js \
	src/Transform.js \
	src/Cache.js \
	src/Url.js \
	src/Dispatch.js \
	src/Queue.js \
	src/Map.js \
	src/Layer.js \
	src/Image.js \
	src/GeoJson.js \
	src/TopoJson.js \
	src/Dblclick.js \
	src/Drag.js \
	src/Wheel.js \
	src/Arrow.js \
	src/Hash.js \
	src/Touch.js \
	src/Interact.js \
	src/Compass.js \
	src/Grid.js \
	src/Stylist.js \
	src/end.js

JS_COMPILER = \
	java -jar lib/google-compiler/compiler-20100616.jar \
	--charset UTF-8

all: mapsense.min.js mapsense.js

%.min.js: %.js
	$(JS_COMPILER) < $^ > $@

mapsense.min.js: mapsense.js
	rm -f $@
	$(JS_COMPILER) < mapsense.js >> $@

mapsense.js: $(JS_FILES) Makefile
	rm -f $@
	cat $(JS_FILES) >> $@
	chmod a-w $@

clean:
	rm -rf mapsense.js mapsense.min.js
