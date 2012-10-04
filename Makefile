all: inspic.js inspic.css
	echo successed

SCRIPTS=script/include/underscore.js \
	script/include/backbone.js \
	script/include/jquery.colorPicker.js \
	script/templates.js \
	script/inspic.js \
	script/model.js \
	script/view.js \
	script/controller.js\
	script/preview.js\
	script/output.js \
	script/input.js \
	script/open.js \
	script/init.js

STYLES= css/normalize.css \
	css/colorPicker.css \
	css/style.css \
	css/sm_icons.css

inspic.js: $(SCRIPTS)
	cat $(SCRIPTS) >inspic.js

inspic.css: $(STYLES)
	cat $(STYLES) >inspic.css

css/style.css: css/style.less.css css/include.less
	lessc css/style.less.css >css/style.css
css/icons.css: css/icons.less.css css/include.less
	lessc css/icons.less.css >css/icons.css

sm_icons.css: inspic.css
	spritemapper inspic.css